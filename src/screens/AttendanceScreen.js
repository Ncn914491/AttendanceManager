import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, ProgressBar, Button, Portal, Modal, TextInput, IconButton, List } from 'react-native-paper';
import { getAllAttendance, getAttendanceBySubject, updateAttendance } from '../database/database';

const AttendanceScreen = () => {
  const [attendanceData, setAttendanceData] = useState({
    Mathematics: { present: 0, total: 0, records: [] },
    Physics: { present: 0, total: 0, records: [] },
    Chemistry: { present: 0, total: 0, records: [] },
  });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [visible, setVisible] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editMultiplier, setEditMultiplier] = useState('1');

  useEffect(() => {
    loadAttendanceData();
  }, []);

  const loadAttendanceData = async () => {
    try {
      const allAttendance = await getAllAttendance();
      const newData = { ...attendanceData };

      // Reset counters
      Object.keys(newData).forEach(subject => {
        newData[subject] = { present: 0, total: 0, records: [] };
      });

      allAttendance.forEach(record => {
        const subject = record.notes.split(': ')[1];
        if (newData[subject]) {
          const multiplier = record.multiplier || 1;
          newData[subject].total += multiplier;
          if (record.status === 'present') {
            newData[subject].present += multiplier;
          }
          newData[subject].records.push(record);
        }
      });

      setAttendanceData(newData);
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

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Attendance Statistics</Title>
      {Object.entries(attendanceData).map(([subject, data]) => (
        <Card key={subject} style={styles.card}>
          <Card.Content>
            <Title>{subject}</Title>
            <Paragraph>
              Present: {data.present} / {data.total} classes
            </Paragraph>
            <Paragraph>
              Percentage: {calculatePercentage(subject).toFixed(1)}%
            </Paragraph>
            <ProgressBar
              progress={data.total > 0 ? data.present / data.total : 0}
              color={calculatePercentage(subject) >= 75 ? '#4CAF50' : '#FFA000'}
              style={styles.progressBar}
            />
            
            <Title style={styles.subtitle}>Recent Records</Title>
            {data.records.slice(0, 5).map(record => (
              <List.Item
                key={record.id}
                title={`${new Date(record.date).toLocaleDateString()} - ${record.status}`}
                description={`Multiplier: ${record.multiplier || 1}`}
                right={props => (
                  <IconButton
                    {...props}
                    icon="pencil"
                    onPress={() => showEditModal(record)}
                  />
                )}
              />
            ))}
          </Card.Content>
        </Card>
      ))}

      <Portal>
        <Modal
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
});

export default AttendanceScreen; 