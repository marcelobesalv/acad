# ACAD Gym Tracker

Offline gym tracking app — React Native + Expo SDK 54 (managed workflow).

## Features

### Log
- Multiple sessions per day — create a second session for a late-night workout without overwriting the morning one
- Add exercises and sets (reps + weight) to the active session
- Duplicate any set with one tap (⧉) to repeat the same reps/weight
- Save button only appears when there are unsaved changes
- Switching tabs preserves unsaved edits — they are not discarded on focus loss

### History
- Workouts grouped by date; multiple sessions on the same day are labelled Session 1, Session 2, etc.
- Tap **Edit** on any past session to open a full editor and correct reps, weights, or exercises
- Total session volume shown on each card at a glance

### Progress
- Per-exercise line chart with three selectable metrics:
  - **Weight** — max weight lifted in any set that session
  - **Volume** — total kg × reps across all sets (hypertrophy tracking)
  - **Reps** — max reps in any single set
- Multiple same-day sessions are merged: volume is summed, weight and reps take the max

### Backup
- **Export JSON** — on Android saves directly to a folder you pick; on iOS opens the share sheet
- **Import JSON** — pick a backup file and restore all data

## Prerequisites

- Node.js 20.19+
- npm 9+
- **Expo Go** (Android or iOS) for dev previews

## Setup

```bash
cd acad
npm install
```

## Run with Expo Go (development)

```bash
npx expo start
```

Scan the QR code with Expo Go. The app works 100% offline once loaded.

## Run on Android Emulator

```bash
npx expo start --android
```

Requires Android Studio with a virtual device configured.

## Build APK — EAS Cloud (recommended)

Requires a free Expo account. Local builds are not supported on Windows.

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile production
```

The APK download link is printed in the terminal and available in your EAS dashboard.

## Data persistence

All data lives in `AsyncStorage` on the device. Uninstalling the app wipes it. Use **Export JSON** before reinstalling and **Import JSON** after to keep your history.

## Project Structure

```
acad/
├── App.js                          # Navigation setup (bottom tabs + theme)
├── app.json                        # Expo config
├── eas.json                        # EAS Build profiles
├── package.json
└── src/
    ├── constants/theme.js          # Accent color palettes + buildTheme()
    ├── context/ThemeContext.js     # Dark/light mode + accent state (persisted)
    ├── storage/storage.js          # AsyncStorage CRUD, exercise history queries
    ├── utils/exportImport.js       # JSON backup helpers
    ├── components/
    │   └── WorkoutEditorModal.js   # Reusable full-screen workout editor
    └── screens/
        ├── LogScreen.js            # Today's workout logging (multi-session)
        ├── HistoryScreen.js        # Past workouts grouped by date
        ├── ProgressScreen.js       # Per-exercise progress charts
        └── SettingsScreen.js       # Dark mode toggle + accent color picker
```

## Tech Stack

| Purpose | Package |
|---|---|
| Framework | Expo SDK 54 (managed) |
| Storage | @react-native-async-storage/async-storage |
| Navigation | @react-navigation/bottom-tabs |
| Charts | react-native-gifted-charts |
| File I/O | expo-file-system · expo-sharing · expo-document-picker |
