# Theme System & UI Redesign

**Date:** 2026-04-24  
**Status:** Approved

## Overview

Add a user-controlled theme system (dark/light mode + 5 accent color choices) with a new Settings tab, and improve overall UI/UX quality across all three existing screens.

---

## 1. Theme Architecture

### `src/constants/theme.js` (rewrite)

Export two things:

**`ACCENTS`** — map of accent key → hex:
```
yellow  #F5C842
blue    #60A5FA
teal    #34D399
coral   #FB923C
purple  #A78BFA
```

**`buildTheme(mode, accentKey)`** — returns a COLORS object:

Dark mode base:
- `background`: `#0F0F0F`
- `surface`: `#1A1A1A`
- `surfaceAlt`: `#252525`
- `text`: `#FFFFFF`
- `textSecondary`: `#9E9E9E`
- `border`: `#2C2C2C`
- `danger`: `#FF5252`
- `accent`: value from ACCENTS[accentKey]
- `onAccent`: `#000000` (text on accent-colored backgrounds)

Light mode base:
- `background`: `#F2F2F7`
- `surface`: `#FFFFFF`
- `surfaceAlt`: `#E5E5EA`
- `text`: `#1A1A1A`
- `textSecondary`: `#6C6C70`
- `border`: `#D1D1D6`
- `danger`: `#E53935`
- `accent`: value from ACCENTS[accentKey]
- `onAccent`: `#000000`

### `src/context/ThemeContext.js` (new)

- Loads `mode` and `accentKey` from AsyncStorage on mount
- Default: `mode = 'dark'`, `accentKey = 'blue'`
- Computes `theme = buildTheme(mode, accentKey)` reactively
- Persists both values to AsyncStorage whenever they change
- Exports `ThemeProvider` component and `useTheme()` hook
- `useTheme()` returns `{ theme, mode, accentKey, setMode, setAccent }`

---

## 2. Settings Screen (`src/screens/SettingsScreen.js`) — new

Fourth tab in the bottom navigator, icon label `⚙ Settings`.

**Appearance section:**

| Element | Detail |
|---|---|
| Section header | "APPEARANCE" in small caps, `textSecondary` color |
| Dark Mode row | Label "Dark Mode" + React Native `Switch` (accent-colored when on) |
| Accent Color row | Label "Accent Color" + 5 circular swatches (44px diameter) in a horizontal row |

Swatch behavior:
- Selected swatch shows a checkmark centered inside; checkmark color is `#000000` (visible on all 5 accent colors)
- Tapping an unselected swatch immediately applies it (no confirmation needed)

---

## 3. UI/UX Improvements (all screens)

### Tab bar
- Add unicode symbol prefix to each tab label: `✏ Log`, `≡ History`, `↑ Progress`, `⚙ Settings`
- Active label uses `accent` color, inactive uses `textSecondary`
- Tab bar background: `surface`, border top: `border`

### Cards (Log, History)
- Add a `3px` left border in `accent` color to each card for visual anchoring
- Light mode: add `shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2`
- Dark mode: no shadow (already dark bg)

### Set rows (LogScreen)
- Replace `"Set 1"` plain text label with a small filled circle badge (20px, `accent` bg, `onAccent` text, bold)
- Font size 11px inside badge

### Date header (LogScreen)
- Format raw ISO string (`2026-04-24`) as human-readable: `Thursday, Apr 24`
- Use `toLocaleDateString` with options `{ weekday: 'long', month: 'short', day: 'numeric' }`

### Buttons (LogScreen)
- `Save Workout`: keep full-width accent fill, text color `onAccent`
- `+ Add Exercise`: replace plain surfaceAlt fill with a left `3px accent` border + transparent fill, accent-colored text

### Modals (Log, Progress)
- Corner radius: `16px` (up from `14px`)
- Add a `4px` tall accent-colored top bar (full width, top-rounded corners) as a visual cap

### History screen exercise names
- Show exercise names in `text` color (not `accent`) inside expanded detail — accent was overused there

---

## 4. Files Changed

| File | Change |
|---|---|
| `src/constants/theme.js` | Full rewrite — `ACCENTS` + `buildTheme()` |
| `src/context/ThemeContext.js` | New — `ThemeProvider` + `useTheme()` |
| `src/screens/SettingsScreen.js` | New — Settings tab UI |
| `src/screens/LogScreen.js` | Swap `COLORS` import → `useTheme()`; apply UI improvements |
| `src/screens/HistoryScreen.js` | Swap `COLORS` import → `useTheme()`; fix exercise name color |
| `src/screens/ProgressScreen.js` | Swap `COLORS` import → `useTheme()` |
| `App.js` | Wrap with `ThemeProvider`; add Settings tab; update tab bar styles |

---

## 5. Out of Scope

- Custom font loading
- Animated theme transitions
- Per-screen theme overrides
- System dark/light mode auto-detection (user controls it manually)
