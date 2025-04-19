import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem('@onboarding_completed', 'true');
      // Instead of using reset, we'll reload the app by forcing a re-render
      // This will trigger the AppNavigator to check onboarding status again
      navigation.navigate('MainApp');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const features = [
    {
      icon: 'check-circle',
      title: 'Track Attendance',
      description: 'Mark attendance for your classes and view attendance statistics.',
    },
    {
      icon: 'calendar',
      title: 'Calendar View',
      description: 'View your attendance history and schedule in a calendar format.',
    },
    {
      icon: 'school',
      title: 'Exam Marks',
      description: 'Record and track your exam marks with grade calculations.',
    },
    {
      icon: 'note-text',
      title: 'Notes & Tasks',
      description: 'Keep track of important topics and assignments.',
    },
  ];

  return (
    <View style={styles.container}>
      <Surface style={styles.header}>
        <MaterialCommunityIcons name="school" size={80} color="#2196F3" />
        <Text style={styles.title}>Welcome to Attendance Manager</Text>
        <Text style={styles.subtitle}>Your personal academic companion</Text>
      </Surface>

      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <Surface key={index} style={styles.featureCard}>
            <MaterialCommunityIcons name={feature.icon} size={40} color="#2196F3" />
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </Surface>
        ))}
      </View>

      <Button
        mode="contained"
        onPress={handleComplete}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Get Started
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    borderRadius: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#2196F3',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  featuresContainer: {
    flex: 1,
    justifyContent: 'space-around',
  },
  featureCard: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
    alignItems: 'center',
    width: width - 32,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    color: '#333',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  button: {
    marginTop: 24,
    paddingVertical: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default OnboardingScreen;