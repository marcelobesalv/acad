# Theme System & UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user-controlled dark/light mode + 5 accent color choices via a new Settings tab, and improve overall UI quality across all screens.

**Architecture:** A `ThemeContext` wraps the entire app and provides a `useTheme()` hook returning the full color object computed from `mode` + `accentKey`. Both values persist to AsyncStorage. All screens consume `useTheme()` instead of the static `COLORS` import.

**Tech Stack:** React Native 0.74, Expo SDK 51, `@react-native-async-storage/async-storage` 1.23.1, React Navigation bottom tabs v6.

---

## File Map

| File | Change |
|---|---|
| `src/constants/theme.js` | Full rewrite — `ACCENTS` map + `buildTheme(mode, accentKey)` |
| `src/context/ThemeContext.js` | New — `ThemeProvider` + `useTheme()` hook |
| `src/screens/SettingsScreen.js` | New — Settings tab UI (mode toggle + color swatches) |
| `App.js` | Wrap with `ThemeProvider`; add Settings tab; move tab bar styles into `AppNavigator` component that reads theme |
| `src/screens/LogScreen.js` | Replace static `COLORS` import with `useTheme()`; apply UI improvements |
| `src/screens/HistoryScreen.js` | Replace static `COLORS` import with `useTheme()`; fix exercise name color |
| `src/screens/ProgressScreen.js` | Replace static `COLORS` import with `useTheme()` |

---

## Task 1: Rewrite `src/constants/theme.js`

**Files:**
- Modify: `src/constants/theme.js`

- [ ] **Step 1: Replace the file contents**

```js
export const ACCENTS = {
  yellow: '#F5C842',
  blue:   '#60A5FA',
  teal:   '#34D399',
  coral:  '#FB923C',
  purple: '#A78BFA',
};

const DARK_BASE = {
  background:    '#0F0F0F',
  surface:       '#1A1A1A',
  surfaceAlt:    '#252525',
  text:          '#FFFFFF',
  textSecondary: '#9E9E9E',
  border:        '#2C2C2C',
  danger:        '#FF5252',
  onAccent:      '#000000',
};

const LIGHT_BASE = {
  background:    '#F2F2F7',
  surface:       '#FFFFFF',
  surfaceAlt:    '#E5E5EA',
  text:          '#1A1A1A',
  textSecondary: '#6C6C70',
  border:        '#D1D1D6',
  danger:        '#E53935',
  onAccent:      '#000000',
};

export function buildTheme(mode, accentKey) {
  const base = mode === 'dark' ? DARK_BASE : LIGHT_BASE;
  return { ...base, accent: ACCENTS[accentKey] ?? ACCENTS.blue };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/constants/theme.js
git commit -m "refactor: replace static COLORS with buildTheme + ACCENTS"
```

---

## Task 2: Create `src/context/ThemeContext.js`

**Files:**
- Create: `src/context/ThemeContext.js`

- [ ] **Step 1: Create the file**

```js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildTheme } from '../constants/theme';

const STORAGE_KEY_MODE   = '@theme_mode';
const STORAGE_KEY_ACCENT = '@theme_accent';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setModeState]           = useState('dark');
  const [accentKey, setAccentKeyState] = useState('blue');

  useEffect(() => {
    (async () => {
      const savedMode   = await AsyncStorage.getItem(STORAGE_KEY_MODE);
      const savedAccent = await AsyncStorage.getItem(STORAGE_KEY_ACCENT);
      if (savedMode)   setModeState(savedMode);
      if (savedAccent) setAccentKeyState(savedAccent);
    })();
  }, []);

  async function setMode(newMode) {
    setModeState(newMode);
    await AsyncStorage.setItem(STORAGE_KEY_MODE, newMode);
  }

  async function setAccent(newAccent) {
    setAccentKeyState(newAccent);
    await AsyncStorage.setItem(STORAGE_KEY_ACCENT, newAccent);
  }

  const theme = buildTheme(mode, accentKey);

  return (
    <ThemeContext.Provider value={{ theme, mode, accentKey, setMode, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/context/ThemeContext.js
git commit -m "feat: add ThemeContext with dark/light mode and accent persistence"
```

---

## Task 3: Create `src/screens/SettingsScreen.js`

**Files:**
- Create: `src/screens/SettingsScreen.js`

- [ ] **Step 1: Create the file**

```js
import React from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ACCENTS } from '../constants/theme';

const ACCENT_KEYS = ['yellow', 'blue', 'teal', 'coral', 'purple'];

export default function SettingsScreen() {
  const { theme: C, mode, accentKey, setMode, setAccent } = useTheme();

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.background }]}>
      <Text style={[s.sectionHeader, { color: C.textSecondary }]}>APPEARANCE</Text>

      <View style={[s.row, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Text style={[s.rowLabel, { color: C.text }]}>Dark Mode</Text>
        <Switch
          value={mode === 'dark'}
          onValueChange={v => setMode(v ? 'dark' : 'light')}
          trackColor={{ false: C.border, true: C.accent }}
          thumbColor={C.surface}
        />
      </View>

      <View style={[s.row, { backgroundColor: C.surface, borderColor: C.border, flexDirection: 'column', alignItems: 'flex-start' }]}>
        <Text style={[s.rowLabel, { color: C.text, marginBottom: 12 }]}>Accent Color</Text>
        <View style={s.swatches}>
          {ACCENT_KEYS.map(key => (
            <TouchableOpacity
              key={key}
              style={[
                s.swatch,
                { backgroundColor: ACCENTS[key] },
                key === accentKey && s.swatchSelected,
              ]}
              onPress={() => setAccent(key)}
            >
              {key === accentKey && (
                <Text style={s.swatchCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, padding: 16 },
  sectionHeader: {
    fontSize: 12, fontWeight: '600', letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: 8, marginLeft: 4,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1,
  },
  rowLabel:      { fontSize: 16, fontWeight: '500' },
  swatches:      { flexDirection: 'row', gap: 12 },
  swatch:        { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  swatchSelected:{ borderWidth: 3, borderColor: '#FFFFFF' },
  swatchCheck:   { color: '#000000', fontWeight: '700', fontSize: 18 },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/SettingsScreen.js
git commit -m "feat: add SettingsScreen with mode toggle and accent swatches"
```

---

## Task 4: Update `App.js`

**Files:**
- Modify: `App.js`

- [ ] **Step 1: Replace `App.js` entirely**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add App.js
git commit -m "feat: wrap app in ThemeProvider, add Settings tab, dynamic tab bar"
```

---

## Task 5: Update `src/screens/LogScreen.js`

**Files:**
- Modify: `src/screens/LogScreen.js`

UI improvements in this task:
- `useTheme()` replaces static `COLORS` import
- Date header formatted as `Thursday, Apr 24`
- Set number shown as a small filled circle badge
- Cards get a 3px left accent border
- `+ Add Exercise` button gets a left accent border (no fill)
- Modals get a 4px accent top bar and 16px corner radius

- [ ] **Step 1: Replace `src/screens/LogScreen.js` entirely**

```js
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, StyleSheet, Alert, KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getWorkoutByDate, saveWorkout, generateId, getTodayString } from '../storage/storage';
import { useTheme } from '../context/ThemeContext';

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function LogScreen() {
  const { theme: C, mode } = useTheme();
  const today = getTodayString();
  const [exercises, setExercises]         = useState([]);
  const [workoutId, setWorkoutId]         = useState(null);
  const [isSaving, setIsSaving]           = useState(false);
  const [exModalVisible, setExModalVisible] = useState(false);
  const [newExName, setNewExName]         = useState('');
  const [setModalVisible, setSetModalVisible] = useState(false);
  const [activeExIdx, setActiveExIdx]     = useState(null);
  const [newReps, setNewReps]             = useState('');
  const [newWeight, setNewWeight]         = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const existing = await getWorkoutByDate(today);
        if (active) {
          setExercises(existing?.exercises ?? []);
          setWorkoutId(existing?.id ?? null);
        }
      })();
      return () => { active = false; };
    }, [today])
  );

  function handleAddExercise() {
    const name = newExName.trim();
    if (!name) return;
    setExercises(prev => [...prev, { name, sets: [] }]);
    setNewExName('');
    setExModalVisible(false);
  }

  function openSetModal(idx) {
    setActiveExIdx(idx);
    setNewReps('');
    setNewWeight('');
    setSetModalVisible(true);
  }

  function handleAddSet() {
    const reps   = parseInt(newReps, 10);
    const weight = parseFloat(newWeight);
    if (!reps || reps <= 0 || !weight || weight <= 0) {
      Alert.alert('Invalid input', 'Enter valid reps and weight.');
      return;
    }
    setExercises(prev =>
      prev.map((ex, i) =>
        i === activeExIdx ? { ...ex, sets: [...ex.sets, { reps, weight }] } : ex
      )
    );
    setSetModalVisible(false);
  }

  function removeSet(exIdx, setIdx) {
    setExercises(prev =>
      prev.map((ex, i) =>
        i === exIdx ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) } : ex
      )
    );
  }

  function removeExercise(idx) {
    setExercises(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (exercises.length === 0) {
      Alert.alert('Nothing to save', 'Add at least one exercise first.');
      return;
    }
    setIsSaving(true);
    try {
      await saveWorkout({ id: workoutId ?? generateId(), date: today, exercises });
      Alert.alert('Saved', 'Workout saved successfully.');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.background }]}>
      <Text style={[s.dateHeader, { color: C.accent }]}>{formatDate(today)}</Text>

      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 16 }}>
        {exercises.map((ex, exIdx) => (
          <View key={exIdx} style={[s.card, { backgroundColor: C.surface, borderLeftColor: C.accent },
            mode === 'light' && { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }]}>
            <View style={s.cardHeader}>
              <Text style={[s.exName, { color: C.text }]}>{ex.name}</Text>
              <TouchableOpacity onPress={() => removeExercise(exIdx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={[s.danger, { color: C.danger }]}>Remove</Text>
              </TouchableOpacity>
            </View>

            {ex.sets.map((set, setIdx) => (
              <View key={setIdx} style={s.setRow}>
                <View style={[s.setBadge, { backgroundColor: C.accent }]}>
                  <Text style={[s.setBadgeText, { color: C.onAccent }]}>{setIdx + 1}</Text>
                </View>
                <Text style={[s.setVal, { color: C.text }]}>
                  {set.reps} reps × {set.weight} kg
                </Text>
                <TouchableOpacity onPress={() => removeSet(exIdx, setIdx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={[s.danger, { color: C.danger }]}>×</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={[s.addSetBtn, { borderColor: C.accent }]} onPress={() => openSetModal(exIdx)}>
              <Text style={[s.addSetBtnText, { color: C.accent }]}>+ Add Set</Text>
            </TouchableOpacity>
          </View>
        ))}

        {exercises.length === 0 && (
          <Text style={[s.empty, { color: C.textSecondary }]}>No exercises yet. Tap below to add one.</Text>
        )}
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={[s.addExBtn, { borderLeftColor: C.accent }]} onPress={() => setExModalVisible(true)}>
          <Text style={[s.addExBtnText, { color: C.accent }]}>+ Add Exercise</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.saveBtn, { backgroundColor: C.accent }]} onPress={handleSave} disabled={isSaving}>
          <Text style={[s.saveBtnText, { color: C.onAccent }]}>{isSaving ? 'Saving…' : 'Save Workout'}</Text>
        </TouchableOpacity>
      </View>

      {/* Add Exercise Modal */}
      <Modal visible={exModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}>
          <View style={[s.modalCard, { backgroundColor: C.surface }]}>
            <View style={[s.modalAccentBar, { backgroundColor: C.accent }]} />
            <View style={s.modalContent}>
              <Text style={[s.modalTitle, { color: C.text }]}>New Exercise</Text>
              <TextInput
                style={[s.input, { backgroundColor: C.surfaceAlt, color: C.text }]}
                placeholder="e.g. Bench Press"
                placeholderTextColor={C.textSecondary}
                value={newExName}
                onChangeText={setNewExName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleAddExercise}
              />
              <View style={s.modalBtns}>
                <TouchableOpacity style={[s.modalBtnCancel, { backgroundColor: C.surfaceAlt }]} onPress={() => setExModalVisible(false)}>
                  <Text style={[s.modalBtnCancelText, { color: C.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.modalBtnAccent, { backgroundColor: C.accent }]} onPress={handleAddExercise}>
                  <Text style={[s.modalBtnAccentText, { color: C.onAccent }]}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Set Modal */}
      <Modal visible={setModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}>
          <View style={[s.modalCard, { backgroundColor: C.surface }]}>
            <View style={[s.modalAccentBar, { backgroundColor: C.accent }]} />
            <View style={s.modalContent}>
              <Text style={[s.modalTitle, { color: C.text }]}>Add Set</Text>
              <TextInput
                style={[s.input, { backgroundColor: C.surfaceAlt, color: C.text }]}
                placeholder="Reps"
                placeholderTextColor={C.textSecondary}
                value={newReps}
                onChangeText={setNewReps}
                keyboardType="number-pad"
                autoFocus
              />
              <TextInput
                style={[s.input, { backgroundColor: C.surfaceAlt, color: C.text }]}
                placeholder="Weight (kg)"
                placeholderTextColor={C.textSecondary}
                value={newWeight}
                onChangeText={setNewWeight}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={handleAddSet}
              />
              <View style={s.modalBtns}>
                <TouchableOpacity style={[s.modalBtnCancel, { backgroundColor: C.surfaceAlt }]} onPress={() => setSetModalVisible(false)}>
                  <Text style={[s.modalBtnCancelText, { color: C.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.modalBtnAccent, { backgroundColor: C.accent }]} onPress={handleAddSet}>
                  <Text style={[s.modalBtnAccentText, { color: C.onAccent }]}>Add Set</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1 },
  dateHeader:  { fontSize: 20, fontWeight: '700', padding: 16, paddingBottom: 8 },
  scroll:      { flex: 1, paddingHorizontal: 16 },
  card:        { borderRadius: 10, padding: 14, marginBottom: 12, borderLeftWidth: 3 },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  exName:      { fontSize: 17, fontWeight: '700', flex: 1 },
  setRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  setBadge:    { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  setBadgeText:{ fontSize: 11, fontWeight: '700' },
  setVal:      { flex: 1, fontSize: 15 },
  danger:      { fontWeight: '600' },
  addSetBtn:   { marginTop: 10, paddingVertical: 8, borderRadius: 6, borderWidth: 1, alignItems: 'center' },
  addSetBtnText: { fontWeight: '600' },
  empty:       { textAlign: 'center', marginTop: 40, fontSize: 15 },
  footer:      { padding: 16, paddingTop: 8 },
  addExBtn:    { padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10, borderLeftWidth: 3 },
  addExBtnText:{ fontWeight: '700', fontSize: 16 },
  saveBtn:     { padding: 16, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { fontWeight: '700', fontSize: 17 },
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 24 },
  modalCard:   { borderRadius: 16, overflow: 'hidden' },
  modalAccentBar: { height: 4, width: '100%' },
  modalContent:{ padding: 20 },
  modalTitle:  { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input:       { borderRadius: 8, padding: 13, marginBottom: 12, fontSize: 16 },
  modalBtns:   { flexDirection: 'row', marginTop: 4 },
  modalBtnCancel:     { flex: 1, padding: 13, borderRadius: 8, alignItems: 'center', marginRight: 8 },
  modalBtnCancelText: { fontWeight: '600' },
  modalBtnAccent:     { flex: 1, padding: 13, borderRadius: 8, alignItems: 'center' },
  modalBtnAccentText: { fontWeight: '700' },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/LogScreen.js
git commit -m "feat: apply theme system and UI improvements to LogScreen"
```

---

## Task 6: Update `src/screens/HistoryScreen.js`

**Files:**
- Modify: `src/screens/HistoryScreen.js`

Changes: `useTheme()` replaces static import; exercise names in expanded detail use `C.text` instead of `C.accent` (was overused); cards get left accent border.

- [ ] **Step 1: Replace `src/screens/HistoryScreen.js` entirely**

```js
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllWorkoutsSortedDesc, replaceAllWorkouts } from '../storage/storage';
import { exportWorkouts, pickAndReadBackup } from '../utils/exportImport';
import { useTheme } from '../context/ThemeContext';

function calcVolume(exercises) {
  return exercises.reduce(
    (total, ex) => total + ex.sets.reduce((s, set) => s + set.reps * set.weight, 0),
    0
  );
}

function WorkoutRow({ workout }) {
  const { theme: C, mode } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const volume = calcVolume(workout.exercises);

  return (
    <View style={[s.card, { backgroundColor: C.surface, borderLeftColor: C.accent },
      mode === 'light' && { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }]}>
      <TouchableOpacity style={s.cardHeader} onPress={() => setExpanded(e => !e)}>
        <Text style={[s.dateText, { color: C.text }]}>{workout.date}</Text>
        <Text style={[s.volText, { color: C.accent }]}>{volume.toFixed(1)} kg total</Text>
        <Text style={[s.chevron, { color: C.textSecondary }]}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={s.detail}>
          {workout.exercises.map((ex, i) => (
            <View key={i} style={s.exBlock}>
              <Text style={[s.exName, { color: C.text }]}>{ex.name}</Text>
              {ex.sets.map((set, j) => (
                <Text key={j} style={[s.setLine, { color: C.textSecondary }]}>
                  Set {j + 1}: {set.reps} reps × {set.weight} kg
                </Text>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function HistoryScreen() {
  const { theme: C } = useTheme();
  const [workouts, setWorkouts] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getAllWorkoutsSortedDesc().then(data => { if (active) setWorkouts(data); });
      return () => { active = false; };
    }, [])
  );

  async function handleExport() {
    try { await exportWorkouts(workouts); }
    catch (e) { Alert.alert('Export failed', e.message); }
  }

  async function handleImport() {
    try {
      const parsed = await pickAndReadBackup();
      if (!parsed) return;
      Alert.alert(
        'Restore backup',
        `Found ${parsed.length} workout(s). Replace all current data?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace All', style: 'destructive',
            onPress: async () => {
              await replaceAllWorkouts(parsed);
              const data = await getAllWorkoutsSortedDesc();
              setWorkouts(data);
              Alert.alert('Done', `${parsed.length} workout(s) restored.`);
            },
          },
        ]
      );
    } catch (e) { Alert.alert('Import failed', e.message); }
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.background }]}>
      <View style={s.actionRow}>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: C.surface }]} onPress={handleExport}>
          <Text style={[s.actionBtnText, { color: C.accent }]}>Export JSON</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: C.surface }]} onPress={handleImport}>
          <Text style={[s.actionBtnText, { color: C.accent }]}>Import JSON</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={workouts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <WorkoutRow workout={item} />}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        ListEmptyComponent={<Text style={[s.empty, { color: C.textSecondary }]}>No workouts logged yet.</Text>}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1 },
  actionRow:     { flexDirection: 'row', padding: 16, paddingBottom: 8 },
  actionBtn:     { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 4 },
  actionBtnText: { fontWeight: '600', fontSize: 14 },
  card:          { borderRadius: 10, marginBottom: 12, overflow: 'hidden', borderLeftWidth: 3 },
  cardHeader:    { flexDirection: 'row', alignItems: 'center', padding: 14 },
  dateText:      { flex: 1, fontSize: 16, fontWeight: '700' },
  volText:       { fontWeight: '600', marginRight: 10, fontSize: 13 },
  chevron:       { fontSize: 12 },
  detail:        { paddingHorizontal: 14, paddingBottom: 12 },
  exBlock:       { marginBottom: 10 },
  exName:        { fontWeight: '700', marginBottom: 4 },
  setLine:       { fontSize: 14, paddingLeft: 8, paddingVertical: 1 },
  empty:         { textAlign: 'center', marginTop: 60, fontSize: 15 },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/HistoryScreen.js
git commit -m "feat: apply theme system and UI improvements to HistoryScreen"
```

---

## Task 7: Update `src/screens/ProgressScreen.js`

**Files:**
- Modify: `src/screens/ProgressScreen.js`

Change: `useTheme()` replaces static import; all `COLORS.x` references become `C.x` inline styles; chart colors update dynamically with the theme.

- [ ] **Step 1: Replace `src/screens/ProgressScreen.js` entirely**

```js
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList,
  StyleSheet, Dimensions, ScrollView, SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-gifted-charts';
import { getAllExerciseNames, getExerciseHistory } from '../storage/storage';
import { useTheme } from '../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;

export default function ProgressScreen() {
  const { theme: C } = useTheme();
  const [names, setNames]               = useState([]);
  const [selected, setSelected]         = useState('');
  const [chartData, setChartData]       = useState([]);
  const [pickerVisible, setPickerVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getAllExerciseNames().then(n => {
        if (!active) return;
        setNames(n);
        if (n.length > 0 && !selected) setSelected(n[0]);
      });
      return () => { active = false; };
    }, [])
  );

  useEffect(() => {
    if (!selected) return;
    let active = true;
    getExerciseHistory(selected).then(history => {
      if (!active) return;
      setChartData(history.map(p => ({
        value: p.maxWeight,
        label: p.date.slice(5),
        dataPointText: String(p.maxWeight),
      })));
    });
    return () => { active = false; };
  }, [selected]);

  const chartWidth = Math.max(chartData.length * 70, screenWidth - 48);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.background }]}>
      {names.length === 0 ? (
        <Text style={[s.empty, { color: C.textSecondary }]}>No exercises logged yet.</Text>
      ) : (
        <>
          <Text style={[s.label, { color: C.textSecondary }]}>Exercise</Text>
          <TouchableOpacity style={[s.selectorBtn, { backgroundColor: C.surface }]} onPress={() => setPickerVisible(true)}>
            <Text style={[s.selectorText, { color: C.text }]}>{selected || 'Select exercise'}</Text>
            <Text style={[s.chevron, { color: C.textSecondary }]}>▼</Text>
          </TouchableOpacity>

          {chartData.length >= 2 ? (
            <View style={[s.chartCard, { backgroundColor: C.surface }]}>
              <Text style={[s.chartLabel, { color: C.textSecondary }]}>Max weight per session (kg)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart
                  data={chartData}
                  width={chartWidth}
                  height={220}
                  color={C.accent}
                  thickness={2}
                  dataPointsColor={C.accent}
                  dataPointsRadius={5}
                  backgroundColor={C.surface}
                  xAxisColor={C.border}
                  yAxisColor={C.border}
                  xAxisLabelTextStyle={{ color: C.textSecondary, fontSize: 10, width: 40 }}
                  yAxisTextStyle={{ color: C.textSecondary, fontSize: 10 }}
                  hideRules={false}
                  rulesColor={C.border}
                  curved isAnimated
                  noOfSections={5}
                  initialSpacing={16}
                  spacing={60}
                  textShiftY={-10}
                  textShiftX={-6}
                  textFontSize={10}
                  dataPointTextColor={C.textSecondary}
                />
              </ScrollView>
            </View>
          ) : chartData.length === 1 ? (
            <View style={[s.singleCard, { backgroundColor: C.surface }]}>
              <Text style={[s.singleLabel, { color: C.textSecondary }]}>Only 1 session logged.</Text>
              <Text style={[s.singleVal, { color: C.accent }]}>{chartData[0].value} kg</Text>
              <Text style={[s.singleHint, { color: C.textSecondary }]}>Log more sessions to see a chart.</Text>
            </View>
          ) : (
            <Text style={[s.empty, { color: C.textSecondary }]}>No sets logged for this exercise.</Text>
          )}
        </>
      )}

      <Modal visible={pickerVisible} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={[s.pickerCard, { backgroundColor: C.surface }]}>
            <Text style={[s.pickerTitle, { color: C.text }]}>Select Exercise</Text>
            <FlatList
              data={names}
              keyExtractor={item => item}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[s.pickerItem, item === selected && { backgroundColor: C.surfaceAlt }]}
                  onPress={() => { setSelected(item); setPickerVisible(false); }}
                >
                  <Text style={[s.pickerItemText, { color: C.text }, item === selected && { color: C.accent, fontWeight: '700' }]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={[s.pickerClose, { backgroundColor: C.surfaceAlt }]} onPress={() => setPickerVisible(false)}>
              <Text style={[s.pickerCloseText, { color: C.textSecondary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, padding: 16 },
  label:        { fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  selectorBtn:  { borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  selectorText: { fontWeight: '700', fontSize: 16 },
  chevron:      { fontSize: 12 },
  chartCard:    { borderRadius: 10, padding: 16 },
  chartLabel:   { fontSize: 12, marginBottom: 12 },
  singleCard:   { borderRadius: 10, padding: 20, alignItems: 'center' },
  singleLabel:  { fontSize: 14 },
  singleVal:    { fontWeight: '700', fontSize: 28, marginVertical: 8 },
  singleHint:   { fontSize: 13 },
  empty:        { textAlign: 'center', marginTop: 60, fontSize: 15 },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 24 },
  pickerCard:   { borderRadius: 16, padding: 16 },
  pickerTitle:  { fontWeight: '700', fontSize: 18, marginBottom: 12 },
  pickerItem:   { padding: 14, borderRadius: 8 },
  pickerItemText: { fontSize: 16 },
  pickerClose:  { marginTop: 12, padding: 13, borderRadius: 8, alignItems: 'center' },
  pickerCloseText: { fontWeight: '600' },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/ProgressScreen.js
git commit -m "feat: apply theme system to ProgressScreen"
```

---

## Final Verification

- [ ] Run `npx expo start` (or `npm start`) and open in Expo Go / emulator
- [ ] Verify default theme: dark mode, blue accent
- [ ] Navigate to Settings tab — confirm mode toggle and 5 color swatches appear
- [ ] Toggle light mode — all 4 screens should repaint immediately
- [ ] Tap each accent swatch — tab bar, buttons, badges, and chart line should update instantly
- [ ] Kill and reopen the app — confirm saved mode and accent are restored from storage
- [ ] In LogScreen: add an exercise, add sets — confirm badge circles and left border look correct
- [ ] Confirm date header reads e.g. `Thursday, Apr 24` not raw ISO string
- [ ] Open a modal — confirm accent top bar and 16px radius
- [ ] In HistoryScreen: expand a workout — confirm exercise names are white/dark (not accent-colored)
