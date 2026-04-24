import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getWorkoutByDate,
  saveWorkout,
  generateId,
  getTodayString,
} from '../storage/storage';
import { COLORS } from '../constants/theme';

export default function LogScreen() {
  const today = getTodayString();
  const [exercises, setExercises] = useState([]);
  const [workoutId, setWorkoutId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [exModalVisible, setExModalVisible] = useState(false);
  const [newExName, setNewExName] = useState('');

  const [setModalVisible, setSetModalVisible] = useState(false);
  const [activeExIdx, setActiveExIdx] = useState(null);
  const [newReps, setNewReps] = useState('');
  const [newWeight, setNewWeight] = useState('');

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
      return () => {
        active = false;
      };
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
    const reps = parseInt(newReps, 10);
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
        i === exIdx
          ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) }
          : ex
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
      await saveWorkout({
        id: workoutId ?? generateId(),
        date: today,
        exercises,
      });
      Alert.alert('Saved', 'Workout saved successfully.');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={s.root}>
      <Text style={s.dateHeader}>{today}</Text>

      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 16 }}>
        {exercises.map((ex, exIdx) => (
          <View key={exIdx} style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.exName}>{ex.name}</Text>
              <TouchableOpacity
                onPress={() => removeExercise(exIdx)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={s.danger}>Remove</Text>
              </TouchableOpacity>
            </View>

            {ex.sets.map((set, setIdx) => (
              <View key={setIdx} style={s.setRow}>
                <Text style={s.setLabel}>Set {setIdx + 1}</Text>
                <Text style={s.setVal}>
                  {set.reps} reps × {set.weight} kg
                </Text>
                <TouchableOpacity
                  onPress={() => removeSet(exIdx, setIdx)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={s.danger}>×</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={s.addSetBtn}
              onPress={() => openSetModal(exIdx)}
            >
              <Text style={s.addSetBtnText}>+ Add Set</Text>
            </TouchableOpacity>
          </View>
        ))}

        {exercises.length === 0 && (
          <Text style={s.empty}>No exercises yet. Tap below to add one.</Text>
        )}
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={s.addExBtn}
          onPress={() => setExModalVisible(true)}
        >
          <Text style={s.addExBtnText}>+ Add Exercise</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.saveBtn}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={s.saveBtnText}>
            {isSaving ? 'Saving…' : 'Save Workout'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add Exercise Modal */}
      <Modal visible={exModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.overlay}
        >
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>New Exercise</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. Bench Press"
              placeholderTextColor={COLORS.textSecondary}
              value={newExName}
              onChangeText={setNewExName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAddExercise}
            />
            <View style={s.modalBtns}>
              <TouchableOpacity
                style={s.modalBtnCancel}
                onPress={() => setExModalVisible(false)}
              >
                <Text style={s.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.modalBtnAccent}
                onPress={handleAddExercise}
              >
                <Text style={s.modalBtnAccentText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Set Modal */}
      <Modal visible={setModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.overlay}
        >
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Add Set</Text>
            <TextInput
              style={s.input}
              placeholder="Reps"
              placeholderTextColor={COLORS.textSecondary}
              value={newReps}
              onChangeText={setNewReps}
              keyboardType="number-pad"
              autoFocus
            />
            <TextInput
              style={s.input}
              placeholder="Weight (kg)"
              placeholderTextColor={COLORS.textSecondary}
              value={newWeight}
              onChangeText={setNewWeight}
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={handleAddSet}
            />
            <View style={s.modalBtns}>
              <TouchableOpacity
                style={s.modalBtnCancel}
                onPress={() => setSetModalVisible(false)}
              >
                <Text style={s.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.modalBtnAccent}
                onPress={handleAddSet}
              >
                <Text style={s.modalBtnAccentText}>Add Set</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  dateHeader: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.accent,
    padding: 16,
    paddingBottom: 8,
  },
  scroll: { flex: 1, paddingHorizontal: 16 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  exName: { fontSize: 17, fontWeight: '700', color: COLORS.text, flex: 1 },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  setLabel: { color: COLORS.textSecondary, width: 50, fontSize: 13 },
  setVal: { flex: 1, color: COLORS.text, fontSize: 15 },
  danger: { color: COLORS.danger, fontWeight: '600' },
  addSetBtn: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.accent,
    alignItems: 'center',
  },
  addSetBtnText: { color: COLORS.accent, fontWeight: '600' },
  empty: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
  footer: { padding: 16, paddingTop: 8 },
  addExBtn: {
    backgroundColor: COLORS.surfaceAlt,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  addExBtnText: { color: COLORS.accent, fontWeight: '700', fontSize: 16 },
  saveBtn: {
    backgroundColor: COLORS.accent,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: { color: '#000', fontWeight: '700', fontSize: 17 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    color: COLORS.text,
    borderRadius: 8,
    padding: 13,
    marginBottom: 12,
    fontSize: 16,
  },
  modalBtns: { flexDirection: 'row', marginTop: 4 },
  modalBtnCancel: {
    flex: 1,
    padding: 13,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    marginRight: 8,
  },
  modalBtnCancelText: { color: COLORS.text, fontWeight: '600' },
  modalBtnAccent: {
    flex: 1,
    padding: 13,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.accent,
  },
  modalBtnAccentText: { color: '#000', fontWeight: '700' },
});
