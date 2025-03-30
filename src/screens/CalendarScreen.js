import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Card, Title, Button, Portal, Modal, TextInput, List, IconButton, Text, SegmentedButtons } from 'react-native-paper';
import { getAllAttendance, getAttendanceByDate, addAttendance, updateAttendance, deleteAttendance } from '../database/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HOLIDAYS_KEY = '@holidays';

const CalendarScreen = () => {
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [visible, setVisible] = useState(false);
  const [dayRecords, setDayRecords] = useState([]);
  const [editMode, setEditMode] = useState('view'); // 'view', 'add', 'edit'
  const [editStatus, setEditStatus] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editMultiplier, setEditMultiplier] = useState('1');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [holidayNote, setHolidayNote] = useState('');

  useEffect(() => {
    loadAttendanceData();
    loadHolidays();
  }, []);

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

      setVisible(false);
      setHolidayNote('');
    } catch (error) {
      console.error('Error saving holiday:', error);
    }
  };

  const showHolidayModal = (date) => {
    setSelectedDate(date);
    setVisible(true);
  };

  const hideHolidayModal = () => {
    setVisible(false);
    setSelectedDate(null);
    setHolidayNote('');
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Attendance Calendar</Title>
      
      <Card style={styles.card}>
        <Card.Content>
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
        </Card.Content>
      </Card>

      <Portal>
        <Modal
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
                  <TextInput
                    label="Subject"
                    value={editSubject}
                    onChangeText={setEditSubject}
                    style={styles.input}
                  />
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
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={visible}
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
        </Modal>
      </Portal>
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
});

export default CalendarScreen; 