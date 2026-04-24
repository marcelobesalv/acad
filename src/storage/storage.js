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
  return [...all].sort((a, b) => b.date.localeCompare(a.date));
}

export async function getWorkoutByDate(date) {
  const all = await readAll();
  return all.find(w => w.date === date) ?? null;
}

export async function saveWorkout(workout) {
  const all = await readAll();
  const idx = all.findIndex(w => w.date === workout.date);
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

export async function getExerciseHistory(name) {
  const all = await readAll();
  return all
    .filter(w => w.exercises.some(e => e.name === name))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(w => {
      const ex = w.exercises.find(e => e.name === name);
      const maxWeight = Math.max(...ex.sets.map(s => s.weight));
      return { date: w.date, maxWeight };
    });
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
