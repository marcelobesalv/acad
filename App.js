import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ScrollView } from 'react-native';
import LogScreen from './src/screens/LogScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import { COLORS } from './src/constants/theme';

const Tab = createBottomTabNavigator();

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#121212', padding: 24, paddingTop: 60 }}>
          <Text style={{ color: '#F5C842', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>
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

function TabIcon({ label, focused }) {
  return (
    <Text
      style={{
        fontSize: 13,
        fontWeight: focused ? '700' : '400',
        color: focused ? COLORS.accent : COLORS.textSecondary,
      }}
    >
      {label}
    </Text>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: COLORS.background },
              headerTintColor: COLORS.text,
              headerTitleStyle: { fontWeight: '700' },
              tabBarStyle: {
                backgroundColor: COLORS.surface,
                borderTopColor: COLORS.border,
                height: 60,
                paddingBottom: 8,
              },
              tabBarShowLabel: false,
            }}
          >
            <Tab.Screen
              name="Log"
              component={LogScreen}
              options={{
                title: 'Log',
                tabBarIcon: ({ focused }) => <TabIcon label="Log" focused={focused} />,
              }}
            />
            <Tab.Screen
              name="History"
              component={HistoryScreen}
              options={{
                title: 'History',
                tabBarIcon: ({ focused }) => <TabIcon label="History" focused={focused} />,
              }}
            />
            <Tab.Screen
              name="Progress"
              component={ProgressScreen}
              options={{
                title: 'Progress',
                tabBarIcon: ({ focused }) => <TabIcon label="Progress" focused={focused} />,
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
