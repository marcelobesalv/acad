import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, StyleSheet, Alert, KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getWorkoutsByDate, saveWorkout, generateId, getTodayString } from '../storage/storage';
import { useTheme } from '../context/ThemeContext';

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function LogScreen() {
  const { theme: C, mode } = useTheme();
  const today = getTodayString();

  const [todayWorkouts, setTodayWorkouts]   = useState([]);
  const [activeIdx, setActiveIdx]           = useState(0);
  const [savedExercises, setSavedExercises] = useState([]);
  const [isSaving, setIsSaving]             = useState(false);
  const [exModalVisible, setExModalVisible] = useState(false);
  const [newExName, setNewExName]           = useState('');
  const [setModalVisible, setSetModalVisible] = useState(false);
  const [activeExIdx, setActiveExIdx]       = useState(null);
  const [newReps, setNewReps]               = useState('');
  const [newWeight, setNewWeight]           = useState('');
  const loadedDateRef = useRef(null);

  const activeWorkout = todayWorkouts[activeIdx];
  const exercises     = activeWorkout?.exercises ?? [];
  const hasChanges    = JSON.stringify(exercises) !== JSON.stringify(savedExercises);

  useFocusEffect(
    useCallback(() => {
      if (loadedDateRef.current === today) return;
      let active = true;
      (async () => {
        const workouts = await getWorkoutsByDate(today);
        if (active) {
          const ws = workouts.length > 0
            ? workouts
            : [{ id: generateId(), date: today, exercises: [] }];
          setTodayWorkouts(ws);
          setActiveIdx(0);
          setSavedExercises(ws[0].exercises);
          loadedDateRef.current = today;
        }
      })();
      return () => { active = false; };
    }, [today])
  );

  function updateExercises(updater) {
    setTodayWorkouts(prev => prev.map((w, i) =>
      i === activeIdx
        ? { ...w, exercises: typeof updater === 'function' ? updater(w.exercises) : updater }
        : w
    ));
  }

  async function silentSave() {
    if (!activeWorkout || exercises.length === 0) return;
    await saveWorkout({ ...activeWorkout, date: today });
    setSavedExercises([...exercises]);
  }

  async function switchToWorkout(idx) {
    if (idx === activeIdx) return;
    if (hasChanges && exercises.length > 0) await silentSave();
    setSavedExercises(todayWorkouts[idx]?.exercises ?? []);
    setActiveIdx(idx);
  }

  async function addNewWorkout() {
    if (hasChanges && exercises.length > 0) await silentSave();
    const newWorkout = { id: generateId(), date: today, exercises: [] };
    const newIdx = todayWorkouts.length;
    setTodayWorkouts(prev => [...prev, newWorkout]);
    setActiveIdx(newIdx);
    setSavedExercises([]);
  }

  function handleAddExercise() {
    const name = newExName.trim();
    if (!name) return;
    updateExercises(prev => [...prev, { name, sets: [] }]);
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
    updateExercises(prev =>
      prev.map((ex, i) =>
        i === activeExIdx ? { ...ex, sets: [...ex.sets, { reps, weight }] } : ex
      )
    );
    setSetModalVisible(false);
  }

  function duplicateSet(exIdx, setIdx) {
    updateExercises(prev =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const copy = { ...ex.sets[setIdx] };
        const newSets = [...ex.sets];
        newSets.splice(setIdx + 1, 0, copy);
        return { ...ex, sets: newSets };
      })
    );
  }

  function removeSet(exIdx, setIdx) {
    updateExercises(prev =>
      prev.map((ex, i) =>
        i === exIdx ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) } : ex
      )
    );
  }

  function removeExercise(idx) {
    updateExercises(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (exercises.length === 0) {
      Alert.alert('Nothing to save', 'Add at least one exercise first.');
      return;
    }
    setIsSaving(true);
    try {
      await saveWorkout({ ...activeWorkout, date: today });
      setSavedExercises([...exercises]);
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

      {/* Workout selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.selectorScroll}
        contentContainerStyle={s.selectorContent}
      >
        {todayWorkouts.map((w, i) => (
          <TouchableOpacity
            key={w.id}
            style={[s.pill, { backgroundColor: i === activeIdx ? C.accent : C.surface }]}
            onPress={() => switchToWorkout(i)}
          >
            <Text style={[s.pillText, { color: i === activeIdx ? C.onAccent : C.text }]}>
              Treino {i + 1}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[s.pill, { backgroundColor: C.surface, borderWidth: 1, borderColor: C.accent }]}
          onPress={addNewWorkout}
        >
          <Text style={[s.pillText, { color: C.accent }]}>+ Novo</Text>
        </TouchableOpacity>
      </ScrollView>

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
                <TouchableOpacity
                  onPress={() => duplicateSet(exIdx, setIdx)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={s.dupBtn}
                >
                  <Text style={[s.dupBtnText, { color: C.accent }]}>⧉</Text>
                </TouchableOpacity>
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
        {hasChanges && (
          <TouchableOpacity style={[s.saveBtn, { backgroundColor: C.accent }]} onPress={handleSave} disabled={isSaving}>
            <Text style={[s.saveBtnText, { color: C.onAccent }]}>{isSaving ? 'Saving…' : 'Save Workout'}</Text>
          </TouchableOpacity>
        )}
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
  root:           { flex: 1 },
  dateHeader:     { fontSize: 20, fontWeight: '700', padding: 16, paddingBottom: 8 },
  selectorScroll: { flexGrow: 0, paddingHorizontal: 16 },
  selectorContent:{ flexDirection: 'row', paddingBottom: 12, gap: 8 },
  pill:           { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  pillText:       { fontWeight: '600', fontSize: 14 },
  scroll:         { flex: 1, paddingHorizontal: 16 },
  card:           { borderRadius: 10, padding: 14, marginBottom: 12, borderLeftWidth: 3 },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  exName:         { fontSize: 17, fontWeight: '700', flex: 1 },
  setRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  setBadge:       { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  setBadgeText:   { fontSize: 11, fontWeight: '700' },
  setVal:         { flex: 1, fontSize: 15 },
  danger:         { fontWeight: '600' },
  dupBtn:         { marginRight: 10 },
  dupBtnText:     { fontSize: 16, fontWeight: '600' },
  addSetBtn:      { marginTop: 10, paddingVertical: 8, borderRadius: 6, borderWidth: 1, alignItems: 'center' },
  addSetBtnText:  { fontWeight: '600' },
  empty:          { textAlign: 'center', marginTop: 40, fontSize: 15 },
  footer:         { padding: 16, paddingTop: 8 },
  addExBtn:       { padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10, borderLeftWidth: 3 },
  addExBtnText:   { fontWeight: '700', fontSize: 16 },
  saveBtn:        { padding: 16, borderRadius: 10, alignItems: 'center' },
  saveBtnText:    { fontWeight: '700', fontSize: 17 },
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 24 },
  modalCard:      { borderRadius: 16, overflow: 'hidden' },
  modalAccentBar: { height: 4, width: '100%' },
  modalContent:   { padding: 20 },
  modalTitle:     { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input:          { borderRadius: 8, padding: 13, marginBottom: 12, fontSize: 16 },
  modalBtns:      { flexDirection: 'row', marginTop: 4 },
  modalBtnCancel:     { flex: 1, padding: 13, borderRadius: 8, alignItems: 'center', marginRight: 8 },
  modalBtnCancelText: { fontWeight: '600' },
  modalBtnAccent:     { flex: 1, padding: 13, borderRadius: 8, alignItems: 'center' },
  modalBtnAccentText: { fontWeight: '700' },
});
