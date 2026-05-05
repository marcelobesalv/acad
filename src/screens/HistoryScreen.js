import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllWorkoutsSortedDesc, replaceAllWorkouts, saveWorkout } from '../storage/storage';
import { exportWorkouts, pickAndReadBackup } from '../utils/exportImport';
import { useTheme } from '../context/ThemeContext';
import { EQUIPMENT_OPTIONS, getEquipmentLabel } from '../constants/equipment';

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function calcVolume(exercises) {
  return exercises.reduce(
    (total, ex) => total + ex.sets.reduce((s, set) => s + Number(set.reps) * Number(set.weight), 0),
    0
  );
}

function parsePositiveNumber(value) {
  const normalized = String(value ?? '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function cloneWorkoutForEdit(workout) {
  return {
    ...workout,
    exercises: (workout.exercises || []).map(ex => ({
      ...ex,
      name: ex.name || '',
      equipment: ex.equipment || 'machine',
      sets: (ex.sets || []).map(set => ({
        reps: String(set.reps ?? ''),
        weight: String(set.weight ?? ''),
      })),
    })),
  };
}

function WorkoutRow({ workout, label, onEdit }) {
  const { theme: C, mode } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const volume = calcVolume(workout.exercises);

  return (
    <View style={[s.card, { backgroundColor: C.surface, borderLeftColor: C.accent },
      mode === 'light' && { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }]}>
      <TouchableOpacity style={s.cardHeader} onPress={() => setExpanded(e => !e)}>
        <Text style={[s.workoutLabel, { color: C.text }]}>{label}</Text>
        <Text style={[s.volText, { color: C.accent }]}>{volume.toFixed(1)} kg total</Text>
        <Text style={[s.chevron, { color: C.textSecondary }]}>{expanded ? '^' : 'v'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={s.detail}>
          <TouchableOpacity style={[s.editBtn, { borderColor: C.accent }]} onPress={() => onEdit(workout)}>
            <Text style={[s.editBtnText, { color: C.accent }]}>Edit Session</Text>
          </TouchableOpacity>
          {workout.exercises.map((ex, i) => {
            const equipment = getEquipmentLabel(ex.equipment);
            return (
              <View key={i} style={s.exBlock}>
                <Text style={[s.exName, { color: C.text }]}>{ex.name}</Text>
                {equipment ? <Text style={[s.equipmentText, { color: C.textSecondary }]}>{equipment}</Text> : null}
                {ex.sets.map((set, j) => (
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
  const [editorVisible, setEditorVisible] = useState(false);
  const [draftWorkout, setDraftWorkout] = useState(null);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseEquipment, setNewExerciseEquipment] = useState('machine');

  const loadWorkouts = useCallback(async () => {
    const data = await getAllWorkoutsSortedDesc();
    setWorkouts(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getAllWorkoutsSortedDesc().then(data => { if (active) setWorkouts(data); });
      return () => { active = false; };
    }, [])
  );

  // Group workouts by date (order already guaranteed by getAllWorkoutsSortedDesc)
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

  function openEditor(workout) {
    setDraftWorkout(cloneWorkoutForEdit(workout));
    setNewExerciseName('');
    setNewExerciseEquipment('machine');
    setEditorVisible(true);
  }

  function closeEditor() {
    setEditorVisible(false);
    setDraftWorkout(null);
    setNewExerciseName('');
    setNewExerciseEquipment('machine');
  }

  function updateDraftExercises(updater) {
    setDraftWorkout(prev => ({
      ...prev,
      exercises: typeof updater === 'function' ? updater(prev.exercises) : updater,
    }));
  }

  function updateDraftExercise(exIdx, patch) {
    updateDraftExercises(prev => prev.map((ex, i) => (i === exIdx ? { ...ex, ...patch } : ex)));
  }

  function updateDraftSet(exIdx, setIdx, patch) {
    updateDraftExercises(prev => prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      return {
        ...ex,
        sets: ex.sets.map((set, j) => (j === setIdx ? { ...set, ...patch } : set)),
      };
    }));
  }

  function addDraftExercise() {
    const name = newExerciseName.trim();
    if (!name) return;
    updateDraftExercises(prev => [...prev, { name, equipment: newExerciseEquipment, sets: [] }]);
    setNewExerciseName('');
    setNewExerciseEquipment('machine');
  }

  function removeDraftExercise(exIdx) {
    updateDraftExercises(prev => prev.filter((_, i) => i !== exIdx));
  }

  function addDraftSet(exIdx) {
    updateDraftExercises(prev => prev.map((ex, i) =>
      i === exIdx ? { ...ex, sets: [...ex.sets, { reps: '', weight: '' }] } : ex
    ));
  }

  function duplicateDraftSet(exIdx, setIdx) {
    updateDraftExercises(prev => prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      const nextSets = [...ex.sets];
      nextSets.splice(setIdx + 1, 0, { ...ex.sets[setIdx] });
      return { ...ex, sets: nextSets };
    }));
  }

  function removeDraftSet(exIdx, setIdx) {
    updateDraftExercises(prev => prev.map((ex, i) =>
      i === exIdx ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) } : ex
    ));
  }

  function buildWorkoutForSave() {
    const exercises = draftWorkout.exercises.map((ex, exIdx) => {
      const name = ex.name.trim();
      if (!name) throw new Error(`Exercise ${exIdx + 1} needs a name.`);

      const sets = ex.sets.map((set, setIdx) => {
        const hasAnyValue = String(set.reps ?? '').trim() || String(set.weight ?? '').trim();
        if (!hasAnyValue) return null;

        const reps = Number.parseInt(String(set.reps ?? ''), 10);
        const weight = parsePositiveNumber(set.weight);
        if (!Number.isFinite(reps) || reps <= 0 || !weight) {
          throw new Error(`${name}, set ${setIdx + 1}: enter valid reps and weight.`);
        }
        return { reps, weight };
      }).filter(Boolean);

      return { name, equipment: ex.equipment || 'machine', sets };
    });

    if (exercises.length === 0) throw new Error('Add at least one exercise before saving.');
    return { ...draftWorkout, exercises };
  }

  async function handleSaveEdit() {
    try {
      const workoutToSave = buildWorkoutForSave();
      await saveWorkout(workoutToSave);
      closeEditor();
      await loadWorkouts();
    } catch (e) {
      Alert.alert('Could not save', e.message);
    }
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
        data={dateGroups}
        keyExtractor={item => item.date}
        renderItem={({ item }) => <DateGroup group={item} onEdit={openEditor} />}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        ListEmptyComponent={<Text style={[s.empty, { color: C.textSecondary }]}>No workouts logged yet.</Text>}
      />

      <Modal visible={editorVisible} transparent animationType="slide" onRequestClose={closeEditor}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}>
          <View style={[s.editorCard, { backgroundColor: C.surface }]}>
            <View style={s.editorHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[s.editorTitle, { color: C.text }]}>Edit Session</Text>
                {draftWorkout ? (
                  <Text style={[s.editorDate, { color: C.textSecondary }]}>{formatDate(draftWorkout.date)}</Text>
                ) : null}
              </View>
              <TouchableOpacity style={s.closeBtn} onPress={closeEditor}>
                <Text style={[s.closeText, { color: C.textSecondary }]}>x</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={s.editorBody} contentContainerStyle={{ paddingBottom: 12 }} keyboardShouldPersistTaps="handled">
              {draftWorkout?.exercises.map((ex, exIdx) => (
                <View key={exIdx} style={[s.editorExercise, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
                  <TextInput
                    style={[s.input, { backgroundColor: C.surface, color: C.text, borderColor: C.border }]}
                    value={ex.name}
                    onChangeText={name => updateDraftExercise(exIdx, { name })}
                    placeholder="Exercise name"
                    placeholderTextColor={C.textSecondary}
                  />

                  <Text style={[s.fieldLabel, { color: C.textSecondary }]}>Equipment</Text>
                  <View style={s.segmentRow}>
                    {EQUIPMENT_OPTIONS.map(option => {
                      const isSelected = ex.equipment === option.key;
                      return (
                        <TouchableOpacity
                          key={option.key}
                          style={[
                            s.segmentBtn,
                            { backgroundColor: isSelected ? C.accent : C.surface, borderColor: isSelected ? C.accent : C.border },
                          ]}
                          onPress={() => updateDraftExercise(exIdx, { equipment: option.key })}
                        >
                          <Text style={[s.segmentText, { color: isSelected ? C.onAccent : C.text }]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {ex.sets.map((set, setIdx) => (
                    <View key={setIdx} style={s.editSetRow}>
                      <Text style={[s.setIndex, { color: C.textSecondary }]}>{setIdx + 1}</Text>
                      <TextInput
                        style={[s.setInput, { backgroundColor: C.surface, color: C.text, borderColor: C.border }]}
                        value={String(set.reps)}
                        onChangeText={reps => updateDraftSet(exIdx, setIdx, { reps })}
                        keyboardType="number-pad"
                        placeholder="Reps"
                        placeholderTextColor={C.textSecondary}
                      />
                      <TextInput
                        style={[s.setInput, { backgroundColor: C.surface, color: C.text, borderColor: C.border }]}
                        value={String(set.weight)}
                        onChangeText={weight => updateDraftSet(exIdx, setIdx, { weight })}
                        keyboardType="decimal-pad"
                        placeholder="Kg"
                        placeholderTextColor={C.textSecondary}
                      />
                      <TouchableOpacity style={s.smallSetBtn} onPress={() => duplicateDraftSet(exIdx, setIdx)}>
                        <Text style={[s.smallSetText, { color: C.accent }]}>Copy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.smallSetBtn} onPress={() => removeDraftSet(exIdx, setIdx)}>
                        <Text style={[s.smallSetText, { color: C.danger }]}>x</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  <View style={s.editorButtonRow}>
                    <TouchableOpacity style={[s.outlineBtn, { borderColor: C.accent }]} onPress={() => addDraftSet(exIdx)}>
                      <Text style={[s.outlineBtnText, { color: C.accent }]}>+ Add Set</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.outlineBtn, { borderColor: C.danger }]} onPress={() => removeDraftExercise(exIdx)}>
                      <Text style={[s.outlineBtnText, { color: C.danger }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={[s.addExerciseBox, { borderColor: C.border }]}>
                <TextInput
                  style={[s.input, { backgroundColor: C.surfaceAlt, color: C.text, borderColor: C.border }]}
                  value={newExerciseName}
                  onChangeText={setNewExerciseName}
                  placeholder="New exercise"
                  placeholderTextColor={C.textSecondary}
                  returnKeyType="done"
                  onSubmitEditing={addDraftExercise}
                />
                <View style={s.segmentRow}>
                  {EQUIPMENT_OPTIONS.map(option => {
                    const isSelected = newExerciseEquipment === option.key;
                    return (
                      <TouchableOpacity
                        key={option.key}
                        style={[
                          s.segmentBtn,
                          { backgroundColor: isSelected ? C.accent : C.surfaceAlt, borderColor: isSelected ? C.accent : C.border },
                        ]}
                        onPress={() => setNewExerciseEquipment(option.key)}
                      >
                        <Text style={[s.segmentText, { color: isSelected ? C.onAccent : C.text }]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity style={[s.addExerciseBtn, { backgroundColor: C.accent }]} onPress={addDraftExercise}>
                  <Text style={[s.addExerciseText, { color: C.onAccent }]}>Add Exercise</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={[s.editorActions, { borderTopColor: C.border }]}>
              <TouchableOpacity style={[s.cancelBtn, { backgroundColor: C.surfaceAlt }]} onPress={closeEditor}>
                <Text style={[s.cancelText, { color: C.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.saveBtn, { backgroundColor: C.accent }]} onPress={handleSaveEdit}>
                <Text style={[s.saveText, { color: C.onAccent }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1 },
  actionRow:        { flexDirection: 'row', padding: 16, paddingBottom: 8 },
  actionBtn:        { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 4 },
  actionBtnText:    { fontWeight: '600', fontSize: 14 },
  dateGroup:        { marginBottom: 20 },
  dateHeader:       { fontSize: 14, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  card:             { borderRadius: 10, marginBottom: 8, overflow: 'hidden', borderLeftWidth: 3 },
  cardHeader:       { flexDirection: 'row', alignItems: 'center', padding: 14 },
  workoutLabel:     { flex: 1, fontSize: 16, fontWeight: '700' },
  volText:          { fontWeight: '600', marginRight: 10, fontSize: 13 },
  chevron:          { fontSize: 14, width: 12, textAlign: 'center' },
  detail:           { paddingHorizontal: 14, paddingBottom: 12 },
  editBtn:          { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 12 },
  editBtnText:      { fontWeight: '700', fontSize: 13 },
  exBlock:          { marginBottom: 10 },
  exName:           { fontWeight: '700', marginBottom: 2 },
  equipmentText:    { fontSize: 12, marginBottom: 2 },
  setLine:          { fontSize: 14, paddingLeft: 8, paddingVertical: 1 },
  empty:            { textAlign: 'center', marginTop: 60, fontSize: 15 },
  overlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 16 },
  editorCard:       { borderRadius: 14, overflow: 'hidden', maxHeight: '92%' },
  editorHeader:     { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 10 },
  editorTitle:      { fontSize: 18, fontWeight: '700' },
  editorDate:       { fontSize: 12, marginTop: 2 },
  closeBtn:         { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  closeText:        { fontSize: 20, fontWeight: '700' },
  editorBody:       { paddingHorizontal: 16 },
  editorExercise:   { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
  input:            { borderWidth: 1, borderRadius: 8, padding: 11, marginBottom: 10, fontSize: 15 },
  fieldLabel:       { fontSize: 11, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.7 },
  segmentRow:       { flexDirection: 'row', gap: 8, marginBottom: 10 },
  segmentBtn:       { flex: 1, borderRadius: 8, borderWidth: 1, paddingVertical: 9, alignItems: 'center' },
  segmentText:      { fontSize: 11, fontWeight: '700' },
  editSetRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  setIndex:         { width: 18, textAlign: 'center', fontWeight: '700' },
  setInput:         { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, fontSize: 14 },
  smallSetBtn:      { paddingHorizontal: 5, paddingVertical: 8 },
  smallSetText:     { fontWeight: '700', fontSize: 12 },
  editorButtonRow:  { flexDirection: 'row', gap: 8, marginTop: 4 },
  outlineBtn:       { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  outlineBtnText:   { fontWeight: '700', fontSize: 13 },
  addExerciseBox:   { borderWidth: 1, borderStyle: 'dashed', borderRadius: 10, padding: 12, marginBottom: 12 },
  addExerciseBtn:   { borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  addExerciseText:  { fontWeight: '700' },
  editorActions:    { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
  cancelBtn:        { flex: 1, borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  cancelText:       { fontWeight: '700' },
  saveBtn:          { flex: 1, borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  saveText:         { fontWeight: '700' },
});
