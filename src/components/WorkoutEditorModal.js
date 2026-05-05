import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, StyleSheet, Alert, KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import { saveWorkout } from '../storage/storage';
import { useTheme } from '../context/ThemeContext';
import { EQUIPMENT_OPTIONS } from '../constants/equipment';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function parsePositiveNumber(value) {
  const normalized = String(value ?? '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function cloneExercises(exercises = []) {
  return exercises.map(ex => ({
    ...ex,
    name: ex.name || '',
    equipment: ex.equipment || 'machine',
    sets: (ex.sets || []).map(set => ({
      reps: String(set.reps ?? ''),
      weight: String(set.weight ?? ''),
    })),
  }));
}

export default function WorkoutEditorModal({ visible, workout, onClose, onSaved }) {
  const { theme: C, mode } = useTheme();

  const [exercises, setExercises]             = useState([]);
  const [isSaving, setIsSaving]               = useState(false);
  const [exModalVisible, setExModalVisible]   = useState(false);
  const [newExName, setNewExName]             = useState('');
  const [newEquipment, setNewEquipment]       = useState('machine');
  const [setModalVisible, setSetModalVisible] = useState(false);
  const [activeExIdx, setActiveExIdx]         = useState(null);
  const [newReps, setNewReps]                 = useState('');
  const [newWeight, setNewWeight]             = useState('');

  useEffect(() => {
    if (visible && workout) setExercises(cloneExercises(workout.exercises));
  }, [visible, workout?.id]);

  function updateExercise(exIdx, patch) {
    setExercises(prev => prev.map((ex, i) => (i === exIdx ? { ...ex, ...patch } : ex)));
  }

  function updateSet(exIdx, setIdx, patch) {
    setExercises(prev => prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      return {
        ...ex,
        sets: ex.sets.map((set, j) => (j === setIdx ? { ...set, ...patch } : set)),
      };
    }));
  }

  function handleAddExercise() {
    const name = newExName.trim();
    if (!name) return;
    setExercises(prev => [...prev, { name, equipment: newEquipment, sets: [] }]);
    setNewExName('');
    setNewEquipment('machine');
    setExModalVisible(false);
  }

  function openSetModal(idx) {
    setActiveExIdx(idx);
    setNewReps('');
    setNewWeight('');
    setSetModalVisible(true);
  }

  function handleAddSet() {
    const reps = Number.parseInt(newReps, 10);
    const weight = parsePositiveNumber(newWeight);
    if (!Number.isFinite(reps) || reps <= 0 || !weight) {
      Alert.alert('Invalid input', 'Enter valid reps and weight.');
      return;
    }
    setExercises(prev =>
      prev.map((ex, i) =>
        i === activeExIdx ? { ...ex, sets: [...ex.sets, { reps: String(reps), weight: String(weight) }] } : ex
      )
    );
    setSetModalVisible(false);
  }

  function duplicateSet(exIdx, setIdx) {
    setExercises(prev =>
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
    setExercises(prev =>
      prev.map((ex, i) =>
        i === exIdx ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) } : ex
      )
    );
  }

  function removeExercise(idx) {
    setExercises(prev => prev.filter((_, i) => i !== idx));
  }

  function buildWorkoutForSave() {
    const normalizedExercises = exercises.map((ex, exIdx) => {
      const name = ex.name.trim();
      if (!name) throw new Error(`Exercise ${exIdx + 1} needs a name.`);

      const sets = ex.sets.map((set, setIdx) => {
        const reps = Number.parseInt(String(set.reps ?? ''), 10);
        const weight = parsePositiveNumber(set.weight);
        if (!Number.isFinite(reps) || reps <= 0 || !weight) {
          throw new Error(`${name}, set ${setIdx + 1}: enter valid reps and weight.`);
        }
        return { reps, weight };
      });

      return { ...ex, name, equipment: ex.equipment || 'machine', sets };
    });

    if (normalizedExercises.length === 0) throw new Error('Add at least one exercise before saving.');
    return { ...workout, exercises: normalizedExercises };
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const updated = buildWorkoutForSave();
      await saveWorkout(updated);
      onSaved(updated);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[s.root, { backgroundColor: C.background }]}>
        <View style={[s.header, { borderBottomColor: C.border, backgroundColor: C.surface }]}>
          <TouchableOpacity onPress={onClose} style={s.headerBtn}>
            <Text style={[s.headerBtnText, { color: C.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: C.text }]}>{formatDate(workout?.date)}</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving || !workout} style={s.headerBtn}>
            <Text style={[s.headerBtnText, { color: C.accent, fontWeight: '700' }]}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
          {exercises.map((ex, exIdx) => (
            <View key={exIdx} style={[s.card, { backgroundColor: C.surface, borderLeftColor: C.accent },
              mode === 'light' && { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }]}>
              <View style={s.cardHeader}>
                <TextInput
                  style={[s.exNameInput, { backgroundColor: C.surfaceAlt, color: C.text }]}
                  value={ex.name}
                  onChangeText={name => updateExercise(exIdx, { name })}
                  placeholder="Exercise name"
                  placeholderTextColor={C.textSecondary}
                />
                <TouchableOpacity onPress={() => removeExercise(exIdx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={[s.danger, { color: C.danger }]}>Remove</Text>
                </TouchableOpacity>
              </View>

              <Text style={[s.fieldLabel, { color: C.textSecondary }]}>Equipment</Text>
              <View style={s.segmentRow}>
                {EQUIPMENT_OPTIONS.map(option => {
                  const selected = ex.equipment === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        s.segmentBtn,
                        { backgroundColor: selected ? C.accent : C.surfaceAlt, borderColor: selected ? C.accent : C.border },
                      ]}
                      onPress={() => updateExercise(exIdx, { equipment: option.key })}
                    >
                      <Text style={[s.segmentText, { color: selected ? C.onAccent : C.text }]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {ex.sets.map((set, setIdx) => (
                <View key={setIdx} style={s.setRow}>
                  <View style={[s.setBadge, { backgroundColor: C.accent }]}>
                    <Text style={[s.setBadgeText, { color: C.onAccent }]}>{setIdx + 1}</Text>
                  </View>
                  <TextInput
                    style={[s.setInput, { backgroundColor: C.surfaceAlt, color: C.text }]}
                    value={String(set.reps)}
                    onChangeText={reps => updateSet(exIdx, setIdx, { reps })}
                    keyboardType="number-pad"
                    placeholder="Reps"
                    placeholderTextColor={C.textSecondary}
                  />
                  <TextInput
                    style={[s.setInput, { backgroundColor: C.surfaceAlt, color: C.text }]}
                    value={String(set.weight)}
                    onChangeText={weight => updateSet(exIdx, setIdx, { weight })}
                    keyboardType="decimal-pad"
                    placeholder="Kg"
                    placeholderTextColor={C.textSecondary}
                  />
                  <TouchableOpacity
                    onPress={() => duplicateSet(exIdx, setIdx)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={s.dupBtn}
                  >
                    <Text style={[s.dupBtnText, { color: C.accent }]}>Copy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeSet(exIdx, setIdx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={[s.danger, { color: C.danger }]}>x</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={[s.addSetBtn, { borderColor: C.accent }]} onPress={() => openSetModal(exIdx)}>
                <Text style={[s.addSetBtnText, { color: C.accent }]}>+ Add Set</Text>
              </TouchableOpacity>
            </View>
          ))}

          {exercises.length === 0 && (
            <View style={s.emptyState}>
              <Text style={[s.emptyTitle, { color: C.text }]}>No exercises</Text>
              <Text style={[s.emptyHint, { color: C.textSecondary }]}>Add exercises below.</Text>
            </View>
          )}
        </ScrollView>

        <View style={[s.footer, { borderTopColor: C.border }]}>
          <TouchableOpacity
            style={[s.addExBtn, { backgroundColor: C.surface, borderColor: C.accent }]}
            onPress={() => setExModalVisible(true)}
          >
            <Text style={[s.addExBtnText, { color: C.accent }]}>+ Add Exercise</Text>
          </TouchableOpacity>
        </View>

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
                <Text style={[s.fieldLabel, { color: C.textSecondary }]}>Equipment</Text>
                <View style={s.segmentRow}>
                  {EQUIPMENT_OPTIONS.map(option => {
                    const selected = option.key === newEquipment;
                    return (
                      <TouchableOpacity
                        key={option.key}
                        style={[
                          s.segmentBtn,
                          { backgroundColor: selected ? C.accent : C.surfaceAlt, borderColor: selected ? C.accent : C.border },
                        ]}
                        onPress={() => setNewEquipment(option.key)}
                      >
                        <Text style={[s.segmentText, { color: selected ? C.onAccent : C.text }]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
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
    </Modal>
  );
}

const s = StyleSheet.create({
  root:              { flex: 1 },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerBtn:         { minWidth: 64 },
  headerTitle:       { fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  headerBtnText:     { fontSize: 16 },
  scroll:            { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  card:              { borderRadius: 10, padding: 14, marginBottom: 12, borderLeftWidth: 3 },
  cardHeader:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  exNameInput:       { flex: 1, borderRadius: 8, padding: 11, fontSize: 16, fontWeight: '700' },
  fieldLabel:        { fontSize: 11, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.7 },
  segmentRow:        { flexDirection: 'row', gap: 8, marginBottom: 10 },
  segmentBtn:        { flex: 1, borderRadius: 8, borderWidth: 1, paddingVertical: 9, alignItems: 'center' },
  segmentText:       { fontSize: 11, fontWeight: '700' },
  setRow:            { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, gap: 6 },
  setBadge:          { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  setBadgeText:      { fontSize: 11, fontWeight: '700' },
  setInput:          { flex: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14 },
  danger:            { fontWeight: '600' },
  dupBtn:            { paddingHorizontal: 4 },
  dupBtnText:        { fontSize: 12, fontWeight: '700' },
  addSetBtn:         { marginTop: 10, paddingVertical: 8, borderRadius: 6, borderWidth: 1, alignItems: 'center' },
  addSetBtnText:     { fontWeight: '600' },
  emptyState:        { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyTitle:        { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyHint:         { fontSize: 14, textAlign: 'center' },
  footer:            { padding: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  addExBtn:          { padding: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1.5 },
  addExBtnText:      { fontWeight: '700', fontSize: 16 },
  overlay:           { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 24 },
  modalCard:         { borderRadius: 16, overflow: 'hidden' },
  modalAccentBar:    { height: 4, width: '100%' },
  modalContent:      { padding: 20 },
  modalTitle:        { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input:             { borderRadius: 8, padding: 13, marginBottom: 12, fontSize: 16 },
  modalBtns:         { flexDirection: 'row', marginTop: 4 },
  modalBtnCancel:    { flex: 1, padding: 13, borderRadius: 8, alignItems: 'center', marginRight: 8 },
  modalBtnCancelText:{ fontWeight: '600' },
  modalBtnAccent:    { flex: 1, padding: 13, borderRadius: 8, alignItems: 'center' },
  modalBtnAccentText:{ fontWeight: '700' },
});
