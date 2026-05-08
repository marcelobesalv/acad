# ACAD Gym

Offline-first gym tracking app built with React Native and Expo SDK 54.

ACAD Gym is a compact workout log for recording daily training sessions, reviewing past workouts, tracking per-exercise progress, and keeping local JSON backups of your data.

## Features

### Log Workouts

- Create multiple workout sessions on the same day without overwriting earlier sessions.
- Add exercises with equipment tags: Machine, Cable, Dumbbell, or Barbell.
- Record sets with reps and weight in kg.
- Duplicate or remove individual sets.
- Remove exercises from the current session.
- Add a free-text note per exercise to record observations (e.g. "shoulder felt tight").
- Save only when the active session has unsaved changes.
- Switching sessions preserves non-empty edits by saving them quietly first.

### Plan Workouts

- Create reusable workout templates (e.g. "Push Day", "Leg Day") with target exercises and sets.
- Schedule a template to a specific date, or drop it into an ordered "Up Next" queue with no date.
- Reorder queued plans with up/down arrows.
- Tap Start on any plan to pre-fill today's session with its exercises, then log actual results.
- A banner appears on the Log screen when a plan is up next.

### Review History

- View workouts grouped by date, newest first.
- See multiple workouts on the same date as Session 1, Session 2, and so on.
- Expand workout cards to inspect exercises, equipment, sets, reps, weights, and notes.
- See total workout volume on each session card.
- Edit any past workout in a full-screen editor.

### Track Progress

- Choose any logged exercise and chart progress over time.
- Switch between three metrics:
  - Weight: max weight used for the exercise on that day.
  - Volume: total reps x kg across all sets on that day.
  - Reps: max reps in a single set on that day.
- Multiple sessions on the same day are merged for charting: volume is summed, weight and reps use the max value.

### Backup Data

- Export workouts as JSON from the History screen.
- Import a JSON backup to replace the current workout database.
- Android exports are saved to a folder you choose through the system file picker.

### Customize Appearance

- Toggle dark and light mode.
- Pick an accent color from yellow, blue, teal, coral, or purple.
- Choose the date format used across the app.
- Display choices are stored locally on the device.

## Tech Stack

| Purpose | Package |
| --- | --- |
| App runtime | Expo SDK 54 |
| UI framework | React Native 0.81 |
| Navigation | React Navigation bottom tabs |
| Icons | Expo Vector Icons |
| Charts | react-native-gifted-charts |
| Storage | @react-native-async-storage/async-storage |
| File import/export | expo-file-system, expo-document-picker, expo-sharing |
| Build service | EAS Build |

## Requirements

- Node.js 20.19 or newer
- npm 9 or newer
- Expo Go for local device previews
- Android Studio with a virtual device if you want to run an emulator
- An Expo account and EAS CLI if you want to build an APK

This project is currently configured for Android in `app.json`.

## Setup

```bash
npm install
```

## Run Locally

Start the Expo development server:

```bash
npm start
```

Then scan the QR code with Expo Go.

Run directly on an Android emulator or connected Android device:

```bash
npm run android
```

## Build an APK

Install and sign in to EAS CLI:

```bash
npm install -g eas-cli
eas login
```

Start the production Android APK build:

```bash
npm run build:apk
```

The build output is available in the terminal and in the Expo/EAS dashboard.

## Data Storage

Workout data is stored locally in AsyncStorage under `@acad_workouts`. Templates and plans are stored under `@acad_templates` and `@acad_plans`. Theme and display settings are stored under `@theme_mode`, `@theme_accent`, and `@date_format`.

Uninstalling the app clears local data. Export a JSON backup before reinstalling or moving to another device, then import it from the History screen. Backups include workouts, templates, and plans. Old flat-array backup files (v1) are still importable.

Workout dates are stored as `YYYY-MM-DD` using the device's local date, regardless of the selected display format. Weights are stored in kilograms.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run android` | Start Expo and open the Android target |
| `npm run build:apk` | Build a production Android APK with EAS |

## Project Structure

```text
acad/
|-- App.js                         # App entry, theme provider, bottom tab navigation
|-- app.json                       # Expo app config
|-- eas.json                       # EAS Build profiles
|-- package.json                   # Scripts and dependencies
|-- assets/                        # App icons
|-- docs/                          # Planning and design notes
`-- src/
    |-- components/
    |   |-- PlanEditorModal.js     # Full-screen editor for templates and plans
    |   `-- WorkoutEditorModal.js  # Full-screen editor for past workouts
    |-- constants/
    |   |-- equipment.js           # Equipment options and labels
    |   `-- theme.js               # Color palettes and theme builder
    |-- context/
    |   `-- ThemeContext.js        # Persisted theme mode and accent state
    |-- screens/
    |   |-- LogScreen.js           # Today's workout logging
    |   |-- HistoryScreen.js       # History, edit, import, and export
    |   |-- PlanScreen.js          # Workout planner: templates, queue, scheduled plans
    |   |-- ProgressScreen.js      # Exercise charts
    |   `-- SettingsScreen.js      # Appearance controls
    |-- storage/
    |   |-- planStorage.js         # AsyncStorage accessors for templates and plans
    |   `-- storage.js             # AsyncStorage workout accessors
    `-- utils/
        |-- dateFormat.js          # Display date formatting options
        `-- exportImport.js        # JSON backup helpers (v2 format)
```

## Notes

- The app is designed to work offline after it has loaded.
- There are no automated tests configured yet.
- Local Android builds are not required; EAS Cloud Build is the intended APK path.
