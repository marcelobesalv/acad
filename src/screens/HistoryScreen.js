import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllWorkoutsSortedDesc, replaceAllWorkouts } from '../storage/storage';
import { exportWorkouts, pickAndReadBackup } from '../utils/exportImport';
import { COLORS } from '../constants/theme';

function calcVolume(exercises) {
  return exercises.reduce(
    (total, ex) =>
      total + ex.sets.reduce((s, set) => s + set.reps * set.weight, 0),
    0
  );
}

function WorkoutRow({ workout }) {
  const [expanded, setExpanded] = useState(false);
  const volume = calcVolume(workout.exercises);

  return (
    <View style={s.card}>
      <TouchableOpacity
        style={s.cardHeader}
        onPress={() => setExpanded(e => !e)}
      >
        <Text style={s.dateText}>{workout.date}</Text>
        <Text style={s.volText}>{volume.toFixed(1)} kg total</Text>
        <Text style={s.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={s.detail}>
          {workout.exercises.map((ex, i) => (
            <View key={i} style={s.exBlock}>
              <Text style={s.exName}>{ex.name}</Text>
              {ex.sets.map((set, j) => (
                <Text key={j} style={s.setLine}>
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
  const [workouts, setWorkouts] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getAllWorkoutsSortedDesc().then(data => {
        if (active) setWorkouts(data);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  async function handleExport() {
    try {
      await exportWorkouts(workouts);
    } catch (e) {
      Alert.alert('Export failed', e.message);
    }
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
            text: 'Replace All',
            style: 'destructive',
            onPress: async () => {
              await replaceAllWorkouts(parsed);
              const data = await getAllWorkoutsSortedDesc();
              setWorkouts(data);
              Alert.alert('Done', `${parsed.length} workout(s) restored.`);
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert('Import failed', e.message);
    }
  }

  return (
    <SafeAreaView style={s.root}>
      <View style={s.actionRow}>
        <TouchableOpacity style={s.actionBtn} onPress={handleExport}>
          <Text style={s.actionBtnText}>Export JSON</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} onPress={handleImport}>
          <Text style={s.actionBtnText}>Import JSON</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={workouts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <WorkoutRow workout={item} />}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        ListEmptyComponent={
          <Text style={s.empty}>No workouts logged yet.</Text>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  actionRow: { flexDirection: 'row', padding: 16, paddingBottom: 8 },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionBtnText: { color: COLORS.accent, fontWeight: '600', fontSize: 14 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  volText: {
    color: COLORS.accent,
    fontWeight: '600',
    marginRight: 10,
    fontSize: 13,
  },
  chevron: { color: COLORS.textSecondary, fontSize: 12 },
  detail: { paddingHorizontal: 14, paddingBottom: 12 },
  exBlock: { marginBottom: 10 },
  exName: { color: COLORS.accent, fontWeight: '700', marginBottom: 4 },
  setLine: {
    color: COLORS.text,
    fontSize: 14,
    paddingLeft: 8,
    paddingVertical: 1,
  },
  empty: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 60,
    fontSize: 15,
  },
});
