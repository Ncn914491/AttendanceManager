import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Title, TextInput, Button, List, IconButton, Portal, Text, SegmentedButtons, Divider } from 'react-native-paper';
import CustomCard from '../components/CustomCard';
import CustomModal from '../components/CustomModal';
import { addExamMark, updateExamMark, deleteExamMark, getAllExamMarks, getAllSubjects } from '../database/database';
import { getWeeklyTimetable } from '../utils/timetable';

const ExamMarksScreen = () => {
  const [examMarks, setExamMarks] = useState([]);
  const [visible, setVisible] = useState(false);
  const [editMode, setEditMode] = useState('add'); // 'add' or 'edit'
  const [selectedMark, setSelectedMark] = useState(null);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [formData, setFormData] = useState({
    subject: '',
    marks: '',
    totalMarks: '',
    weightage: '',
    examDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [customSubject, setCustomSubject] = useState('');

  useEffect(() => {
    loadExamMarks();
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      // Get all subjects from the database
      const subjects = await getAllSubjects();
      setAvailableSubjects(subjects);

      if (subjects.length === 0) {
        // Fallback to default subjects if none found
        setAvailableSubjects(['Mathematics', 'Computer Science']);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
      setAvailableSubjects(['Mathematics', 'Computer Science']);
    }
  };

  const loadExamMarks = async () => {
    try {
      const marks = await getAllExamMarks();
      setExamMarks(marks);
    } catch (error) {
      console.error('Error loading exam marks:', error);
    }
  };

  const showAddModal = () => {
    setEditMode('add');
    setFormData({
      subject: '',
      marks: '',
      totalMarks: '',
      weightage: '',
      examDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setSelectedMark(null);
    setVisible(true);
  };

  const showEditModal = (mark) => {
    setEditMode('edit');
    setFormData({
      subject: mark.subject,
      marks: mark.marks.toString(),
      totalMarks: mark.total_marks.toString(),
      weightage: mark.weightage.toString(),
      examDate: mark.exam_date,
      notes: mark.notes || '',
    });
    setSelectedMark(mark);
    setVisible(true);
  };

  const hideModal = () => {
    setVisible(false);
    setSelectedMark(null);
    setFormData({
      subject: '',
      marks: '',
      totalMarks: '',
      weightage: '',
      examDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const handleSave = async () => {
    // Determine the subject (either selected or custom)
    const subjectToUse = formData.subject || customSubject.trim();

    if (!subjectToUse || !formData.marks || !formData.totalMarks) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    try {
      // Parse numeric values, ensuring they are valid numbers
      const marks = parseFloat(formData.marks.replace(',', '.'));
      const totalMarks = parseFloat(formData.totalMarks.replace(',', '.'));
      let weightage = 0;

      if (formData.weightage && formData.weightage.trim() !== '') {
        weightage = parseFloat(formData.weightage.replace(',', '.'));
      }

      // Validate numeric values
      if (isNaN(marks) || isNaN(totalMarks) || (formData.weightage && isNaN(weightage))) {
        Alert.alert('Invalid Input', 'Please enter valid numbers for marks, total marks, and weightage.');
        return;
      }

      // Validate marks are not greater than total marks
      if (marks > totalMarks) {
        Alert.alert('Invalid Input', 'Marks cannot be greater than total marks.');
        return;
      }

      // Ensure date is in correct format
      let examDate = formData.examDate;
      if (!examDate || examDate.trim() === '') {
        examDate = new Date().toISOString().split('T')[0];
      }

      // Prepare data object
      const data = {
        subject: subjectToUse,
        marks: marks,
        totalMarks: totalMarks,
        weightage: weightage,
        examDate: examDate,
        notes: formData.notes || '',
      };

      console.log('Saving exam mark with data:', data);

      if (editMode === 'add') {
        await addExamMark(data.subject, data.marks, data.totalMarks, data.weightage, data.examDate, data.notes);
        Alert.alert('Success', 'Exam mark added successfully!');

        // If a new subject was added, refresh the subjects list
        if (customSubject.trim() && !availableSubjects.includes(customSubject.trim())) {
          await loadSubjects();
        }
      } else if (editMode === 'edit' && selectedMark) {
        await updateExamMark(selectedMark.id, data.marks, data.totalMarks, data.weightage, data.notes);
        Alert.alert('Success', 'Exam mark updated successfully!');
      }

      await loadExamMarks();
      hideModal();
    } catch (error) {
      console.error('Error saving exam mark:', error);
      Alert.alert('Error', 'Failed to save exam mark: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteExamMark(id);
      await loadExamMarks();
    } catch (error) {
      console.error('Error deleting exam mark:', error);
    }
  };

  const calculatePercentage = (marks, totalMarks) => {
    return ((marks / totalMarks) * 100).toFixed(1);
  };

  const calculateWeightedScore = (marks, totalMarks, weightage) => {
    return ((marks / totalMarks) * weightage).toFixed(1);
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Exam Marks</Title>

      <Button
        mode="contained"
        onPress={showAddModal}
        style={styles.addButton}
      >
        Add Exam Mark
      </Button>

      {examMarks.map(mark => (
        <CustomCard key={mark.id} style={styles.card}>
          <CustomCard.Content>
            <Title>{mark.subject}</Title>
            <Text>Date: {new Date(mark.exam_date).toLocaleDateString()}</Text>
            <Text>Marks: {mark.marks}/{mark.total_marks}</Text>
            <Text>Percentage: {calculatePercentage(mark.marks, mark.total_marks)}%</Text>
            <Text>Grade: {getGrade(calculatePercentage(mark.marks, mark.total_marks))}</Text>
            {mark.weightage > 0 && (
              <>
                <Text>Weightage: {mark.weightage}%</Text>
                <Text>Weighted Score: {calculateWeightedScore(mark.marks, mark.total_marks, mark.weightage)}%</Text>
              </>
            )}
            {mark.notes && <Text>Notes: {mark.notes}</Text>}

            <View style={styles.cardActions}>
              <IconButton
                icon="pencil"
                onPress={() => showEditModal(mark)}
              />
              <IconButton
                icon="delete"
                onPress={() => handleDelete(mark.id)}
              />
            </View>
          </CustomCard.Content>
        </CustomCard>
      ))}

      <CustomModal
        visible={visible}
        onDismiss={hideModal}
        contentContainerStyle={styles.modal}
      >
          <Title>{editMode === 'add' ? 'Add Exam Mark' : 'Edit Exam Mark'}</Title>
          <Text style={styles.dropdownLabel}>Subject:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectSelector}>
            {availableSubjects.map(subject => (
              <Button
                key={subject}
                mode={formData.subject === subject ? 'contained' : 'outlined'}
                onPress={() => {
                  setFormData({ ...formData, subject });
                  setCustomSubject('');
                }}
                style={styles.subjectButton}
                labelStyle={styles.subjectButtonLabel}
              >
                {subject}
              </Button>
            ))}
          </ScrollView>

          <Text style={styles.dropdownLabel}>Or enter a new subject:</Text>
          <TextInput
            label="Custom Subject"
            value={customSubject}
            onChangeText={(text) => {
              setCustomSubject(text);
              if (text.trim()) {
                setFormData({ ...formData, subject: '' });
              }
            }}
            style={styles.input}
          />
          <Divider style={styles.divider} />
          <TextInput
            label="Marks Obtained"
            value={formData.marks}
            onChangeText={(text) => setFormData({ ...formData, marks: text })}
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            label="Total Marks"
            value={formData.totalMarks}
            onChangeText={(text) => setFormData({ ...formData, totalMarks: text })}
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            label="Weightage (%)"
            value={formData.weightage}
            onChangeText={(text) => setFormData({ ...formData, weightage: text })}
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            label="Exam Date"
            value={formData.examDate}
            onChangeText={(text) => setFormData({ ...formData, examDate: text })}
            style={styles.input}
          />
          <TextInput
            label="Notes"
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            multiline
            numberOfLines={3}
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
              onPress={handleSave}
              disabled={(!formData.subject && !customSubject.trim()) || !formData.marks || !formData.totalMarks}
              style={styles.modalButton}
            >
              Save
            </Button>
          </View>
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
  addButton: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
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
  divider: {
    marginVertical: 12,
  },
});

export default ExamMarksScreen;