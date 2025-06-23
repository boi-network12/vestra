// contexts/ThemeContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

const THEME_KEY = 'app-theme'; // system | light | dark

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('system');
  const systemColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState(systemColorScheme);

  // Listen to system changes if "system" theme is selected
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (theme === 'system') setColorScheme(colorScheme);
    });
    return () => subscription.remove();
  }, [theme]);

  // Load theme from AsyncStorage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_KEY);
        if (storedTheme) {
          setTheme(storedTheme);
          if (storedTheme !== 'system') {
            setColorScheme(storedTheme);
          }
        }
      } catch (error) {
        console.error('Failed to load theme', error);
      }
    };
    loadTheme();
  }, []);

  const applyTheme = async (newTheme) => {
    try {
      setTheme(newTheme);
      if (newTheme === 'system') {
        setColorScheme(systemColorScheme);
      } else {
        setColorScheme(newTheme);
      }
      await AsyncStorage.setItem(THEME_KEY, newTheme);
    } catch (error) {
      console.error('Failed to save theme', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    await applyTheme(newTheme);
  };

  const isDark = theme === 'system' ? colorScheme === 'dark' : theme === 'dark';

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      colorScheme,
      isDark, 
      applyTheme, 
      toggleTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);