import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getAllWorkoutsSortedDesc, replaceAllWorkouts } from '../storage/storage';
import { exportWorkouts, pickAndReadBackup } from '../utils/exportImport';
import { useTheme } from '../context/ThemeContext';
import WorkoutEditorModal from '../components/WorkoutEditorModal';
import { getEquipmentLabel } from '../constants/equipment';

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function calcVolume(exercises) {
  return (exercises || []).reduce(
    (total, ex) => total + (ex.sets || []).reduce((sum, set) => sum + Number(set.reps) * Number(set.weight), 0),
    0
  );
}

function WorkoutRow({ workout, label, onEdit }) {
  const { theme: C, mode } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const volume = calcVolume(workout.exercises);

  return (
    <View style={[s.card, { backgroundColor: C.surface, borderLeftColor: C.accent },
      mode === 'light' && { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }]}>
      <View style={s.cardHeader}>
        <TouchableOpacity style={s.summaryBtn} onPress={() => setExpanded(value => !value)}>
          <Text style={[s.workoutLabel, { color: C.text }]}>{label}</Text>
          <Text style={[s.volText, { color: C.accent }]}>{volume.toFixed(1)} kg total</Text>
          <Ionicons name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'} size={16} color={C.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onEdit(workout)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={s.iconOnlyBtn}
          accessibilityLabel={`Edit ${label}`}
        >
          <Ionicons name="create-outline" size={20} color={C.textSecondary} />
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={s.detail}>
          {(workout.exercises || []).map((ex, i) => {
            const equipment = getEquipmentLabel(ex.equipment);
            return (
              <View key={i} style={s.exBlock}>
                <Text style={[s.exName, { color: C.text }]}>{ex.name}</Text>
                {equipment ? <Text style={[s.equipmentText, { color: C.textSecondary }]}>{equipment}</Text> : null}
                {(ex.sets || []).map((set, j) => (
                  <Text key={j} style={[s.setLine, { color: C.textSecondary }]}>
                    Set {j + 1}: {set.reps} reps x {set.weight} kg
                  </Text>
                ))}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function DateGroup({ group, onEdit }) {
  const { theme: C } = useTheme();
  return (
    <View style={s.dateGroup}>
      <Text style={[s.dateHeader, { color: C.accent }]}>{formatDate(group.date)}</Text>
      {group.workouts.map((w, i) => (
        <WorkoutRow
          key={w.id}
          workout={w}
          label={group.workouts.length > 1 ? `Session ${i + 1}` : 'Session'}
          onEdit={onEdit}
        />
      ))}
    </View>
  );
}

export default function HistoryScreen() {
  const { theme: C } = useTheme();
  const [workouts, setWorkouts] = useState([]);
  const [editingWorkout, setEditingWorkout] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getAllWorkoutsSortedDesc().then(data => { if (active) setWorkouts(data); });
      return () => { active = false; };
    }, [])
  );

  const dateGroups = (() => {
    const map = {};
    for (const w of workouts) {
      if (!map[w.date]) map[w.date] = [];
      map[w.date].push(w);
    }
    return Object.keys(map)
      .sort((a, b) => b.localeCompare(a))
      .map(date => ({ date, workouts: map[date] }));
  })();

  function handleWorkoutSaved(updated) {
    setWorkouts(prev => prev.map(w => (w.id === updated.id ? updated : w)));
    setEditingWorkout(null);
  }

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
              setEditingWorkout(null);
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
          <Ionicons name="cloud-upload-outline" size={18} color={C.accent} />
          <Text style={[s.actionBtnText, { color: C.accent }]}>Export</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: C.surface }]} onPress={handleImport}>
          <Ionicons name="cloud-download-outline" size={18} color={C.accent} />
          <Text style={[s.actionBtnText, { color: C.accent }]}>Import</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={dateGroups}
        keyExtractor={item => item.date}
        renderItem={({ item }) => <DateGroup group={item} onEdit={setEditingWorkout} />}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        ListEmptyComponent={<Text style={[s.empty, { color: C.textSecondary }]}>No workouts logged yet.</Text>}
      />

      <WorkoutEditorModal
        visible={editingWorkout !== null}
        workout={editingWorkout}
        onClose={() => setEditingWorkout(null)}
        onSaved={handleWorkoutSaved}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1 },
  actionRow:     { flexDirection: 'row', padding: 16, paddingBottom: 8 },
  actionBtn:     { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, marginHorizontal: 4 },
  actionBtnText: { fontWeight: '600', fontSize: 14 },
  dateGroup:     { marginBottom: 20 },
  dateHeader:    { fontSize: 14, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  card:          { borderRadius: 10, marginBottom: 8, overflow: 'hidden', borderLeftWidth: 3 },
  cardHeader:    { flexDirection: 'row', alignItems: 'center', padding: 14 },
  summaryBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center' },
  workoutLabel:  { flex: 1, fontSize: 16, fontWeight: '700' },
  volText:       { fontWeight: '600', marginRight: 10, fontSize: 13 },
  iconOnlyBtn:   { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  chevron:       { fontSize: 14, width: 12, textAlign: 'center' },
  detail:        { paddingHorizontal: 14, paddingBottom: 12 },
  exBlock:       { marginBottom: 10 },
  exName:        { fontWeight: '700', marginBottom: 2 },
  equipmentText: { fontSize: 12, marginBottom: 2 },
  setLine:       { fontSize: 14, paddingLeft: 8, paddingVertical: 1 },
  empty:         { textAlign: 'center', marginTop: 60, fontSize: 15 },
});
