import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Title, Text, Button, TextInput, IconButton, List, Divider, Portal, FAB, Menu, ActivityIndicator } from 'react-native-paper';
import CustomCard from '../components/CustomCard';
import CustomModal from '../components/CustomModal';
import { getWeeklyTimetable, saveWeeklyTimetable } from '../utils/timetable';
import { getAllSubjects, addSubjectAttendance } from '../database/database';

// SubjectsList component to handle async loading of subjects
const SubjectsList = ({ onRemove, visible }) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setLoading(true);
        const availableSubjects = await getAllSubjects();
        setSubjects(availableSubjects);
      } catch (error) {
        console.error('Error loading subjects:', error);
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      loadSubjects();
    }
  }, [visible]);

  if (loading) {
    return <ActivityIndicator style={{ margin: 20 }} />;
  }

  if (subjects.length === 0) {
    return <Text style={{ textAlign: 'center', margin: 20, fontStyle: 'italic' }}>No subjects available</Text>;
  }

  return subjects.map(subject => (
    <List.Item
      key={subject}
      title={subject}
      right={props => (
        <IconButton
          {...props}
          icon="delete"
          iconColor="#F44336"
          onPress={() => onRemove(subject)}
        />
      )}
    />
  ));
};

// SubjectButtons component for selecting subjects in the modal
const SubjectButtons = ({ onSelect, selectedSubject }) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customSubject, setCustomSubject] = useState('');

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setLoading(true);
        const availableSubjects = await getAllSubjects();
        setSubjects(availableSubjects);
      } catch (error) {
        console.error('Error loading subjects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, []);

  if (loading) {
    return <ActivityIndicator style={{ margin: 10 }} />;
  }

  if (subjects.length === 0) {
    return (
      <View style={{ padding: 10 }}>
        <Text style={{ fontStyle: 'italic', marginBottom: 10 }}>No subjects available</Text>
        <TextInput
          label="Enter a subject name"
          value={customSubject}
          onChangeText={text => {
            setCustomSubject(text);
            if (text.trim()) {
              onSelect(text.trim());
            }
          }}
          style={{ marginBottom: 10 }}
        />
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {subjects.map(subject => (
        <Button
          key={subject}
          mode={selectedSubject === subject ? 'contained' : 'outlined'}
          onPress={() => onSelect(subject)}
          style={{ margin: 4 }}
          labelStyle={{ fontSize: 12 }}
        >
          {subject}
        </Button>
      ))}
      <TextInput
        label="Custom Subject"
        value={customSubject}
        onChangeText={text => {
          setCustomSubject(text);
          if (text.trim()) {
            onSelect(text.trim());
          }
        }}
        style={{ marginTop: 10, width: '100%' }}
      />
    </View>
  );
};

const TimetableScreen = () => {
  const [timetable, setTimetable] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [isSubjectModalVisible, setIsSubjectModalVisible] = useState(false);
  const [isManageSubjectsVisible, setIsManageSubjectsVisible] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({
    subject: '',
    startTime: '',
    endTime: '',
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    loadTimetable();
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const availableSubjects = await getAllSubjects();
      setSubjects(availableSubjects);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadTimetable = async () => {
    try {
      const weeklyTimetable = await getWeeklyTimetable();
      setTimetable(weeklyTimetable);
    } catch (error) {
      console.error('Error loading timetable:', error);
    }
  };

  const showAddModal = async (day) => {
    setSelectedDay(day);
    setIsAddMode(true);
    setFormData({
      subject: '',
      startTime: '9:00',
      endTime: '10:00',
    });
    // Refresh subjects list before showing modal
    await loadSubjects();
    setIsModalVisible(true);
  };

  const showEditModal = async (day, classItem) => {
    setSelectedDay(day);
    setSelectedClass(classItem);
    setIsAddMode(false);
    setFormData({
      subject: classItem.subject,
      startTime: classItem.startTime,
      endTime: classItem.endTime,
    });
    // Refresh subjects list before showing modal
    await loadSubjects();
    setIsModalVisible(true);
  };

  const hideModal = () => {
    setIsModalVisible(false);
    setSelectedDay(null);
    setSelectedClass(null);
    setFormData({
      subject: '',
      startTime: '',
      endTime: '',
    });
  };

  const handleSave = async () => {
    if (!formData.subject || !formData.startTime || !formData.endTime) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    try {
      const updatedTimetable = { ...timetable };

      const oldSubject = selectedClass?.subject;
      const newSubject = formData.subject;
      const isSubjectChanged = !isAddMode && oldSubject !== newSubject;

      if (isAddMode) {
        // Add new class
        const newClass = {
          id: `${selectedDay}-${Date.now()}`,
          subject: formData.subject,
          startTime: formData.startTime,
          endTime: formData.endTime,
        };

        updatedTimetable[selectedDay] = [...(updatedTimetable[selectedDay] || []), newClass];
      } else {
        // Edit existing class
        updatedTimetable[selectedDay] = updatedTimetable[selectedDay].map(item =>
          item.id === selectedClass.id
            ? {
                ...item,
                subject: formData.subject,
                startTime: formData.startTime,
                endTime: formData.endTime,
              }
            : item
        );
      }

      // If subject was changed, update all classes with the old subject name
      if (isSubjectChanged) {
        const shouldUpdateAll = await new Promise(resolve => {
          Alert.alert(
            'Update All Classes',
            `Do you want to update all "${oldSubject}" classes to "${newSubject}"?`,
            [
              { text: 'No', onPress: () => resolve(false) },
              { text: 'Yes', onPress: () => resolve(true) },
            ],
            { cancelable: false }
          );
        });

        if (shouldUpdateAll) {
          // Update all classes with the old subject name
          Object.keys(updatedTimetable).forEach(day => {
            updatedTimetable[day] = updatedTimetable[day].map(cls =>
              cls.subject === oldSubject ? { ...cls, subject: newSubject } : cls
            );
          });
        }
      }

      // Sort classes by start time
      updatedTimetable[selectedDay].sort((a, b) => {
        const timeA = a.startTime.split(':').map(Number);
        const timeB = b.startTime.split(':').map(Number);
        return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
      });

      setTimetable(updatedTimetable);
      await saveWeeklyTimetable(updatedTimetable);
      hideModal();
    } catch (error) {
      console.error('Error saving timetable:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedDay || !selectedClass) return;

    try {
      const updatedTimetable = { ...timetable };
      updatedTimetable[selectedDay] = updatedTimetable[selectedDay].filter(
        item => item.id !== selectedClass.id
      );

      setTimetable(updatedTimetable);
      await saveWeeklyTimetable(updatedTimetable);
      hideModal();
    } catch (error) {
      console.error('Error deleting class:', error);
    }
  };

  const handleClearDay = async (day) => {
    try {
      const updatedTimetable = { ...timetable };
      updatedTimetable[day] = [];

      setTimetable(updatedTimetable);
      await saveWeeklyTimetable(updatedTimetable);
    } catch (error) {
      console.error('Error clearing day:', error);
    }
  };

  const getAvailableSubjects = async () => {
    try {
      // Get all subjects from the database
      const dbSubjects = await getAllSubjects();

      // Get subjects from timetable
      const timetableSubjects = new Set();
      Object.values(timetable).forEach(dayClasses => {
        dayClasses.forEach(cls => {
          if (cls.subject) {
            timetableSubjects.add(cls.subject);
          }
        });
      });

      // Combine both sets
      const allSubjects = new Set([...dbSubjects, ...timetableSubjects]);

      return Array.from(allSubjects).sort();
    } catch (error) {
      console.error('Error getting available subjects:', error);

      // Fallback to just timetable subjects
      const subjects = new Set();
      Object.values(timetable).forEach(dayClasses => {
        dayClasses.forEach(cls => {
          if (cls.subject) {
            subjects.add(cls.subject);
          }
        });
      });

      return Array.from(subjects).sort();
    }
  };

  const showManageSubjectsModal = async () => {
    try {
      // Refresh the subjects list before showing the modal
      setIsManageSubjectsVisible(true);
    } catch (error) {
      console.error('Error showing manage subjects modal:', error);
    }
  };

  const hideManageSubjectsModal = () => {
    setIsManageSubjectsVisible(false);
  };

  const handleRemoveSubject = async (subjectToRemove) => {
    try {
      // Confirm with the user
      const confirmed = await new Promise(resolve => {
        Alert.alert(
          'Remove Subject',
          `Are you sure you want to remove ${subjectToRemove} and all its classes?`,
          [
            { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
            { text: 'Remove', onPress: () => resolve(true), style: 'destructive' },
          ],
          { cancelable: false }
        );
      });

      if (!confirmed) return;

      // Remove all classes with this subject
      const updatedTimetable = { ...timetable };

      Object.keys(updatedTimetable).forEach(day => {
        updatedTimetable[day] = updatedTimetable[day].filter(cls => cls.subject !== subjectToRemove);
      });

      setTimetable(updatedTimetable);
      await saveWeeklyTimetable(updatedTimetable);

      Alert.alert('Success', `${subjectToRemove} has been removed from the timetable.`);
    } catch (error) {
      console.error('Error removing subject:', error);
      Alert.alert('Error', 'Failed to remove subject.');
    }
  };

  const showSubjectModal = () => {
    setNewSubject('');
    setIsSubjectModalVisible(true);
  };

  const hideSubjectModal = () => {
    setIsSubjectModalVisible(false);
    setNewSubject('');
  };

  const handleAddNewSubject = async () => {
    if (!newSubject.trim()) return;

    try {
      const subjects = await getAvailableSubjects();
      const subjectName = newSubject.trim();

      // Check if subject already exists
      if (subjects.includes(subjectName)) {
        Alert.alert('Subject Exists', 'This subject already exists.');
        return;
      }

      // Add the new subject to the first class of Monday (or create one)
      const updatedTimetable = { ...timetable };
      const monday = 'Monday';

      if (!updatedTimetable[monday]) {
        updatedTimetable[monday] = [];
      }

      // Create a new class with the new subject
      updatedTimetable[monday].push({
        id: `${monday}-${Date.now()}`,
        subject: subjectName,
        startTime: '9:00',
        endTime: '10:00',
      });

      // Save the updated timetable
      setTimetable(updatedTimetable);
      await saveWeeklyTimetable(updatedTimetable);

      // We no longer add an attendance record automatically
      // Just update the subjects list
      await loadSubjects();

      hideSubjectModal();

      Alert.alert('Success', `Subject "${subjectName}" added successfully.`);
    } catch (error) {
      console.error('Error adding new subject:', error);
      Alert.alert('Error', 'Failed to add new subject: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.headerContainer}>
          <Title style={styles.title}>Weekly Timetable</Title>
          <View style={styles.headerButtons}>
            <Button
              mode="contained"
              onPress={showSubjectModal}
              style={styles.addSubjectButton}
            >
              Add Subject
            </Button>
            <IconButton
              icon="cog"
              size={24}
              onPress={() => setMenuVisible(true)}
            />
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={<View />}
              style={styles.menu}
            >
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  showManageSubjectsModal();
                }}
                title="Manage Subjects"
                leadingIcon="book-edit"
              />
            </Menu>
          </View>
        </View>

      {days.map(day => (
        <CustomCard key={day} style={styles.card}>
          <CustomCard.Content>
            <View style={styles.dayHeader}>
              <Title>{day}</Title>
              <View style={styles.dayActions}>
                <IconButton
                  icon="plus"
                  size={24}
                  onPress={() => showAddModal(day)}
                />
                <IconButton
                  icon="delete-sweep"
                  size={24}
                  iconColor="#F44336"
                  onPress={() => handleClearDay(day)}
                />
              </View>
            </View>
            <Divider style={styles.divider} />

            {timetable[day]?.length > 0 ? (
              timetable[day].map(classItem => (
                <TouchableOpacity
                  key={classItem.id}
                  onPress={() => showEditModal(day, classItem)}
                >
                  <List.Item
                    title={classItem.subject}
                    description={`${classItem.startTime} - ${classItem.endTime}`}
                    right={props => (
                      <View style={styles.actionButtons}>
                        <IconButton
                          {...props}
                          icon="pencil"
                          size={20}
                          onPress={() => showEditModal(day, classItem)}
                        />
                        <IconButton
                          {...props}
                          icon="delete"
                          size={20}
                          iconColor="#F44336"
                          onPress={() => {
                            setSelectedDay(day);
                            setSelectedClass(classItem);
                            handleDelete();
                          }}
                        />
                      </View>
                    )}
                  />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>No classes scheduled</Text>
            )}
          </CustomCard.Content>
        </CustomCard>
      ))}
      </ScrollView>

      <CustomModal
        visible={isModalVisible}
        onDismiss={hideModal}
        contentContainerStyle={styles.modal}
      >
        <Title>{isAddMode ? 'Add Class' : 'Edit Class'}</Title>
        <Text style={styles.dropdownLabel}>Subject:</Text>
        <View style={styles.subjectSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {/* Render available subjects as buttons */}
            {subjects.map(subject => (
              <Button
                key={subject}
                mode={formData.subject === subject ? 'contained' : 'outlined'}
                onPress={() => setFormData({ ...formData, subject })}
                style={styles.subjectButton}
                labelStyle={styles.subjectButtonLabel}
              >
                {subject}
              </Button>
            ))}
          </ScrollView>
        </View>
        <TextInput
          label="Subject (or enter a new one)"
          value={formData.subject}
          onChangeText={text => setFormData({ ...formData, subject: text })}
          style={styles.input}
        />
        <TextInput
          label="Start Time (e.g., 9:00)"
          value={formData.startTime}
          onChangeText={text => setFormData({ ...formData, startTime: text })}
          style={styles.input}
        />
        <TextInput
          label="End Time (e.g., 10:00)"
          value={formData.endTime}
          onChangeText={text => setFormData({ ...formData, endTime: text })}
          style={styles.input}
        />

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={hideModal}
            style={styles.button}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.button}
            disabled={!formData.subject || !formData.startTime || !formData.endTime}
          >
            Save
          </Button>
        </View>

        {!isAddMode && (
          <Button
            mode="outlined"
            onPress={handleDelete}
            style={[styles.button, styles.deleteButton]}
            textColor="#F44336"
          >
            Delete
          </Button>
        )}
      </CustomModal>
      <CustomModal
        visible={isSubjectModalVisible}
        onDismiss={hideSubjectModal}
        contentContainerStyle={styles.modal}
      >
        <Title>Add New Subject</Title>
        <TextInput
          label="Subject Name"
          value={newSubject}
          onChangeText={setNewSubject}
          style={styles.input}
        />
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={hideSubjectModal}
            style={styles.button}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleAddNewSubject}
            style={styles.button}
            disabled={!newSubject.trim()}
          >
            Add
          </Button>
        </View>
      </CustomModal>

      <CustomModal
        visible={isManageSubjectsVisible}
        onDismiss={hideManageSubjectsModal}
        contentContainerStyle={styles.modal}
      >
        <Title>Manage Subjects</Title>
        <ScrollView style={styles.subjectsList}>
          <SubjectsList onRemove={handleRemoveSubject} visible={isManageSubjectsVisible} />
        </ScrollView>
        <Button
          mode="outlined"
          onPress={hideManageSubjectsModal}
          style={styles.button}
        >
          Close
        </Button>
      </CustomModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
  },
  addSubjectButton: {
    marginLeft: 8,
  },
  menu: {
    marginTop: 40,
  },
  subjectsList: {
    maxHeight: 300,
    marginVertical: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    marginVertical: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 16,
    fontStyle: 'italic',
    color: '#757575',
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  deleteButton: {
    marginTop: 16,
    borderColor: '#F44336',
  },
  subjectSelector: {
    marginVertical: 8,
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

export default TimetableScreen;
