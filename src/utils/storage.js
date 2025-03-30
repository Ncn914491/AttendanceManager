import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for AsyncStorage
const STORAGE_KEYS = {
  USER_SETTINGS: '@user_settings',
  THEME: '@theme',
  LAST_SYNC: '@last_sync',
};

// Test function to verify AsyncStorage setup
export const testAsyncStorage = async () => {
  try {
    // Test writing data
    await AsyncStorage.setItem('@test_key', 'test_value');
    console.log('AsyncStorage write test successful');

    // Test reading data
    const value = await AsyncStorage.getItem('@test_key');
    console.log('AsyncStorage read test successful:', value);

    // Test removing data
    await AsyncStorage.removeItem('@test_key');
    console.log('AsyncStorage remove test successful');

    return true;
  } catch (error) {
    console.error('AsyncStorage test failed:', error);
    return false;
  }
};

// User Settings
export const saveUserSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving user settings:', error);
    return false;
  }
};

export const getUserSettings = async () => {
  try {
    const settings = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
    return settings ? JSON.parse(settings) : null;
  } catch (error) {
    console.error('Error getting user settings:', error);
    return null;
  }
};

// Theme
export const saveTheme = async (theme) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
    return true;
  } catch (error) {
    console.error('Error saving theme:', error);
    return false;
  }
};

export const getTheme = async () => {
  try {
    const theme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
    return theme || 'light';
  } catch (error) {
    console.error('Error getting theme:', error);
    return 'light';
  }
};

// Last Sync
export const saveLastSync = async (timestamp) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp.toString());
    return true;
  } catch (error) {
    console.error('Error saving last sync:', error);
    return false;
  }
};

export const getLastSync = async () => {
  try {
    const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return timestamp ? parseInt(timestamp) : null;
  } catch (error) {
    console.error('Error getting last sync:', error);
    return null;
  }
};

// Clear all data
export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

export default AsyncStorage; 