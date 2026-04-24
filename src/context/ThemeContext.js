import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildTheme } from '../constants/theme';

const STORAGE_KEY_MODE   = '@theme_mode';
const STORAGE_KEY_ACCENT = '@theme_accent';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setModeState]           = useState('dark');
  const [accentKey, setAccentKeyState] = useState('blue');

  useEffect(() => {
    (async () => {
      const savedMode   = await AsyncStorage.getItem(STORAGE_KEY_MODE);
      const savedAccent = await AsyncStorage.getItem(STORAGE_KEY_ACCENT);
      if (savedMode)   setModeState(savedMode);
      if (savedAccent) setAccentKeyState(savedAccent);
    })();
  }, []);

  async function setMode(newMode) {
    setModeState(newMode);
    await AsyncStorage.setItem(STORAGE_KEY_MODE, newMode);
  }

  async function setAccent(newAccent) {
    setAccentKeyState(newAccent);
    await AsyncStorage.setItem(STORAGE_KEY_ACCENT, newAccent);
  }

  const theme = buildTheme(mode, accentKey);

  return (
    <ThemeContext.Provider value={{ theme, mode, accentKey, setMode, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
