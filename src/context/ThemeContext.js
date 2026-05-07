import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildTheme } from '../constants/theme';
import { DEFAULT_DATE_FORMAT_KEY, isDateFormatKey } from '../utils/dateFormat';

const STORAGE_KEY_MODE   = '@theme_mode';
const STORAGE_KEY_ACCENT = '@theme_accent';
const STORAGE_KEY_DATE_FORMAT = '@date_format';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setModeState]           = useState('dark');
  const [accentKey, setAccentKeyState] = useState('blue');
  const [dateFormatKey, setDateFormatKeyState] = useState(DEFAULT_DATE_FORMAT_KEY);

  useEffect(() => {
    (async () => {
      const savedMode       = await AsyncStorage.getItem(STORAGE_KEY_MODE);
      const savedAccent     = await AsyncStorage.getItem(STORAGE_KEY_ACCENT);
      const savedDateFormat = await AsyncStorage.getItem(STORAGE_KEY_DATE_FORMAT);
      if (savedMode) setModeState(savedMode);
      if (savedAccent) setAccentKeyState(savedAccent);
      if (isDateFormatKey(savedDateFormat)) setDateFormatKeyState(savedDateFormat);
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

  async function setDateFormat(newDateFormat) {
    if (!isDateFormatKey(newDateFormat)) return;
    setDateFormatKeyState(newDateFormat);
    await AsyncStorage.setItem(STORAGE_KEY_DATE_FORMAT, newDateFormat);
  }

  const theme = buildTheme(mode, accentKey);

  return (
    <ThemeContext.Provider value={{ theme, mode, accentKey, dateFormatKey, setMode, setAccent, setDateFormat }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
