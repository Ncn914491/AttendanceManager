import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2196F3" />
      <Text style={styles.text}>Loading...</Text>
      <Text style={styles.subtext}>Please wait while we set up your app</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  subtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default LoadingScreen; 