import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Title, TextInput, Button, List, IconButton, Portal, Text } from 'react-native-paper';
import CustomCard from '../components/CustomCard';
import CustomModal from '../components/CustomModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@notes';

const NotesScreen = () => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [visible, setVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const storedNotes = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const saveNotes = async (updatedNotes) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const addNote = () => {
    if (!newNote.trim()) return;

    const updatedNotes = [
      ...notes,
      {
        id: Date.now(),
        text: newNote,
        date: new Date().toISOString(),
      },
    ];

    setNotes(updatedNotes);
    saveNotes(updatedNotes);
    setNewNote('');
  };

  const deleteNote = (id) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
  };

  const showNote = (note) => {
    setSelectedNote(note);
    setVisible(true);
  };

  const hideNote = () => {
    setVisible(false);
    setSelectedNote(null);
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Important Topics</Title>

      <CustomCard style={styles.inputCard}>
        <CustomCard.Content>
          <TextInput
            label="New Topic"
            value={newNote}
            onChangeText={setNewNote}
            style={styles.input}
            multiline
            numberOfLines={3}
          />
          <Button
            mode="contained"
            onPress={addNote}
            disabled={!newNote.trim()}
            style={styles.button}
          >
            Add Topic
          </Button>
        </CustomCard.Content>
      </CustomCard>

      {notes.map(note => (
        <List.Item
          key={note.id}
          title={note.text.substring(0, 50) + '...'}
          description={new Date(note.date).toLocaleDateString()}
          right={props => (
            <View style={styles.actions}>
              <IconButton
                {...props}
                icon="eye"
                onPress={() => showNote(note)}
              />
              <IconButton
                {...props}
                icon="delete"
                onPress={() => deleteNote(note.id)}
              />
            </View>
          )}
        />
      ))}

      <CustomModal
        visible={visible}
        onDismiss={hideNote}
        contentContainerStyle={styles.modal}
      >
          {selectedNote && (
            <View>
              <Title>Topic Details</Title>
              <Text style={styles.modalText}>{selectedNote.text}</Text>
              <Text style={styles.modalDate}>
                Added on: {new Date(selectedNote.date).toLocaleString()}
              </Text>
              <Button mode="contained" onPress={hideNote} style={styles.modalButton}>
                Close
              </Button>
            </View>
          )}
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
  actions: {
    flexDirection: 'row',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalText: {
    marginVertical: 16,
    fontSize: 16,
    lineHeight: 24,
  },
  modalDate: {
    color: '#666',
    marginBottom: 16,
  },
  modalButton: {
    marginTop: 8,
  },
});

export default NotesScreen;