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
