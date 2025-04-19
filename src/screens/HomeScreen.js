import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Title, Paragraph, Button, Text, FAB, Portal, Modal, List, Checkbox, Divider } from 'react-native-paper';
import CustomCard from '../components/CustomCard';
import { addAttendance } from '../database/database';
import { getWeeklyTimetable } from '../utils/timetable';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@todo_items';

const HomeScreen = () => {
  const [todayClasses, setTodayClasses] = useState([]);
  const [currentDay, setCurrentDay] = useState('');
  const [visible, setVisible] = useState(false);
  const [weeklyTodos, setWeeklyTodos] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    loadTimetable();
    loadWeeklyTodos();
  }, []);

  const loadTimetable = async () => {
    try {
      const weeklyTimetable = await getWeeklyTimetable();

      // Get today's day name (e.g., "Monday")
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = days[new Date().getDay()];

      // If today is Sunday, show Saturday's classes as a fallback
      const dayToShow = today === 'Sunday' ? 'Saturday' : today;
      setCurrentDay(dayToShow);

      // Get classes for today (or Saturday if today is Sunday)
      const todayClasses = weeklyTimetable[dayToShow] || [];

      // Convert to the format expected by the UI
      const formattedClasses = todayClasses.map(cls => ({
        id: cls.id,
        subject: cls.subject,
        time: `${cls.startTime} - ${cls.endTime}`,
        status: null
      }));

      setTodayClasses(formattedClasses);
    } catch (error) {
      console.error('Error loading timetable:', error);
      setTodayClasses([]);
    }
  };

  const loadWeeklyTodos = async () => {
    try {
      const storedTodos = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedTodos) {
        const allTodos = JSON.parse(storedTodos);

        // Get current week's start and end dates
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // End on Saturday

        // Filter todos created in the current week
        const thisWeekTodos = allTodos.filter(todo => {
          const todoDate = new Date(todo.id); // Using ID as timestamp
          return todoDate >= startOfWeek && todoDate <= endOfWeek;
        });

        setWeeklyTodos(thisWeekTodos);
      }
    } catch (error) {
      console.error('Error loading todos:', error);
    }
  };

  const toggleTodo = async (id) => {
    try {
      const storedTodos = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedTodos) {
        const allTodos = JSON.parse(storedTodos);

        // Update the todo's completed status
        const updatedTodos = allTodos.map(todo =>
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );

        // Save back to storage
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTodos));

        // Update the weekly todos state
        setWeeklyTodos(weeklyTodos.map(todo =>
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ));
      }
    } catch (error) {
      console.error('Error toggling todo:', error);
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
        <Title style={styles.title}>{currentDay === new Date().toLocaleDateString('en-US', { weekday: 'long' }) ? 'Today' : currentDay}'s Classes</Title>
        {todayClasses.map(classItem => (
          <CustomCard key={classItem.id} style={styles.card}>
            <CustomCard.Content>
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
            </CustomCard.Content>
          </CustomCard>
        ))}

        <Title style={styles.title}>This Week's Assignments</Title>
        <CustomCard style={styles.card}>
          <CustomCard.Content>
            {weeklyTodos.length > 0 ? (
              weeklyTodos.map(todo => (
                <List.Item
                  key={todo.id}
                  title={todo.text}
                  left={props => (
                    <Checkbox
                      status={todo.completed ? 'checked' : 'unchecked'}
                      onPress={() => toggleTodo(todo.id)}
                    />
                  )}
                  titleStyle={todo.completed ? styles.completedText : null}
                />
              ))
            ) : (
              <Paragraph style={styles.emptyText}>No assignments for this week</Paragraph>
            )}
          </CustomCard.Content>
        </CustomCard>
      </ScrollView>

      <Portal>
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => navigation.navigate('Timetable')}
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
  completedText: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#757575',
    padding: 16,
  },
});

export default HomeScreen;