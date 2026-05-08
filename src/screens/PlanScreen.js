import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, SafeAreaView, Modal,
  KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import {
  getAllTemplates, saveTemplate, deleteTemplate,
  getQueuedPlans, getDatedPlans, savePlan, deletePlan,
  movePlanUp, movePlanDown, startPlan,
} from '../storage/planStorage';
import { generateId } from '../storage/storage';
import { formatDisplayDate } from '../utils/dateFormat';
import PlanEditorModal from '../components/PlanEditorModal';

const SECTIONS = ['Up Next', 'Scheduled', 'Templates'];

export default function PlanScreen({ navigation }) {
  const { theme: C, mode, dateFormatKey } = useTheme();
  const [section, setSection] = useState('Up Next');
  const [queued, setQueued] = useState([]);
  const [dated, setDated] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editingType, setEditingType] = useState(null); // 'plan' | 'template'
  const [newPlanModal, setNewPlanModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateModal, setNewTemplateModal] = useState(false);

  async function reload() {
    const [q, d, t] = await Promise.all([getQueuedPlans(), getDatedPlans(), getAllTemplates()]);
    setQueued(q);
    setDated(d);
    setTemplates(t);
  }

  useFocusEffect(
    useCallback(() => {
      let active = true;
      reload().catch(() => {});
      return () => { active = false; };
    }, [])
  );

  async function handleStart(plan) {
    try {
      await startPlan(plan.id);
      await reload();
      navigation.navigate('Log');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }

  async function handleDeletePlan(plan) {
    Alert.alert(
      'Delete plan',
      `Delete "${plan.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => { await deletePlan(plan.id); await reload(); },
        },
      ]
    );
  }

  async function handleDeleteTemplate(template) {
    Alert.alert(
      'Delete template',
      `Delete "${template.name}"? Existing plans using it are not affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => { await deleteTemplate(template.id); await reload(); },
        },
      ]
    );
  }

  async function handleMoveUp(plan) {
    await movePlanUp(plan.id);
    await reload();
  }

  async function handleMoveDown(plan) {
    await movePlanDown(plan.id);
    await reload();
  }

  function openNewPlanFromTemplate(template) {
    setNewPlanModal(false);
    const draft = {
      id: generateId(),
      templateId: template.id,
      name: template.name,
      date: null,
      order: 0,
      exercises: template.exercises.map(ex => ({
        ...ex,
        sets: (ex.sets || []).map(s => ({ ...s })),
      })),
      status: 'pending',
      workoutId: null,
    };
    setEditing(draft);
    setEditingType('plan');
  }

  function openNewBlankPlan() {
    setNewPlanModal(false);
    const draft = {
      id: generateId(),
      templateId: null,
      name: '',
      date: null,
      order: 0,
      exercises: [],
      status: 'pending',
      workoutId: null,
    };
    setEditing(draft);
    setEditingType('plan');
  }

  async function handleCreateTemplate() {
    const name = newTemplateName.trim();
    if (!name) return;
    const draft = { id: generateId(), name, exercises: [] };
    setNewTemplateName('');
    setNewTemplateModal(false);
    setEditing(draft);
    setEditingType('template');
  }

  async function handleSavePlan(updated) {
    await savePlan(updated);
    setEditing(null);
    await reload();
  }

  async function handleSaveTemplate(updated) {
    await saveTemplate(updated);
    setEditing(null);
    await reload();
  }

  // Group dated plans by date
  const datedGroups = (() => {
    const map = {};
    for (const p of dated) {
      if (!map[p.date]) map[p.date] = [];
      map[p.date].push(p);
    }
    return Object.keys(map).sort().map(date => ({ date, plans: map[date] }));
  })();

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.background }]}>
      {/* Section pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.pillScroll}
        contentContainerStyle={s.pillContent}
      >
        {SECTIONS.map(sec => (
          <TouchableOpacity
            key={sec}
            style={[s.pill, { backgroundColor: sec === section ? C.accent : C.surface }]}
            onPress={() => setSection(sec)}
          >
            <Text style={[s.pillText, { color: sec === section ? C.onAccent : C.text }]}>{sec}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 24 }}>

        {/* UP NEXT */}
        {section === 'Up Next' && (
          <>
            {queued.length === 0 && (
              <View style={s.emptyState}>
                <Ionicons name="calendar-outline" size={50} color={C.textSecondary} />
                <Text style={[s.emptyTitle, { color: C.text }]}>No plans queued</Text>
                <Text style={[s.emptyHint, { color: C.textSecondary }]}>
                  Add a plan and leave the date blank to put it in your Up Next queue.
                </Text>
              </View>
            )}
            {queued.map((plan, idx) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                mode={mode}
                C={C}
                dateFormatKey={dateFormatKey}
                onStart={() => handleStart(plan)}
                onEdit={() => { setEditing(plan); setEditingType('plan'); }}
                onDelete={() => handleDeletePlan(plan)}
                onMoveUp={idx > 0 ? () => handleMoveUp(plan) : null}
                onMoveDown={idx < queued.length - 1 ? () => handleMoveDown(plan) : null}
              />
            ))}
          </>
        )}

        {/* SCHEDULED */}
        {section === 'Scheduled' && (
          <>
            {datedGroups.length === 0 && (
              <View style={s.emptyState}>
                <Ionicons name="calendar-outline" size={50} color={C.textSecondary} />
                <Text style={[s.emptyTitle, { color: C.text }]}>No scheduled plans</Text>
                <Text style={[s.emptyHint, { color: C.textSecondary }]}>
                  Add a plan with a specific date to see it here.
                </Text>
              </View>
            )}
            {datedGroups.map(group => (
              <View key={group.date} style={s.dateGroup}>
                <Text style={[s.dateHeader, { color: C.accent }]}>
                  {formatDisplayDate(group.date, dateFormatKey)}
                </Text>
                {group.plans.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    mode={mode}
                    C={C}
                    dateFormatKey={dateFormatKey}
                    onStart={() => handleStart(plan)}
                    onEdit={() => { setEditing(plan); setEditingType('plan'); }}
                    onDelete={() => handleDeletePlan(plan)}
                  />
                ))}
              </View>
            ))}
          </>
        )}

        {/* TEMPLATES */}
        {section === 'Templates' && (
          <>
            {templates.length === 0 && (
              <View style={s.emptyState}>
                <Ionicons name="copy-outline" size={50} color={C.textSecondary} />
                <Text style={[s.emptyTitle, { color: C.text }]}>No templates yet</Text>
                <Text style={[s.emptyHint, { color: C.textSecondary }]}>
                  Create a template like "Push Day" to reuse as many plans as you like.
                </Text>
              </View>
            )}
            {templates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                mode={mode}
                C={C}
                onEdit={() => { setEditing(template); setEditingType('template'); }}
                onDelete={() => handleDeleteTemplate(template)}
              />
            ))}
            <TouchableOpacity
              style={[s.addBtn, { borderColor: C.accent }]}
              onPress={() => setNewTemplateModal(true)}
            >
              <Ionicons name="add-outline" size={20} color={C.accent} />
              <Text style={[s.addBtnText, { color: C.accent }]}>New Template</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* FAB — only on Up Next / Scheduled */}
      {section !== 'Templates' && (
        <TouchableOpacity
          style={[s.fab, { backgroundColor: C.accent }]}
          onPress={() => setNewPlanModal(true)}
        >
          <Ionicons name="add-outline" size={26} color={C.onAccent} />
        </TouchableOpacity>
      )}

      {/* New Plan modal — pick template or blank */}
      <Modal visible={newPlanModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}>
          <View style={[s.modalCard, { backgroundColor: C.surface }]}>
            <View style={[s.modalAccentBar, { backgroundColor: C.accent }]} />
            <View style={s.modalContent}>
              <Text style={[s.modalTitle, { color: C.text }]}>New Plan</Text>
              {templates.length > 0 && (
                <>
                  <Text style={[s.fieldLabel, { color: C.textSecondary }]}>From template</Text>
                  {templates.map(t => (
                    <TouchableOpacity
                      key={t.id}
                      style={[s.templatePickerRow, { backgroundColor: C.surfaceAlt }]}
                      onPress={() => openNewPlanFromTemplate(t)}
                    >
                      <Text style={[s.templatePickerName, { color: C.text }]}>{t.name}</Text>
                      <Text style={[s.templatePickerMeta, { color: C.textSecondary }]}>
                        {(t.exercises || []).length} exercise{t.exercises?.length !== 1 ? 's' : ''}
                      </Text>
                      <Ionicons name="chevron-forward-outline" size={16} color={C.textSecondary} />
                    </TouchableOpacity>
                  ))}
                  <View style={s.orRow}>
                    <View style={[s.orLine, { backgroundColor: C.border }]} />
                    <Text style={[s.orText, { color: C.textSecondary }]}>or</Text>
                    <View style={[s.orLine, { backgroundColor: C.border }]} />
                  </View>
                </>
              )}
              <View style={s.modalBtns}>
                <TouchableOpacity
                  style={[s.modalBtnCancel, { backgroundColor: C.surfaceAlt }]}
                  onPress={() => setNewPlanModal(false)}
                >
                  <Text style={[s.modalBtnCancelText, { color: C.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.modalBtnAccent, { backgroundColor: C.accent }]}
                  onPress={openNewBlankPlan}
                >
                  <Ionicons name="add-outline" size={18} color={C.onAccent} />
                  <Text style={[s.modalBtnAccentText, { color: C.onAccent }]}>Blank Plan</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* New Template name modal */}
      <Modal visible={newTemplateModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}>
          <View style={[s.modalCard, { backgroundColor: C.surface }]}>
            <View style={[s.modalAccentBar, { backgroundColor: C.accent }]} />
            <View style={s.modalContent}>
              <Text style={[s.modalTitle, { color: C.text }]}>New Template</Text>
              <TextInput
                style={[s.input, { backgroundColor: C.surfaceAlt, color: C.text }]}
                placeholder="e.g. Push Day"
                placeholderTextColor={C.textSecondary}
                value={newTemplateName}
                onChangeText={setNewTemplateName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCreateTemplate}
              />
              <View style={s.modalBtns}>
                <TouchableOpacity
                  style={[s.modalBtnCancel, { backgroundColor: C.surfaceAlt }]}
                  onPress={() => { setNewTemplateModal(false); setNewTemplateName(''); }}
                >
                  <Text style={[s.modalBtnCancelText, { color: C.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.modalBtnAccent, { backgroundColor: C.accent }]}
                  onPress={handleCreateTemplate}
                >
                  <Text style={[s.modalBtnAccentText, { color: C.onAccent }]}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Plan / Template editor */}
      <PlanEditorModal
        visible={editing !== null}
        item={editing}
        type={editingType}
        onClose={() => setEditing(null)}
        onSaved={editingType === 'template' ? handleSaveTemplate : handleSavePlan}
      />
    </SafeAreaView>
  );
}

function PlanCard({ plan, mode, C, dateFormatKey, onStart, onEdit, onDelete, onMoveUp, onMoveDown }) {
  const exerciseCount = (plan.exercises || []).length;
  return (
    <View style={[s.card, { backgroundColor: C.surface, borderLeftColor: C.accent },
      mode === 'light' && { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }]}>
      <View style={s.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[s.cardName, { color: C.text }]}>{plan.name || 'Unnamed plan'}</Text>
          <Text style={[s.cardMeta, { color: C.textSecondary }]}>
            {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
            {plan.date ? `  ·  ${formatDisplayDate(plan.date, dateFormatKey)}` : ''}
          </Text>
        </View>
        <View style={s.cardActions}>
          {onMoveUp && (
            <TouchableOpacity onPress={onMoveUp} style={s.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-up-outline" size={20} color={C.textSecondary} />
            </TouchableOpacity>
          )}
          {onMoveDown && (
            <TouchableOpacity onPress={onMoveDown} style={s.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-down-outline" size={20} color={C.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onEdit} style={s.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="create-outline" size={20} color={C.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={s.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={20} color={C.danger} />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity style={[s.startBtn, { backgroundColor: C.accent }]} onPress={onStart}>
        <Ionicons name="play-outline" size={16} color={C.onAccent} />
        <Text style={[s.startBtnText, { color: C.onAccent }]}>Start</Text>
      </TouchableOpacity>
    </View>
  );
}

function TemplateCard({ template, mode, C, onEdit, onDelete }) {
  const exerciseCount = (template.exercises || []).length;
  return (
    <View style={[s.card, { backgroundColor: C.surface, borderLeftColor: C.accent },
      mode === 'light' && { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }]}>
      <View style={s.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[s.cardName, { color: C.text }]}>{template.name}</Text>
          <Text style={[s.cardMeta, { color: C.textSecondary }]}>
            {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={s.cardActions}>
          <TouchableOpacity onPress={onEdit} style={s.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="create-outline" size={20} color={C.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={s.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={20} color={C.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:               { flex: 1 },
  pillScroll:         { flexGrow: 0, paddingHorizontal: 16, paddingTop: 12 },
  pillContent:        { flexDirection: 'row', paddingBottom: 12, gap: 8 },
  pill:               { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  pillText:           { fontWeight: '600', fontSize: 14 },
  scroll:             { flex: 1, paddingHorizontal: 16 },
  emptyState:         { alignItems: 'center', marginTop: 60, paddingHorizontal: 32, gap: 12 },
  emptyTitle:         { fontSize: 18, fontWeight: '700' },
  emptyHint:          { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  dateGroup:          { marginBottom: 20 },
  dateHeader:         { fontSize: 14, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  card:               { borderRadius: 10, padding: 14, marginBottom: 12, borderLeftWidth: 3 },
  cardHeader:         { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardName:           { fontSize: 16, fontWeight: '700' },
  cardMeta:           { fontSize: 12, marginTop: 2 },
  cardActions:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn:            { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  startBtn:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 8 },
  startBtnText:       { fontWeight: '700', fontSize: 15 },
  addBtn:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 10, borderWidth: 1.5, marginTop: 4 },
  addBtnText:         { fontWeight: '700', fontSize: 16 },
  fab:                { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  overlay:            { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 24 },
  modalCard:          { borderRadius: 16, overflow: 'hidden' },
  modalAccentBar:     { height: 4, width: '100%' },
  modalContent:       { padding: 20 },
  modalTitle:         { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  fieldLabel:         { fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.7 },
  templatePickerRow:  { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 8 },
  templatePickerName: { flex: 1, fontWeight: '600', fontSize: 15 },
  templatePickerMeta: { fontSize: 12, marginRight: 8 },
  orRow:              { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 },
  orLine:             { flex: 1, height: 1 },
  orText:             { fontSize: 12 },
  input:              { borderRadius: 8, padding: 13, marginBottom: 12, fontSize: 16 },
  modalBtns:          { flexDirection: 'row', marginTop: 4 },
  modalBtnCancel:     { flex: 1, padding: 13, borderRadius: 8, alignItems: 'center', marginRight: 8 },
  modalBtnCancelText: { fontWeight: '600' },
  modalBtnAccent:     { flex: 1, padding: 13, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  modalBtnAccentText: { fontWeight: '700' },
});
