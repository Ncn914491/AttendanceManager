import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Title, Paragraph, Button, Portal, TextInput, IconButton, List, Text, Divider, Menu } from 'react-native-paper';
import CustomCard from '../components/CustomCard';
import CustomModal from '../components/CustomModal';
import CustomProgressBar from '../components/CustomProgressBar';
import { getAllAttendance, getAttendanceBySubject, getAttendanceByDate, updateAttendance, addSubjectAttendance, getAllSubjects, archiveAttendance, deleteAttendance } from '../database/database';
import { getWeeklyTimetable } from '../utils/timetable';
import { saveWeeklyTimetable } from '../utils/timetable';

const AttendanceScreen = ({ navigation }) => {
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [visible, setVisible] = useState(false);
  const [addVisible, setAddVisible] = useState(false);
  const [editNumbersVisible, setEditNumbersVisible] = useState(false);
  const [addSubjectVisible, setAddSubjectVisible] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editMultiplier, setEditMultiplier] = useState('1');
  const [addStatus, setAddStatus] = useState('present');
  const [addMultiplier, setAddMultiplier] = useState('1');
  const [manualPresent, setManualPresent] = useState('');
  const [manualTotal, setManualTotal] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newSubjectMultiplier, setNewSubjectMultiplier] = useState('1');
  const [overallAttendance, setOverallAttendance] = useState({ present: 0, total: 0, percentage: 0 });
  const [recordMenuVisible, setRecordMenuVisible] = useState(false);
  const [collapsedSubjects, setCollapsedSubjects] = useState({});


  useEffect(() => {
    const loadData = async () => {
      await loadSubjects();
      await loadAttendanceData();
    };
    loadData();
  }, []);

  const loadSubjects = async () => {
    try {
      // Get all subjects from the database
      const allSubjects = await getAllSubjects();

      // Initialize attendance data with all subjects
      const newData = {};
      allSubjects.forEach(subject => {
        newData[subject] = { present: 0, total: 0, records: [] };
      });

      // If no subjects found, add default subjects
      if (allSubjects.length === 0) {
        const timetable = await getWeeklyTimetable();
        const timetableSubjects = new Set();

        // Extract unique subjects from the timetable
        Object.values(timetable).forEach(dayClasses => {
          dayClasses.forEach(cls => {
            if (cls.subject) {
              timetableSubjects.add(cls.subject);
            }
          });
        });

        // Add timetable subjects to attendance data
        timetableSubjects.forEach(subject => {
          newData[subject] = { present: 0, total: 0, records: [] };
        });
      }

      setAttendanceData(newData);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadAttendanceData = async () => {
    try {
      const allAttendance = await getAllAttendance();
      const newData = { ...attendanceData };
      let totalPresent = 0;
      let totalClasses = 0;

      // Reset counters
      Object.keys(newData).forEach(subject => {
        newData[subject] = { present: 0, total: 0, records: [] };
      });

      allAttendance.forEach(record => {
        const parts = record.notes.split(': ');
        const subject = parts.length > 1 ? parts[1] : record.subject;

        if (newData[subject]) {
          const multiplier = record.multiplier || 1;
          newData[subject].total += multiplier;
          if (record.status === 'present') {
            newData[subject].present += multiplier;
          }
          newData[subject].records.push(record);
        } else if (subject) {
          // If subject doesn't exist in newData, add it
          newData[subject] = {
            present: record.status === 'present' ? (record.multiplier || 1) : 0,
            total: record.multiplier || 1,
            records: [record]
          };
        }
      });

      // Calculate overall attendance
      Object.values(newData).forEach(data => {
        totalPresent += data.present;
        totalClasses += data.total;
      });

      setAttendanceData(newData);
      setOverallAttendance({
        present: totalPresent,
        total: totalClasses,
        percentage: totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0
      });
    } catch (error) {
      console.error('Error loading attendance data:', error);
    }
  };

  const calculatePercentage = (subject) => {
    const data = attendanceData[subject];
    if (data.total === 0) return 0;
    return (data.present / data.total) * 100;
  };

  const showEditModal = (record) => {
    setSelectedRecord(record);
    setEditStatus(record.status);
    setEditMultiplier(record.multiplier?.toString() || '1');
    setVisible(true);
  };

  const hideEditModal = () => {
    setVisible(false);
    setSelectedRecord(null);
    setEditStatus('');
    setEditMultiplier('1');
  };

  const handleUpdateAttendance = async () => {
    if (!selectedRecord || !editStatus) return;

    try {
      const multiplier = parseInt(editMultiplier) || 1;
      await updateAttendance(selectedRecord.id, editStatus, multiplier);
      await loadAttendanceData();
      hideEditModal();
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };

  const showAddModal = (subject) => {
    setSelectedSubject(subject);
    setAddStatus('present');
    setAddMultiplier('1');
    setAddVisible(true);
  };

  const hideAddModal = () => {
    setAddVisible(false);
    setSelectedSubject(null);
    setAddStatus('present');
    setAddMultiplier('1');
  };

  const handleAddAttendance = async () => {
    if (!selectedSubject || !addStatus) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const multiplier = parseInt(addMultiplier) || 1;

      // Get all attendance records for today
      const todayRecords = await getAttendanceByDate(today);

      // Check if there's already an attendance record for this subject today
      const todayRecord = todayRecords.find(record => {
        // Check if the record is for this subject
        return record.subject === selectedSubject ||
               (record.notes && record.notes.includes(`Subject: ${selectedSubject}`));
      });

      if (todayRecord) {
        const confirmed = await new Promise(resolve => {
          Alert.alert(
            'Attendance Already Recorded',
            `You've already recorded attendance for ${selectedSubject} today. Would you like to update it?`,
            [
              { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
              { text: 'Update', onPress: () => resolve(true) },
            ]
          );
        });

        if (confirmed) {
          await updateAttendance(todayRecord.id, addStatus, multiplier);
          await loadAttendanceData();
          hideAddModal();
          Alert.alert('Success', 'Attendance updated successfully');
        }
        return;
      }

      await addSubjectAttendance(selectedSubject, today, addStatus, multiplier);
      await loadAttendanceData();
      hideAddModal();
      Alert.alert('Success', 'Attendance recorded successfully');
    } catch (error) {
      console.error('Error adding attendance:', error);
      Alert.alert('Error', 'Failed to record attendance');
    }
  };

  const handleQuickAdd = async (subject, status) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get all attendance records for today
      const todayRecords = await getAttendanceByDate(today);

      // Check if there's already an attendance record for this subject today
      const todayRecord = todayRecords.find(record => {
        // Check if the record is for this subject
        return record.subject === subject ||
               (record.notes && record.notes.includes(`Subject: ${subject}`));
      });

      if (todayRecord) {
        Alert.alert(
          'Attendance Already Recorded',
          `You've already recorded attendance for ${subject} today. Would you like to update it?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Update',
              onPress: async () => {
                await updateAttendance(todayRecord.id, status, 1);
                await loadAttendanceData();
                Alert.alert('Success', 'Attendance updated successfully');
              }
            },
          ]
        );
        return;
      }

      await addSubjectAttendance(subject, today, status, 1);
      await loadAttendanceData();
      Alert.alert('Success', 'Attendance recorded successfully');
    } catch (error) {
      console.error('Error adding quick attendance:', error);
      Alert.alert('Error', 'Failed to record attendance');
    }
  };

  const showEditNumbersModal = (subject) => {
    setSelectedSubject(subject);
    setManualPresent(attendanceData[subject]?.present.toString() || '0');
    setManualTotal(attendanceData[subject]?.total.toString() || '0');
    setEditNumbersVisible(true);
  };

  const hideEditNumbersModal = () => {
    setEditNumbersVisible(false);
    setSelectedSubject(null);
    setManualPresent('');
    setManualTotal('');
  };

  const handleUpdateNumbers = async () => {
    if (!selectedSubject) return;

    try {
      const present = parseInt(manualPresent) || 0;
      const total = parseInt(manualTotal) || 0;

      if (present > total) {
        Alert.alert('Invalid Input', 'Present classes cannot be more than total classes.');
        return;
      }

      // Update the attendance data in state
      const newData = { ...attendanceData };
      newData[selectedSubject] = {
        ...newData[selectedSubject],
        present,
        total
      };

      // Calculate overall attendance
      let totalPresent = 0;
      let totalClasses = 0;
      Object.values(newData).forEach(data => {
        totalPresent += data.present;
        totalClasses += data.total;
      });

      setAttendanceData(newData);
      setOverallAttendance({
        present: totalPresent,
        total: totalClasses,
        percentage: totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0
      });

      hideEditNumbersModal();

      // Note: This doesn't actually update the database records
      // It just updates the UI. In a real app, you'd want to sync this with the database.
      Alert.alert('Success', 'Attendance numbers updated successfully.');
    } catch (error) {
      console.error('Error updating attendance numbers:', error);
      Alert.alert('Error', 'Failed to update attendance numbers.');
    }
  };

  const showAddSubjectModal = () => {
    setNewSubject('');
    setNewSubjectMultiplier('1');
    setAddSubjectVisible(true);
  };

  const hideAddSubjectModal = () => {
    setAddSubjectVisible(false);
    setNewSubject('');
    setNewSubjectMultiplier('1');
  };

  const handleDelete = async (id) => {
    try {
      const confirmed = await new Promise(resolve => {
        Alert.alert(
          'Confirm Delete',
          'Are you sure you want to delete this record?',
          [
            { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
            { text: 'Delete', onPress: () => resolve(true), style: 'destructive' },
          ],
          { cancelable: false }
        );
      });

      if (confirmed) {
        await deleteAttendance(id);
        await loadAttendanceData();
        Alert.alert('Success', 'Record deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting attendance:', error);
      Alert.alert('Error', 'Failed to delete record');
    }
  };

  const handleArchive = async (id) => {
    try {
      await archiveAttendance(id);
      await loadAttendanceData();
      Alert.alert('Success', 'Record archived successfully');
    } catch (error) {
      console.error('Error archiving attendance:', error);
      Alert.alert('Error', 'Failed to archive record');
    }
  };

  const navigateToArchive = () => {
    navigation.navigate('AttendanceArchive');
  };

  const handleAddNewSubject = async () => {
    if (!newSubject.trim()) {
      Alert.alert('Missing Information', 'Please enter a subject name.');
      return;
    }

    try {
      const multiplier = parseInt(newSubjectMultiplier) || 1;
      const subjectName = newSubject.trim();

      // Add the new subject to the attendance data
      const newData = { ...attendanceData };

      // Check if subject already exists
      if (newData[subjectName]) {
        Alert.alert('Subject Exists', 'This subject already exists.');
        return;
      }

      // Add the new subject with zero attendance
      newData[subjectName] = {
        present: 0,
        total: 0,
        records: []
      };

      setAttendanceData(newData);
      hideAddSubjectModal();

      // We no longer add an initial attendance record automatically
      // The user will need to explicitly add attendance

      // Also add the subject to the timetable
      const timetable = await getWeeklyTimetable();
      let updated = false;

      // Check if the subject already exists in the timetable
      const subjectExists = Object.values(timetable).some(dayClasses => {
        return dayClasses.some(cls => cls.subject === subjectName);
      });

      // If not, add it to Monday
      if (!subjectExists) {
        const monday = 'Monday';
        if (!timetable[monday]) {
          timetable[monday] = [];
        }

        timetable[monday].push({
          id: `${monday}-${Date.now()}`,
          subject: subjectName,
          startTime: '9:00',
          endTime: '10:00',
        });

        await saveWeeklyTimetable(timetable);
        updated = true;
      }

      await loadAttendanceData();

      Alert.alert(
        'Success',
        `Subject "${subjectName}" added successfully with a multiplier of ${multiplier}.${
          updated ? '\n\nThe subject has also been added to your timetable.' : ''
        }`
      );
    } catch (error) {
      console.error('Error adding new subject:', error);
      Alert.alert('Error', 'Failed to add new subject: ' + error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Attendance Statistics</Title>

      <CustomCard style={styles.overallCard}>
        <CustomCard.Content>
          <Title>Overall Attendance</Title>
          <Paragraph>
            Present: {overallAttendance.present} / {overallAttendance.total} classes
          </Paragraph>
          <Paragraph>
            Percentage: {overallAttendance.percentage.toFixed(1)}%
          </Paragraph>
          <CustomProgressBar
            progress={overallAttendance.total > 0 ? overallAttendance.present / overallAttendance.total : 0}
            color={overallAttendance.percentage >= 75 ? '#4CAF50' : '#FFA000'}
            style={styles.progressBar}
          />
        </CustomCard.Content>
      </CustomCard>

      <Divider style={styles.divider} />
      {Object.entries(attendanceData).map(([subject, data]) => (
        <CustomCard key={subject} style={styles.card}>
          <CustomCard.Content>
            <View style={styles.headerRow}>
              <Title>{subject}</Title>
              <View style={styles.buttonRow}>
                <IconButton
                  icon="plus"
                  size={20}
                  onPress={() => handleQuickAdd(subject, 'present')}
                  style={[styles.iconButton, { backgroundColor: '#4CAF50' }]}
                  iconColor="white"
                />
                <IconButton
                  icon="pencil"
                  size={20}
                  onPress={() => showAddModal(subject)}
                  style={styles.iconButton}
                />
                <IconButton
                  icon="calculator"
                  size={20}
                  onPress={() => showEditNumbersModal(subject)}
                  style={styles.iconButton}
                />
                <IconButton
                  icon={collapsedSubjects[subject] ? 'chevron-down' : 'chevron-up'}
                  size={20}
                  onPress={() => {
                    setCollapsedSubjects(prev => ({
                      ...prev,
                      [subject]: !prev[subject]
                    }));
                  }}
                  style={styles.iconButton}
                />
              </View>
            </View>
            <Paragraph>
              Present: {data.present} / {data.total} classes
            </Paragraph>
            <Paragraph>
              Percentage: {calculatePercentage(subject).toFixed(1)}%
            </Paragraph>
            <CustomProgressBar
              progress={data.total > 0 ? data.present / data.total : 0}
              color={calculatePercentage(subject) >= 75 ? '#4CAF50' : '#FFA000'}
              style={styles.progressBar}
            />

            {!collapsedSubjects[subject] && (
              <>
                <Title style={styles.subtitle}>Recent Records</Title>
                {data.records.slice(0, 5).map(record => (
              <List.Item
                key={record.id}
                title={`${new Date(record.date).toLocaleDateString()} - ${record.status}`}
                description={`Multiplier: ${record.multiplier || 1}`}
                right={props => (
                  <View style={styles.cardActions}>
                    <IconButton
                      {...props}
                      icon="pencil"
                      size={20}
                      onPress={() => showEditModal(record)}
                    />
                    <IconButton
                      {...props}
                      icon="dots-vertical"
                      size={20}
                      onPress={() => {
                        setSelectedRecord(record);
                        setRecordMenuVisible(true);
                      }}
                    />
                    {selectedRecord && selectedRecord.id === record.id && (
                      <Menu
                        visible={recordMenuVisible}
                        onDismiss={() => {
                          setRecordMenuVisible(false);
                          setSelectedRecord(null);
                        }}
                        anchor={{ x: 0, y: 0 }}
                        style={styles.menu}
                      >
                        <Menu.Item
                          onPress={() => {
                            setRecordMenuVisible(false);
                            handleDelete(record.id);
                          }}
                          title="Delete"
                          leadingIcon="delete"
                        />
                        <Menu.Item
                          onPress={() => {
                            setRecordMenuVisible(false);
                            handleArchive(record.id);
                          }}
                          title="Archive"
                          leadingIcon="archive"
                        />
                      </Menu>
                    )}
                  </View>
                )}
              />
            ))}
              </>
            )}
          </CustomCard.Content>
        </CustomCard>
      ))}

      <CustomModal
        visible={visible}
        onDismiss={hideEditModal}
        contentContainerStyle={styles.modal}
      >
          {selectedRecord && (
            <View>
              <Title>Edit Attendance</Title>
              <TextInput
                label="Status"
                value={editStatus}
                onChangeText={setEditStatus}
                style={styles.input}
              />
              <TextInput
                label="Multiplier"
                value={editMultiplier}
                onChangeText={setEditMultiplier}
                keyboardType="numeric"
                style={styles.input}
              />
              <Button
                mode="contained"
                onPress={handleUpdateAttendance}
                style={styles.button}
              >
                Update
              </Button>
            </View>
          )}
      </CustomModal>

      <CustomModal
        visible={addVisible}
        onDismiss={hideAddModal}
        contentContainerStyle={styles.modal}
      >
        {selectedSubject && (
          <View>
            <Title>Add {selectedSubject} Attendance</Title>
            <View style={styles.statusButtons}>
              <Button
                mode={addStatus === 'present' ? 'contained' : 'outlined'}
                onPress={() => setAddStatus('present')}
                style={[styles.statusButton, { borderColor: '#4CAF50' }]}
                buttonColor={addStatus === 'present' ? '#4CAF50' : undefined}
              >
                Present
              </Button>
              <Button
                mode={addStatus === 'absent' ? 'contained' : 'outlined'}
                onPress={() => setAddStatus('absent')}
                style={[styles.statusButton, { borderColor: '#F44336' }]}
                buttonColor={addStatus === 'absent' ? '#F44336' : undefined}
              >
                Absent
              </Button>
            </View>
            <TextInput
              label="Multiplier"
              value={addMultiplier}
              onChangeText={setAddMultiplier}
              keyboardType="numeric"
              style={styles.input}
            />
            <Button
              mode="contained"
              onPress={handleAddAttendance}
              style={styles.button}
            >
              Add
            </Button>
          </View>
        )}
      </CustomModal>

      <CustomModal
        visible={editNumbersVisible}
        onDismiss={hideEditNumbersModal}
        contentContainerStyle={styles.modal}
      >
        {selectedSubject && (
          <View>
            <Title>Edit {selectedSubject} Attendance Numbers</Title>
            <TextInput
              label="Present Classes"
              value={manualPresent}
              onChangeText={setManualPresent}
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              label="Total Classes"
              value={manualTotal}
              onChangeText={setManualTotal}
              keyboardType="numeric"
              style={styles.input}
            />
            <Button
              mode="contained"
              onPress={handleUpdateNumbers}
              style={styles.button}
            >
              Update
            </Button>
          </View>
        )}
      </CustomModal>

      <CustomModal
        visible={addSubjectVisible}
        onDismiss={hideAddSubjectModal}
        contentContainerStyle={styles.modal}
      >
        <Title>Add New Subject</Title>
        <TextInput
          label="Subject Name"
          value={newSubject}
          onChangeText={setNewSubject}
          style={styles.input}
        />
        <TextInput
          label="Class Multiplier"
          value={newSubjectMultiplier}
          onChangeText={setNewSubjectMultiplier}
          keyboardType="numeric"
          style={styles.input}
        />
        <Text style={styles.helperText}>
          Multiplier determines how many classes are counted for each attendance record.
          For example, a multiplier of 4 means each class counts as 4 for attendance calculation.
        </Text>
        <Button
          mode="contained"
          onPress={handleAddNewSubject}
          style={styles.button}
          disabled={!newSubject.trim()}
        >
          Add Subject
        </Button>
      </CustomModal>

      <View style={styles.fabContainer}>
        <Button
          mode="contained"
          icon="plus"
          onPress={showAddSubjectModal}
          style={styles.fabButton}
        >
          Add Subject
        </Button>
      </View>
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
  overallCard: {
    marginBottom: 16,
    elevation: 4,
    backgroundColor: '#E8F5E9',
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  divider: {
    marginVertical: 16,
    height: 1,
  },
  subtitle: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 18,
  },
  progressBar: {
    marginTop: 8,
    height: 8,
    borderRadius: 4,
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    margin: 0,
    marginLeft: 4,
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  statusButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  fabContainer: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    alignItems: 'flex-end',
  },
  fabButton: {
    margin: 4,
    borderRadius: 28,
  },
  menu: {
    marginTop: 40,
  },
});

export default AttendanceScreen;