import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@acad_workouts';

async function readAll() {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

async function writeAll(workouts) {
  await AsyncStorage.setItem(KEY, JSON.stringify(workouts));
}

export async function getAllWorkouts() {
  return readAll();
}

export async function getAllWorkoutsSortedDesc() {
  const all = await readAll();
  return [...all].sort((a, b) => {
    const dateComp = b.date.localeCompare(a.date);
    if (dateComp !== 0) return dateComp;
    return b.id.localeCompare(a.id); // newer session first within same day
  });
}

export async function getWorkoutsByDate(date) {
  const all = await readAll();
  return all
    .filter(w => w.date === date)
    .sort((a, b) => a.id.localeCompare(b.id)); // oldest first = Session 1, 2...
}

export async function saveWorkout(workout) {
  const all = await readAll();
  const idx = all.findIndex(w => w.id === workout.id); // find by ID, allows multiple per day
  if (idx >= 0) {
    all[idx] = workout;
  } else {
    all.push(workout);
  }
  await writeAll(all);
}

export async function getAllExerciseNames() {
  const all = await readAll();
  const names = new Set(all.flatMap(w => w.exercises.map(e => e.name)));
  return [...names].sort();
}

function getMetricValueForExercise(exercise, metric) {
  const sets = exercise?.sets || [];
  if (sets.length === 0) return null;

  if (metric === 'volume') {
    return sets.reduce((sum, set) => sum + Number(set.reps) * Number(set.weight), 0);
  }

  if (metric === 'reps') {
    return sets.reduce((sum, set) => sum + Number(set.reps), 0);
  }

  return Math.max(...sets.map(set => Number(set.weight)));
}

export async function getExerciseHistory(name, metric = 'weight') {
  const all = await readAll();
  // Group by date. Weight tracks the best set; reps and volume are daily totals.
  const byDate = {};
  for (const w of all) {
    const matching = (w.exercises || []).filter(e => e.name === name);
    for (const ex of matching) {
      const value = getMetricValueForExercise(ex, metric);
      if (!value) continue;
      if (metric === 'weight') {
        if (!byDate[w.date] || value > byDate[w.date]) byDate[w.date] = value;
      } else {
        byDate[w.date] = (byDate[w.date] || 0) + value;
      }
    }
  }
  return Object.keys(byDate)
    .sort()
    .map(date => ({ date, value: byDate[date] }));
}

export async function replaceAllWorkouts(workouts) {
  await writeAll(workouts);
}

export function generateId() {
  return String(Date.now()) + '-' + Math.random().toString(36).slice(2, 9);
}

export function getTodayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
