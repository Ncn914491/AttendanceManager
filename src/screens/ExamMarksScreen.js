import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, TextInput, Button, List, IconButton, Portal, Modal, Text, SegmentedButtons } from 'react-native-paper';
import { addExamMark, updateExamMark, deleteExamMark, getAllExamMarks } from '../database/database';

const ExamMarksScreen = () => {
  const [examMarks, setExamMarks] = useState([]);
  const [visible, setVisible] = useState(false);
  const [editMode, setEditMode] = useState('add'); // 'add' or 'edit'
  const [selectedMark, setSelectedMark] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    marks: '',
    totalMarks: '',
    weightage: '',
    examDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    loadExamMarks();
  }, []);

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
    if (!formData.subject || !formData.marks || !formData.totalMarks || !formData.weightage) return;

    try {
      const data = {
        subject: formData.subject,
        marks: parseFloat(formData.marks),
        totalMarks: parseFloat(formData.totalMarks),
        weightage: parseFloat(formData.weightage),
        examDate: formData.examDate,
        notes: formData.notes,
      };

      if (editMode === 'add') {
        await addExamMark(data.subject, data.marks, data.totalMarks, data.weightage, data.examDate, data.notes);
      } else if (editMode === 'edit' && selectedMark) {
        await updateExamMark(selectedMark.id, data.marks, data.totalMarks, data.weightage, data.notes);
      }

      await loadExamMarks();
      hideModal();
    } catch (error) {
      console.error('Error saving exam mark:', error);
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
        <Card key={mark.id} style={styles.card}>
          <Card.Content>
            <Title>{mark.subject}</Title>
            <Text>Date: {new Date(mark.exam_date).toLocaleDateString()}</Text>
            <Text>Marks: {mark.marks}/{mark.total_marks}</Text>
            <Text>Percentage: {calculatePercentage(mark.marks, mark.total_marks)}%</Text>
            <Text>Grade: {getGrade(calculatePercentage(mark.marks, mark.total_marks))}</Text>
            <Text>Weightage: {mark.weightage}%</Text>
            <Text>Weighted Score: {calculateWeightedScore(mark.marks, mark.total_marks, mark.weightage)}%</Text>
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
          </Card.Content>
        </Card>
      ))}

      <Portal>
        <Modal
          visible={visible}
          onDismiss={hideModal}
          contentContainerStyle={styles.modal}
        >
          <Title>{editMode === 'add' ? 'Add Exam Mark' : 'Edit Exam Mark'}</Title>
          <TextInput
            label="Subject"
            value={formData.subject}
            onChangeText={(text) => setFormData({ ...formData, subject: text })}
            style={styles.input}
          />
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
              disabled={!formData.subject || !formData.marks || !formData.totalMarks || !formData.weightage}
              style={styles.modalButton}
            >
              Save
            </Button>
          </View>
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
});

export default ExamMarksScreen; 