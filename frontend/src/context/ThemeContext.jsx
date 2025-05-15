import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Try to get the theme from localStorage
    const savedTheme = localStorage.getItem('blanesHomes-theme');
    return savedTheme || 'dark'; // Default to dark theme
  });

  // Update localStorage when theme changes
  useEffect(() => {
    localStorage.setItem('blanesHomes-theme', theme);
    // Apply theme to body
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);