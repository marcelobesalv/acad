import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { EQUIPMENT_OPTIONS } from '../constants/equipment';

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

function isValidDate(str) {
  if (!str) return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export default function PlanEditorModal({ visible, item, type, onClose, onSaved }) {
  const { theme: C, mode } = useTheme();

  const [name, setName] = useState('');
  const [dateText, setDateText] = useState(''); // '' means queue (no date)
  const [useDate, setUseDate] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Exercise add modal
  const [exModalVisible, setExModalVisible] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newEquipment, setNewEquipment] = useState('machine');

  // Set add modal
  const [setModalVisible, setSetModalVisible] = useState(false);
  const [activeExIdx, setActiveExIdx] = useState(null);
  const [newReps, setNewReps] = useState('');
  const [newWeight, setNewWeight] = useState('');

  useEffect(() => {
    if (visible && item) {
      setName(item.name || '');
      setExercises(cloneExercises(item.exercises));
      if (type === 'plan') {
        setUseDate(!!item.date);
        setDateText(item.date || '');
      }
      setIsSaving(false);
    }
  }, [visible, item?.id, type]);

  function updateExercise(exIdx, patch) {
    setExercises(prev => prev.map((ex, i) => (i === exIdx ? { ...ex, ...patch } : ex)));
  }

  function updateSet(exIdx, setIdx, patch) {
    setExercises(prev => prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      return { ...ex, sets: ex.sets.map((set, j) => (j === setIdx ? { ...set, ...patch } : set)) };
    }));
  }

  function handleAddExercise() {
    const trimmed = newExName.trim();
    if (!trimmed) return;
    setExercises(prev => [...prev, { name: trimmed, equipment: newEquipment, sets: [] }]);
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
        i === activeExIdx
          ? { ...ex, sets: [...ex.sets, { reps: String(reps), weight: String(weight) }] }
          : ex
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
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Give this a name before saving.');
      return;
    }

    if (type === 'plan' && useDate && !isValidDate(dateText)) {
      Alert.alert('Invalid date', 'Enter a date in YYYY-MM-DD format (e.g. 2026-05-20).');
      return;
    }

    let normalizedExercises;
    try {
      normalizedExercises = exercises.map((ex, exIdx) => {
        const exName = ex.name.trim();
        if (!exName) throw new Error(`Exercise ${exIdx + 1} needs a name.`);
        const sets = ex.sets.map((set, setIdx) => {
          const reps = Number.parseInt(String(set.reps ?? ''), 10);
          const weight = parsePositiveNumber(set.weight);
          if (!Number.isFinite(reps) || reps <= 0 || !weight) {
            throw new Error(`${exName}, set ${setIdx + 1}: enter valid reps and weight.`);
          }
          return { reps, weight };
        });
        return { ...ex, name: exName, equipment: ex.equipment || 'machine', sets };
      });
    } catch (e) {
      Alert.alert('Error', e.message);
      return;
    }

    setIsSaving(true);
    try {
      const updated = {
        ...item,
        name: trimmedName,
        exercises: normalizedExercises,
        ...(type === 'plan' ? { date: useDate ? dateText : null } : {}),
      };
      await onSaved(updated);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setIsSaving(false);
    }
  }

  const isTemplate = type === 'template';
  const title = isTemplate ? (item?.id ? 'Edit Template' : 'New Template') : (item?.id ? 'Edit Plan' : 'New Plan');

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView edges={['top', 'bottom']} style={[s.root, { backgroundColor: C.background }]}>
        {/* Header */}
        <View style={[s.header, { borderBottomColor: C.border, backgroundColor: C.surface }]}>
          <TouchableOpacity onPress={onClose} style={s.headerBtn}>
            <Text style={[s.headerBtnText, { color: C.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: C.text }]}>{title}</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving} style={s.headerBtn}>
            <Text style={[s.headerBtnText, { color: C.accent, fontWeight: '700' }]}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
          {/* Name field */}
          <Text style={[s.fieldLabel, { color: C.textSecondary }]}>Name</Text>
          <TextInput
            style={[s.nameInput, { backgroundColor: C.surface, color: C.text, borderColor: C.border }]}
            placeholder={isTemplate ? 'e.g. Push Day' : 'e.g. Monday Chest'}
            placeholderTextColor={C.textSecondary}
            value={name}
            onChangeText={setName}
          />

          {/* Date / queue section — plans only */}
          {!isTemplate && (
            <View style={[s.dateSection, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Text style={[s.fieldLabel, { color: C.textSecondary }]}>Schedule</Text>
              <View style={s.schedulePills}>
                <TouchableOpacity
                  style={[s.schedulePill, { backgroundColor: !useDate ? C.accent : C.surfaceAlt }]}
                  onPress={() => setUseDate(false)}
                >
                  <Text style={[s.schedulePillText, { color: !useDate ? C.onAccent : C.text }]}>Up Next queue</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.schedulePill, { backgroundColor: useDate ? C.accent : C.surfaceAlt }]}
                  onPress={() => setUseDate(true)}
                >
                  <Text style={[s.schedulePillText, { color: useDate ? C.onAccent : C.text }]}>Specific date</Text>
                </TouchableOpacity>
              </View>
              {useDate && (
                <TextInput
                  style={[s.dateInput, { backgroundColor: C.surfaceAlt, color: C.text }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={C.textSecondary}
                  value={dateText}
                  onChangeText={setDateText}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              )}
            </View>
          )}

          {/* Exercise cards */}
          {exercises.map((ex, exIdx) => (
            <View
              key={exIdx}
              style={[s.card, { backgroundColor: C.surface, borderLeftColor: C.accent },
                mode === 'light' && { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }]}
            >
              <View style={s.cardHeader}>
                <TextInput
                  style={[s.exNameInput, { backgroundColor: C.surfaceAlt, color: C.text }]}
                  value={ex.name}
                  onChangeText={exName => updateExercise(exIdx, { name: exName })}
                  placeholder="Exercise name"
                  placeholderTextColor={C.textSecondary}
                />
                <TouchableOpacity
                  onPress={() => removeExercise(exIdx)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={s.iconOnlyBtn}
                >
                  <Ionicons name="trash-outline" size={20} color={C.danger} />
                </TouchableOpacity>
              </View>

              <Text style={[s.fieldLabel, { color: C.textSecondary }]}>Equipment</Text>
              <View style={s.segmentRow}>
                {EQUIPMENT_OPTIONS.map(option => {
                  const selected = ex.equipment === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[s.segmentBtn, { backgroundColor: selected ? C.accent : C.surfaceAlt, borderColor: selected ? C.accent : C.border }]}
                      onPress={() => updateExercise(exIdx, { equipment: option.key })}
                    >
                      <Text style={[s.segmentText, { color: selected ? C.onAccent : C.text }]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[s.fieldLabel, { color: C.textSecondary }]}>
                {isTemplate ? 'Target sets' : 'Sets'}
              </Text>
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
                    style={s.iconOnlyBtn}
                  >
                    <Ionicons name="copy-outline" size={18} color={C.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removeSet(exIdx, setIdx)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={s.iconOnlyBtn}
                  >
                    <Ionicons name="close-circle-outline" size={20} color={C.danger} />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={[s.addSetBtn, { borderColor: C.accent }]} onPress={() => openSetModal(exIdx)}>
                <Ionicons name="add-outline" size={18} color={C.accent} />
                <Text style={[s.addSetBtnText, { color: C.accent }]}>Set</Text>
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

        {/* Footer */}
        <View style={[s.footer, { borderTopColor: C.border }]}>
          <TouchableOpacity
            style={[s.addExBtn, { backgroundColor: C.surface, borderColor: C.accent }]}
            onPress={() => setExModalVisible(true)}
          >
            <Ionicons name="add-outline" size={20} color={C.accent} />
            <Text style={[s.addExBtnText, { color: C.accent }]}>Exercise</Text>
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
                <Text style={[s.fieldLabel, { color: C.textSecondary }]}>Equipment</Text>
                <View style={s.segmentRow}>
                  {EQUIPMENT_OPTIONS.map(option => {
                    const selected = option.key === newEquipment;
                    return (
                      <TouchableOpacity
                        key={option.key}
                        style={[s.segmentBtn, { backgroundColor: selected ? C.accent : C.surfaceAlt, borderColor: selected ? C.accent : C.border }]}
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

        {/* Add Set Modal */}
        <Modal visible={setModalVisible} transparent animationType="slide">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}>
            <View style={[s.modalCard, { backgroundColor: C.surface }]}>
              <View style={[s.modalAccentBar, { backgroundColor: C.accent }]} />
              <View style={s.modalContent}>
                <Text style={[s.modalTitle, { color: C.text }]}>
                  {isTemplate ? 'Target Set' : 'Add Set'}
                </Text>
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
                    <Ionicons name="add-outline" size={18} color={C.onAccent} />
                    <Text style={[s.modalBtnAccentText, { color: C.onAccent }]}>Set</Text>
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
  fieldLabel:        { fontSize: 11, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.7 },
  nameInput:         { borderRadius: 8, padding: 13, fontSize: 16, fontWeight: '700', marginBottom: 16, borderWidth: StyleSheet.hairlineWidth },
  dateSection:       { borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: StyleSheet.hairlineWidth },
  schedulePills:     { flexDirection: 'row', gap: 8, marginBottom: 10 },
  schedulePill:      { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  schedulePillText:  { fontWeight: '600', fontSize: 13 },
  dateInput:         { borderRadius: 8, padding: 12, fontSize: 15 },
  card:              { borderRadius: 10, padding: 14, marginBottom: 12, borderLeftWidth: 3 },
  cardHeader:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  exNameInput:       { flex: 1, borderRadius: 8, padding: 11, fontSize: 16, fontWeight: '700' },
  segmentRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  segmentBtn:        { minWidth: '48%', flexGrow: 1, borderRadius: 8, borderWidth: 1, paddingVertical: 9, alignItems: 'center' },
  segmentText:       { fontSize: 11, fontWeight: '700' },
  setRow:            { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, gap: 6 },
  setBadge:          { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  setBadgeText:      { fontSize: 11, fontWeight: '700' },
  setInput:          { flex: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14 },
  iconOnlyBtn:       { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  addSetBtn:         { marginTop: 10, paddingVertical: 8, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  addSetBtnText:     { fontWeight: '600' },
  emptyState:        { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyTitle:        { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyHint:         { fontSize: 14, textAlign: 'center' },
  footer:            { padding: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  addExBtn:          { padding: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, borderWidth: 1.5 },
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
  modalBtnAccent:    { flex: 1, padding: 13, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  modalBtnAccentText:{ fontWeight: '700' },
});
