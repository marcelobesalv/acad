# ACAD Gym Tracker

Offline Android gym tracking app — React Native + Expo SDK 51 (managed workflow).

## Features

- **Log** — record today's exercises and sets (reps + weight)
- **History** — browse past workouts by date, see total session volume
- **Progress** — per-exercise line chart of max weight over time
- **Backup** — export/import all data as JSON

## Prerequisites

- Node.js 18+
- npm 9+
- **Expo Go** (Android) for dev previews — install from Google Play

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

Requires a free Expo account:

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile production
```

The APK download link is printed in the terminal and available in your EAS dashboard.

## Build APK — Local (advanced)

Requires Android SDK + NDK installed locally:

```bash
eas build --platform android --profile production --local
```

## Data Backup & Restore

Open the **History** tab:

- **Export JSON** — saves a timestamped backup file and opens the share sheet
- **Import JSON** — pick a backup file and choose to replace all existing data

The backup is a plain JSON array — you can read, edit, or archive it anywhere.

## Project Structure

```
acad/
├── App.js                        # Navigation setup
├── app.json                      # Expo config
├── eas.json                      # EAS Build profiles
├── package.json
└── src/
    ├── constants/theme.js        # Dark theme color tokens
    ├── storage/storage.js        # AsyncStorage CRUD
    ├── utils/exportImport.js     # JSON backup helpers
    └── screens/
        ├── LogScreen.js          # Workout logging
        ├── HistoryScreen.js      # Workout history
        └── ProgressScreen.js     # Progress charts
```

## Tech Stack

| Purpose | Package |
|---|---|
| Framework | Expo SDK 51 (managed) |
| Storage | @react-native-async-storage/async-storage |
| Navigation | @react-navigation/bottom-tabs |
| Charts | react-native-gifted-charts |
| File I/O | expo-file-system + expo-sharing + expo-document-picker |
