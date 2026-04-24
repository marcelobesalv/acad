import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ScrollView } from 'react-native';
import LogScreen      from './src/screens/LogScreen';
import HistoryScreen  from './src/screens/HistoryScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

const Tab = createBottomTabNavigator();

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0F0F0F', padding: 24, paddingTop: 60 }}>
          <Text style={{ color: '#60A5FA', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>
            Startup error — screenshot this:
          </Text>
          <ScrollView>
            <Text selectable style={{ color: '#fff', fontSize: 11 }}>
              {String(this.state.error)}{'\n\n'}{this.state.error?.stack}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const TAB_ICONS = { Log: '✏', History: '≡', Progress: '↑', Settings: '⚙' };

function TabIcon({ label, focused, theme }) {
  return (
    <Text style={{
      fontSize: 13,
      fontWeight: focused ? '700' : '400',
      color: focused ? theme.accent : theme.textSecondary,
    }}>
      {TAB_ICONS[label]} {label}
    </Text>
  );
}

function AppNavigator() {
  const { theme, mode } = useTheme();
  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Tab.Navigator
        screenOptions={{
          headerStyle:      { backgroundColor: theme.background },
          headerTintColor:  theme.text,
          headerTitleStyle: { fontWeight: '700' },
          tabBarStyle: {
            backgroundColor: theme.surface,
            borderTopColor:  theme.border,
            height: 60,
            paddingBottom: 8,
          },
          tabBarShowLabel: false,
        }}
      >
        <Tab.Screen name="Log"      component={LogScreen}
          options={{ title: 'Log',      tabBarIcon: ({ focused }) => <TabIcon label="Log"      focused={focused} theme={theme} /> }} />
        <Tab.Screen name="History"  component={HistoryScreen}
          options={{ title: 'History',  tabBarIcon: ({ focused }) => <TabIcon label="History"  focused={focused} theme={theme} /> }} />
        <Tab.Screen name="Progress" component={ProgressScreen}
          options={{ title: 'Progress', tabBarIcon: ({ focused }) => <TabIcon label="Progress" focused={focused} theme={theme} /> }} />
        <Tab.Screen name="Settings" component={SettingsScreen}
          options={{ title: 'Settings', tabBarIcon: ({ focused }) => <TabIcon label="Settings" focused={focused} theme={theme} /> }} />
      </Tab.Navigator>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
