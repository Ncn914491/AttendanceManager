import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, Text, FAB, Portal, Modal } from 'react-native-paper';
import { addAttendance } from '../database/database';
import { getTimetable, saveTimetable, getDefaultTimetable } from '../utils/timetable';
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
  const [todayClasses, setTodayClasses] = useState([]);
  const [visible, setVisible] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    loadTimetable();
  }, []);

  const loadTimetable = async () => {
    try {
      const timetable = await getTimetable();
      if (timetable) {
        setTodayClasses(timetable);
      } else {
        const defaultTimetable = getDefaultTimetable();
        await saveTimetable(defaultTimetable);
        setTodayClasses(defaultTimetable);
      }
    } catch (error) {
      console.error('Error loading timetable:', error);
      setTodayClasses(getDefaultTimetable());
    }
  };

  const markAttendance = async (classId, status) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const classData = todayClasses.find(c => c.id === classId);
      
      await addAttendance(today, status, `Class: ${classData.subject}`);
      
      const updatedClasses = todayClasses.map(c =>
        c.id === classId ? { ...c, status } : c
      );
      
      setTodayClasses(updatedClasses);
      await saveTimetable(updatedClasses);
    } catch (error) {
      console.error('Error marking attendance:', error);
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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Title style={styles.title}>Today's Classes</Title>
        {todayClasses.map(classItem => (
          <Card key={classItem.id} style={styles.card}>
            <Card.Content>
              <Title>{classItem.subject}</Title>
              <Paragraph>Time: {classItem.time}</Paragraph>
              <View style={styles.buttonContainer}>
                <Button
                  mode={classItem.status === 'present' ? 'contained' : 'outlined'}
                  onPress={() => markAttendance(classItem.id, 'present')}
                  style={[styles.button, { borderColor: '#4CAF50' }]}
                  textColor={classItem.status === 'present' ? 'white' : '#4CAF50'}
                >
                  Present
                </Button>
                <Button
                  mode={classItem.status === 'absent' ? 'contained' : 'outlined'}
                  onPress={() => markAttendance(classItem.id, 'absent')}
                  style={[styles.button, { borderColor: '#F44336' }]}
                  textColor={classItem.status === 'absent' ? 'white' : '#F44336'}
                >
                  Absent
                </Button>
                <Button
                  mode={classItem.status === 'cancelled' ? 'contained' : 'outlined'}
                  onPress={() => markAttendance(classItem.id, 'cancelled')}
                  style={[styles.button, { borderColor: '#FFA000' }]}
                  textColor={classItem.status === 'cancelled' ? 'white' : '#FFA000'}
                >
                  Cancelled
                </Button>
              </View>
              {classItem.status && (
                <Text style={[styles.statusText, { color: getStatusColor(classItem.status) }]}>
                  Status: {classItem.status.charAt(0).toUpperCase() + classItem.status.slice(1)}
                </Text>
              )}
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <Portal>
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => navigation.navigate('Extra Classes')}
        />
      </Portal>
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
  title: {
    marginBottom: 16,
    fontSize: 24,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
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
  statusText: {
    marginTop: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default HomeScreen; 