import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ACCENTS } from '../constants/theme';
import { DATE_FORMAT_OPTIONS } from '../utils/dateFormat';

const ACCENT_KEYS = ['yellow', 'blue', 'teal', 'coral', 'purple'];

export default function SettingsScreen() {
  const { theme: C, mode, accentKey, dateFormatKey, setMode, setAccent, setDateFormat } = useTheme();

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.background }]}>
      <ScrollView contentContainerStyle={s.content}>
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
                accessibilityLabel={`Set ${key} accent color`}
              >
                {key === accentKey && (
                  <Ionicons name="checkmark-outline" size={22} color={mode === 'dark' ? '#FFFFFF' : '#111111'} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={[s.sectionHeader, { color: C.textSecondary }]}>DATES</Text>
        <View style={[s.datePanel, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[s.rowLabel, { color: C.text }]}>Date Format</Text>
          <View style={s.dateOptions}>
            {DATE_FORMAT_OPTIONS.map((option, index) => {
              const selected = option.key === dateFormatKey;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    s.dateOption,
                    index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border },
                  ]}
                  onPress={() => setDateFormat(option.key)}
                  accessibilityLabel={`Set date format to ${option.label}`}
                >
                  <View style={s.dateOptionText}>
                    <Text style={[s.dateFormatLabel, { color: C.text }]}>{option.label}</Text>
                    <Text style={[s.dateFormatExample, { color: C.textSecondary }]}>{option.example}</Text>
                  </View>
                  <View style={s.dateCheck}>
                    {selected ? (
                      <Ionicons name="checkmark-circle-outline" size={22} color={C.accent} />
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1 },
  content:       { padding: 16, paddingBottom: 24 },
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
  datePanel:     { padding: 16, borderRadius: 12, borderWidth: 1 },
  dateOptions:   { marginTop: 8 },
  dateOption:    { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 10 },
  dateOptionText:{ flex: 1 },
  dateCheck:     { width: 24, alignItems: 'center' },
  dateFormatLabel:   { fontSize: 14, fontWeight: '700' },
  dateFormatExample: { fontSize: 13, marginTop: 2 },
});
