import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Title, TextInput, Button, List, IconButton, Checkbox } from 'react-native-paper';
import CustomCard from '../components/CustomCard';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@todo_items';

const ToDoScreen = () => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      const storedTodos = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedTodos) {
        setTodos(JSON.parse(storedTodos));
      }
    } catch (error) {
      console.error('Error loading todos:', error);
    }
  };

  const saveTodos = async (updatedTodos) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTodos));
    } catch (error) {
      console.error('Error saving todos:', error);
    }
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;

    const updatedTodos = [
      ...todos,
      {
        id: Date.now(),
        text: newTodo,
        completed: false,
      },
    ];

    setTodos(updatedTodos);
    saveTodos(updatedTodos);
    setNewTodo('');
  };

  const toggleTodo = (id) => {
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(updatedTodos);
    saveTodos(updatedTodos);
  };

  const deleteTodo = (id) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    setTodos(updatedTodos);
    saveTodos(updatedTodos);
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Assignments</Title>

      <CustomCard style={styles.inputCard}>
        <CustomCard.Content>
          <TextInput
            label="New Assignment"
            value={newTodo}
            onChangeText={setNewTodo}
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={addTodo}
            disabled={!newTodo.trim()}
            style={styles.button}
          >
            Add Assignment
          </Button>
        </CustomCard.Content>
      </CustomCard>

      {todos.map(todo => (
        <List.Item
          key={todo.id}
          title={todo.text}
          left={props => (
            <Checkbox
              {...props}
              status={todo.completed ? 'checked' : 'unchecked'}
              onPress={() => toggleTodo(todo.id)}
            />
          )}
          right={props => (
            <IconButton
              {...props}
              icon="delete"
              onPress={() => deleteTodo(todo.id)}
            />
          )}
          titleStyle={todo.completed ? styles.completedText : null}
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
  completedText: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
});

export default ToDoScreen;