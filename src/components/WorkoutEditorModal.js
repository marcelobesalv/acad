import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, StyleSheet, Alert, KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import { saveWorkout } from '../storage/storage';
import { useTheme } from '../context/ThemeContext';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function WorkoutEditorModal({ visible, workout, onClose, onSaved }) {
  const { theme: C, mode } = useTheme();

  const [exercises, setExercises]             = useState([]);
  const [isSaving, setIsSaving]               = useState(false);
  const [exModalVisible, setExModalVisible]   = useState(false);
  const [newExName, setNewExName]             = useState('');
  const [setModalVisible, setSetModalVisible] = useState(false);
  const [activeExIdx, setActiveExIdx]         = useState(null);
  const [newReps, setNewReps]                 = useState('');
  const [newWeight, setNewWeight]             = useState('');

  useEffect(() => {
    if (visible && workout) setExercises(workout.exercises.map(ex => ({ ...ex, sets: [...ex.sets] })));
  }, [visible, workout?.id]);

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

  async function handleSave() {
    setIsSaving(true);
    try {
      const updated = { ...workout, exercises };
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

        {/* Header */}
        <View style={[s.header, { borderBottomColor: C.border, backgroundColor: C.surface }]}>
          <TouchableOpacity onPress={onClose} style={s.headerBtn}>
            <Text style={[s.headerBtnText, { color: C.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: C.text }]}>{formatDate(workout?.date)}</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving} style={s.headerBtn}>
            <Text style={[s.headerBtnText, { color: C.accent, fontWeight: '700' }]}>
              {isSaving ? 'Saving…' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 16 }}>
          {exercises.map((ex, exIdx) => (
            <View key={exIdx} style={[s.card, { backgroundColor: C.surface, borderLeftColor: C.accent },
              mode === 'light' && { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }]}>
              <View style={s.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.exName, { color: C.text }]}>{ex.name}</Text>
                  {ex.sets.length > 0 && (
                    <Text style={[s.exMeta, { color: C.textSecondary }]}>
                      {ex.sets.length} set{ex.sets.length !== 1 ? 's' : ''} · {ex.sets.reduce((s, set) => s + set.reps * set.weight, 0).toFixed(0)} kg vol
                    </Text>
                  )}
                </View>
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
            <View style={s.emptyState}>
              <Text style={s.emptyIcon}>🏋️</Text>
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
    </Modal>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1 },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerBtn:      { minWidth: 64 },
  headerTitle:    { fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  headerBtnText:  { fontSize: 16 },
  scroll:         { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  card:           { borderRadius: 10, padding: 14, marginBottom: 12, borderLeftWidth: 3 },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  exName:         { fontSize: 17, fontWeight: '700' },
  exMeta:         { fontSize: 12, marginTop: 2 },
  setRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  setBadge:       { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  setBadgeText:   { fontSize: 11, fontWeight: '700' },
  setVal:         { flex: 1, fontSize: 15 },
  danger:         { fontWeight: '600' },
  dupBtn:         { marginRight: 10 },
  dupBtnText:     { fontSize: 16, fontWeight: '600' },
  addSetBtn:      { marginTop: 10, paddingVertical: 8, borderRadius: 6, borderWidth: 1, alignItems: 'center' },
  addSetBtnText:  { fontWeight: '600' },
  emptyState:     { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyIcon:      { fontSize: 48, marginBottom: 16 },
  emptyTitle:     { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyHint:      { fontSize: 14, textAlign: 'center' },
  footer:         { padding: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  addExBtn:       { padding: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1.5 },
  addExBtnText:   { fontWeight: '700', fontSize: 16 },
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
