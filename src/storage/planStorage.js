import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveWorkout, generateId, getTodayString } from './storage';

const TEMPLATES_KEY = '@acad_templates';
const PLANS_KEY = '@acad_plans';

async function readTemplates() {
  const raw = await AsyncStorage.getItem(TEMPLATES_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function writeTemplates(templates) {
  await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

async function readPlans() {
  const raw = await AsyncStorage.getItem(PLANS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function writePlans(plans) {
  await AsyncStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

export async function getAllTemplates() {
  return readTemplates();
}

export async function saveTemplate(template) {
  const all = await readTemplates();
  const idx = all.findIndex(t => t.id === template.id);
  if (idx >= 0) {
    all[idx] = template;
  } else {
    all.push(template);
  }
  await writeTemplates(all);
}

export async function deleteTemplate(id) {
  const all = await readTemplates();
  await writeTemplates(all.filter(t => t.id !== id));
}

export async function getAllPlans() {
  return readPlans();
}

export async function getQueuedPlans() {
  const all = await readPlans();
  return all
    .filter(p => p.date === null && p.status === 'pending')
    .sort((a, b) => a.order - b.order);
}

export async function getDatedPlans() {
  const all = await readPlans();
  return all
    .filter(p => p.date !== null && p.status === 'pending')
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function savePlan(plan) {
  const all = await readPlans();
  const idx = all.findIndex(p => p.id === plan.id);
  if (idx >= 0) {
    all[idx] = plan;
  } else {
    if (plan.date === null) {
      const maxOrder = all
        .filter(p => p.date === null)
        .reduce((max, p) => Math.max(max, p.order ?? 0), 0);
      plan = { ...plan, order: maxOrder + 1 };
    }
    all.push(plan);
  }
  await writePlans(all);
}

export async function deletePlan(id) {
  const all = await readPlans();
  await writePlans(all.filter(p => p.id !== id));
}

export async function movePlanUp(id) {
  const all = await readPlans();
  const queued = all
    .filter(p => p.date === null && p.status === 'pending')
    .sort((a, b) => a.order - b.order);
  const idx = queued.findIndex(p => p.id === id);
  if (idx <= 0) return;
  const temp = queued[idx].order;
  queued[idx] = { ...queued[idx], order: queued[idx - 1].order };
  queued[idx - 1] = { ...queued[idx - 1], order: temp };
  const updated = all.map(p => {
    const match = queued.find(q => q.id === p.id);
    return match ?? p;
  });
  await writePlans(updated);
}

export async function movePlanDown(id) {
  const all = await readPlans();
  const queued = all
    .filter(p => p.date === null && p.status === 'pending')
    .sort((a, b) => a.order - b.order);
  const idx = queued.findIndex(p => p.id === id);
  if (idx < 0 || idx >= queued.length - 1) return;
  const temp = queued[idx].order;
  queued[idx] = { ...queued[idx], order: queued[idx + 1].order };
  queued[idx + 1] = { ...queued[idx + 1], order: temp };
  const updated = all.map(p => {
    const match = queued.find(q => q.id === p.id);
    return match ?? p;
  });
  await writePlans(updated);
}

export async function startPlan(planId) {
  const all = await readPlans();
  const plan = all.find(p => p.id === planId);
  if (!plan) throw new Error('Plan not found.');

  const workout = {
    id: generateId(),
    date: getTodayString(),
    exercises: (plan.exercises || []).map(ex => ({
      name: ex.name,
      equipment: ex.equipment || 'machine',
      sets: (ex.sets || []).map(s => ({ reps: s.reps, weight: s.weight })),
    })),
  };

  await saveWorkout(workout);

  const updatedPlan = { ...plan, status: 'completed', workoutId: workout.id };
  const updatedAll = all.map(p => (p.id === planId ? updatedPlan : p));
  await writePlans(updatedAll);

  return workout;
}

export async function getNextPlan() {
  const today = getTodayString();
  const all = await readPlans();
  const pending = all.filter(p => p.status === 'pending');

  const todayPlan = pending
    .filter(p => p.date === today)
    .sort((a, b) => a.id.localeCompare(b.id))[0];
  if (todayPlan) return todayPlan;

  const queued = pending
    .filter(p => p.date === null)
    .sort((a, b) => a.order - b.order)[0];
  return queued ?? null;
}

export async function replaceAllTemplates(templates) {
  await writeTemplates(templates);
}

export async function replaceAllPlans(plans) {
  await writePlans(plans);
}
