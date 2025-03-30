import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, Button } from 'react-native';
import { testAsyncStorage } from './src/utils/storage';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase, testDatabase } from './src/database/database';
import LoadingScreen from './src/screens/LoadingScreen';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2196F3',
    secondary: '#03A9F4',
    error: '#B00020',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#000000',
    onSurface: '#000000',
    disabled: '#757575',
    placeholder: '#9E9E9E',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
  roundness: 8,
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <Text style={{ fontSize: 18, color: 'red', textAlign: 'center' }}>
            Something went wrong. Please restart the app.
          </Text>
          <Button
            title="Restart App"
            onPress={() => {
              this.setState({ hasError: false, error: null });
            }}
            style={{ marginTop: 16 }}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDatabase();
        console.log('Database initialized successfully');
        await testDatabase();
        console.log('Database test completed successfully');
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };
    initializeApp();
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <NavigationContainer
            fallback={<LoadingScreen />}
            onStateChange={(state) => {
              console.log('New navigation state:', state);
            }}
          >
            <AppNavigator />
            <StatusBar style="light" />
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
