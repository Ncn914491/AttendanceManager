import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Title, TextInput, Button, List, IconButton } from 'react-native-paper';
import CustomCard from '../components/CustomCard';
import { addAttendance } from '../database/database';

const ExtraClassesScreen = () => {
  const [subject, setSubject] = useState('');
  const [time, setTime] = useState('');
  const [extraClasses, setExtraClasses] = useState([]);

  const addExtraClass = async () => {
    if (!subject || !time) return;

    const newClass = {
      id: Date.now(),
      subject,
      time,
      date: new Date().toISOString().split('T')[0],
    };

    try {
      await addAttendance(newClass.date, 'present', `Extra Class: ${subject}`);
      setExtraClasses([...extraClasses, newClass]);
      setSubject('');
      setTime('');
    } catch (error) {
      console.error('Error adding extra class:', error);
    }
  };

  const removeExtraClass = (id) => {
    setExtraClasses(extraClasses.filter(c => c.id !== id));
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Extra Classes</Title>

      <CustomCard style={styles.inputCard}>
        <CustomCard.Content>
          <TextInput
            label="Subject"
            value={subject}
            onChangeText={setSubject}
            style={styles.input}
          />
          <TextInput
            label="Time"
            value={time}
            onChangeText={setTime}
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={addExtraClass}
            disabled={!subject || !time}
            style={styles.button}
          >
            Add Extra Class
          </Button>
        </CustomCard.Content>
      </CustomCard>

      <Title style={styles.subtitle}>Today's Extra Classes</Title>
      {extraClasses.map(classItem => (
        <List.Item
          key={classItem.id}
          title={classItem.subject}
          description={`Time: ${classItem.time}`}
          right={props => (
            <IconButton
              {...props}
              icon="delete"
              onPress={() => removeExtraClass(classItem.id)}
            />
          )}
        />
      ))}
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
  subtitle: {
    marginTop: 24,
    marginBottom: 16,
    fontSize: 20,
  },
  inputCard: {
    marginBottom: 16,
    elevation: 4,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
  },
});

export default ExtraClassesScreen;