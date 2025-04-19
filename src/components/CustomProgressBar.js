import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * A custom ProgressBar component that doesn't rely on the problematic ProgressBar component
 */
const CustomProgressBar = ({ progress = 0, color = '#2196F3', style }) => {
  // Ensure progress is between 0 and 1
  const safeProgress = Math.max(0, Math.min(1, progress));
  
  return (
    <View style={[styles.container, style]}>
      <View 
        style={[
          styles.progress, 
          { 
            width: `${Math.floor(safeProgress * 100)}%`,
            backgroundColor: color 
          }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: 4,
  },
});

export default CustomProgressBar;
