import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Title, Button, Portal, TextInput, List, IconButton, Text, SegmentedButtons } from 'react-native-paper';
import CustomCard from '../components/CustomCard';
import CustomModal from '../components/CustomModal';
import { getAllAttendance, getAttendanceByDate, addAttendance, updateAttendance, deleteAttendance, addSubjectAttendance } from '../database/database';
import { getWeeklyTimetable } from '../utils/timetable';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HOLIDAYS_KEY = '@holidays';

const CalendarScreen = () => {
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [visible, setVisible] = useState(false);
  const [holidayModalVisible, setHolidayModalVisible] = useState(false);
  const [dayRecords, setDayRecords] = useState([]);
  const [editMode, setEditMode] = useState('view'); // 'view', 'add', 'edit'
  const [editStatus, setEditStatus] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editMultiplier, setEditMultiplier] = useState('1');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [holidayNote, setHolidayNote] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState([]);

  useEffect(() => {
    loadAttendanceData();
    loadHolidays();
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const timetable = await getWeeklyTimetable();
      const subjects = new Set();

      // Extract unique subjects from the timetable
      Object.values(timetable).forEach(dayClasses => {
        dayClasses.forEach(cls => {
          if (cls.subject) {
            subjects.add(cls.subject);
          }
        });
      });

      setAvailableSubjects(Array.from(subjects));
    } catch (error) {
      console.error('Error loading subjects:', error);
      setAvailableSubjects(['Mathematics', 'Computer Science']);
    }
  };

  const loadAttendanceData = async () => {
    try {
      const allAttendance = await getAllAttendance();
      const dates = {};

      allAttendance.forEach(record => {
        const existingDate = dates[record.date] || { marked: true, dots: [] };
        const dotColor = getStatusColor(record.status);

        existingDate.dots = [...(existingDate.dots || []), { color: dotColor }];
        dates[record.date] = existingDate;
      });

      setMarkedDates(dates);
    } catch (error) {
      console.error('Error loading attendance data:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return '#4CAF50';
      case 'absent':
        return '#F44336';
      case 'cancelled':
        return '#FFA000';
      default:
        return '#2196F3';
    }
  };

  const loadHolidays = async () => {
    try {
      const holidays = await AsyncStorage.getItem(HOLIDAYS_KEY);
      if (holidays) {
        const holidayDates = JSON.parse(holidays);
        const dates = {};

        Object.entries(holidayDates).forEach(([date, note]) => {
          dates[date] = {
            marked: true,
            dotColor: '#FFA000',
            note,
          };
        });

        setMarkedDates(prev => ({ ...prev, ...dates }));
      }
    } catch (error) {
      console.error('Error loading holidays:', error);
    }
  };

  const handleDayPress = async (day) => {
    setSelectedDate(day.dateString);
    try {
      const records = await getAttendanceByDate(day.dateString);
      setDayRecords(records);
      setVisible(true);
    } catch (error) {
      console.error('Error loading day records:', error);
    }
  };

  const showAddModal = () => {
    setEditMode('add');
    setEditStatus('');
    setEditSubject('');
    setEditMultiplier('1');
    setSelectedRecord(null);
  };

  const showEditModal = (record) => {
    setEditMode('edit');
    setEditStatus(record.status);
    setEditSubject(record.notes.split(': ')[1] || '');
    setEditMultiplier(record.multiplier?.toString() || '1');
    setSelectedRecord(record);
  };

  const hideModal = () => {
    setVisible(false);
    setSelectedDate(null);
    setDayRecords([]);
    setEditMode('view');
    setEditStatus('');
    setEditSubject('');
    setEditMultiplier('1');
    setSelectedRecord(null);
  };

  const handleSaveAttendance = async () => {
    if (!selectedDate || !editStatus || !editSubject) return;

    try {
      if (editMode === 'add') {
        await addAttendance(selectedDate, editStatus, `Class: ${editSubject}`, parseInt(editMultiplier) || 1);
      } else if (editMode === 'edit' && selectedRecord) {
        await updateAttendance(selectedRecord.id, editStatus, parseInt(editMultiplier) || 1);
      }
      await loadAttendanceData();
      hideModal();
    } catch (error) {
      console.error('Error saving attendance:', error);
    }
  };

  const handleDeleteAttendance = async (id) => {
    try {
      await deleteAttendance(id);
      await loadAttendanceData();
      hideModal();
    } catch (error) {
      console.error('Error deleting attendance:', error);
    }
  };

  const saveHoliday = async () => {
    if (!selectedDate || !holidayNote.trim()) return;

    try {
      const holidays = await AsyncStorage.getItem(HOLIDAYS_KEY);
      const holidayDates = holidays ? JSON.parse(holidays) : {};

      holidayDates[selectedDate] = holidayNote;
      await AsyncStorage.setItem(HOLIDAYS_KEY, JSON.stringify(holidayDates));

      setMarkedDates(prev => ({
        ...prev,
        [selectedDate]: {
          marked: true,
          dotColor: '#FFA000',
          note: holidayNote,
        },
      }));

      setHolidayModalVisible(false);
      setHolidayNote('');
    } catch (error) {
      console.error('Error saving holiday:', error);
    }
  };

  const showHolidayModal = (date) => {
    setSelectedDate(date);
    setHolidayModalVisible(true);
  };

  const hideHolidayModal = () => {
    setHolidayModalVisible(false);
    setSelectedDate(null);
    setHolidayNote('');
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Attendance Calendar</Title>

      <CustomCard style={styles.card}>
        <CustomCard.Content>
          <Calendar
            onDayPress={handleDayPress}
            markedDates={markedDates}
            markingType="multi-dot"
            theme={{
              todayTextColor: '#2196F3',
              selectedDayBackgroundColor: '#2196F3',
              selectedDayTextColor: '#ffffff',
              dotColor: '#2196F3',
            }}
          />
        </CustomCard.Content>
      </CustomCard>

      <CustomModal
        visible={visible}
        onDismiss={hideModal}
        contentContainerStyle={styles.modal}
      >
        {selectedDate && (
          <View>
            <Title>{new Date(selectedDate).toLocaleDateString()}</Title>

            {editMode === 'view' ? (
              <>
                <Button
                  mode="contained"
                  onPress={showAddModal}
                  style={styles.button}
                >
                  Add Attendance
                </Button>

                {dayRecords.map(record => (
                  <List.Item
                    key={record.id}
                    title={record.notes.split(': ')[1] || 'Unknown Subject'}
                    description={`Status: ${record.status} | Multiplier: ${record.multiplier || 1}`}
                    right={props => (
                      <IconButton
                        {...props}
                        icon="pencil"
                        onPress={() => showEditModal(record)}
                      />
                    )}
                  />
                ))}
              </>
            ) : (
              <>
                <View style={styles.subjectSelector}>
                  <Text style={styles.dropdownLabel}>Subject:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {availableSubjects.map(subject => (
                      <Button
                        key={subject}
                        mode={editSubject === subject ? 'contained' : 'outlined'}
                        onPress={() => setEditSubject(subject)}
                        style={styles.subjectButton}
                        labelStyle={styles.subjectButtonLabel}
                      >
                        {subject}
                      </Button>
                    ))}
                  </ScrollView>
                </View>
                <SegmentedButtons
                  value={editStatus}
                  onValueChange={setEditStatus}
                  buttons={[
                    { value: 'present', label: 'Present' },
                    { value: 'absent', label: 'Absent' },
                    { value: 'cancelled', label: 'Cancelled' },
                  ]}
                  style={styles.segmentedButtons}
                />
                <TextInput
                  label="Multiplier"
                  value={editMultiplier}
                  onChangeText={setEditMultiplier}
                  keyboardType="numeric"
                  style={styles.input}
                />
                <View style={styles.modalButtons}>
                  <Button
                    mode="outlined"
                    onPress={hideModal}
                    style={styles.modalButton}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleSaveAttendance}
                    disabled={!editStatus || !editSubject}
                    style={styles.modalButton}
                  >
                    Save
                  </Button>
                </View>
              </>
            )}
          </View>
        )}
      </CustomModal>

      <CustomModal
        visible={holidayModalVisible}
        onDismiss={hideHolidayModal}
        contentContainerStyle={styles.modal}
      >
        <Title>Mark Holiday</Title>
        <TextInput
          label="Holiday Note"
          value={holidayNote}
          onChangeText={setHolidayNote}
          style={styles.input}
          multiline
          numberOfLines={3}
        />
        <Button
          mode="contained"
          onPress={saveHoliday}
          disabled={!holidayNote.trim()}
          style={styles.button}
        >
          Save Holiday
        </Button>
      </CustomModal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    marginBottom: 16,
    fontSize: 24,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  input: {
    marginVertical: 8,
  },
  button: {
    marginTop: 16,
  },
  segmentedButtons: {
    marginVertical: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  subjectSelector: {
    marginVertical: 12,
  },
  dropdownLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subjectButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  subjectButtonLabel: {
    fontSize: 12,
  },
});

export default CalendarScreen;