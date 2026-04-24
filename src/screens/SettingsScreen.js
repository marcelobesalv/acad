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
                key === accentKey && { borderWidth: 3, borderColor: mode === 'dark' ? '#FFFFFF' : '#1A1A1A' },
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
  swatchCheck:   { color: '#000000', fontWeight: '700', fontSize: 18 },
});
