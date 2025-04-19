import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, useTheme } from 'react-native-paper';

/**
 * A custom Card component that doesn't rely on the problematic useLatestCallback hook
 */
const CustomCard = ({ style, children, elevation = 1, ...rest }) => {
  const theme = useTheme();
  
  return (
    <Surface
      style={[
        {
          borderRadius: theme.roundness,
          backgroundColor: theme.colors.surface,
          elevation: elevation,
        },
        styles.card,
        style,
      ]}
      {...rest}
    >
      {children}
    </Surface>
  );
};

/**
 * A custom Card.Content component
 */
const CardContent = ({ style, children, ...rest }) => {
  return (
    <View style={[styles.content, style]} {...rest}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 0,
  },
  content: {
    padding: 16,
  },
});

// Attach the CardContent component to the Card component
CustomCard.Content = CardContent;

export default CustomCard;
