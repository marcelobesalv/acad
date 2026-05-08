# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start            # Start the Expo dev server (scan QR with Expo Go)
npm run android      # Start Expo and open Android emulator/device
npm run build:apk    # Build production APK via EAS Cloud Build
```

No test runner is configured. No linter is configured.

## Architecture

**ACAD Gym** is an offline-first React Native / Expo SDK 54 app for Android. There is no backend — all data lives in AsyncStorage on the device.

### Navigation

`App.js` is the entry point. It wraps the app in `ErrorBoundary`, `SafeAreaProvider`, `ThemeProvider`, and `NavigationContainer`, then renders a `createBottomTabNavigator` with four tabs: Log, History, Progress, Settings.

### Data model

Workouts are stored as a flat JSON array under the AsyncStorage key `@acad_workouts`. Each workout object looks like:

```js
{
  id: "1714000000000-abc1234",  // generateId() — timestamp + random
  date: "2026-04-24",           // YYYY-MM-DD, local device date
  exercises: [
    {
      name: "Bench Press",
      equipment: "barbell",     // machine | cable | dumbbell | barbell
      sets: [{ reps: 10, weight: 80 }]  // weight always in kg
    }
  ]
}
```

Multiple workouts can share the same date (multi-session). `getWorkoutsByDate` returns them sorted by ID (oldest first = Session 1, 2...). All reads/writes go through `src/storage/storage.js`.

### Theme system

`ThemeProvider` (`src/context/ThemeContext.js`) persists mode (`dark`/`light`), accent key, and date format key to AsyncStorage. `buildTheme(mode, accentKey)` in `src/constants/theme.js` returns a flat color object. Screens and components call `useTheme()` and destructure `{ theme: C }` — every color reference in JSX is `C.background`, `C.accent`, etc.

### Key patterns

- **`useFocusEffect` + `useCallback`**: screens reload data when they gain focus. The cancel flag pattern (`let active = true; return () => { active = false; }`) is used to avoid setState on unmounted components.
- **Workout editing**: `WorkoutEditorModal` (`src/components/WorkoutEditorModal.js`) is a full-screen `Modal` slide used for editing any past workout. It receives `workout` and `onSaved` props. The same exercise/set editing UI is duplicated between `LogScreen` and `WorkoutEditorModal` — they are intentionally separate.
- **Silent save**: `LogScreen` silently saves the active session when the user switches to another session, so no edits are lost.
- **Date handling**: Dates are always stored as `YYYY-MM-DD` strings. `src/utils/dateFormat.js` handles all display formatting using a custom `parseLocalDate` that avoids timezone issues (`new Date(year, month-1, day)` instead of parsing ISO strings directly).
- **Styles**: each file uses a local `StyleSheet.create` object named `s`, defined at the bottom of the file. Dynamic theming is done by spreading `{ color: C.text }` inline.
