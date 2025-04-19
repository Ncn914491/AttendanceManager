import React from 'react';
import { View, StyleSheet, Modal as RNModal } from 'react-native';
import { useTheme } from 'react-native-paper';

/**
 * A custom Modal component that doesn't rely on the problematic useLatestCallback hook
 */
const CustomModal = ({ 
  visible, 
  onDismiss, 
  contentContainerStyle, 
  children,
  ...rest 
}) => {
  const theme = useTheme();
  
  return (
    <RNModal
      transparent
      visible={visible}
      onRequestClose={onDismiss}
      animationType="fade"
      {...rest}
    >
      <View style={styles.backdrop}>
        <View 
          style={[
            styles.contentContainer, 
            { backgroundColor: theme.colors.surface },
            contentContainerStyle
          ]}
        >
          {children}
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 20,
    margin: 20,
    borderRadius: 8,
    elevation: 4,
    width: '90%',
    maxWidth: 500,
  },
});

export default CustomModal;
