import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

type Theme = 'valorant' | 'dark' | 'light'; // Temas disponíveis

interface ThemeContextType {
  theme: Theme;
  accentColor: string;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: string) => void;
  resetThemeSettings: () => void;
}

const DEFAULT_THEME: Theme = 'valorant';
const DEFAULT_ACCENT_COLOR = '#ff4655'; // Vermelho Valorant padrão

// Função para clarear cor (adaptada do original)
const lightenColor = (color: string, percent: number): string => {
  try {
    let num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);

    let R = (num >> 16) + amt;
    let G = ((num >> 8) & 0x00ff) + amt;
    let B = (num & 0x0000ff) + amt;

    R = Math.min(255, Math.max(0, R));
    G = Math.min(255, Math.max(0, G));
    B = Math.min(255, Math.max(0, B));

    return `#${(
      0x1000000 + R * 0x10000 + G * 0x100 + B
    ).toString(16).slice(1)}`;
  } catch (e) {
    console.error("Erro ao clarear cor:", e);
    return color; // Retorna a cor original em caso de erro
  }
};


const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || DEFAULT_THEME;
  });
  const [accentColor, setAccentColorState] = useState<string>(() => {
    return localStorage.getItem('accentColor') || DEFAULT_ACCENT_COLOR;
  });

  useEffect(() => {
    document.body.className = `${theme}-theme`; // Aplica a classe de tema ao body
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--valorant-red', accentColor);
    document.documentElement.style.setProperty('--valorant-red-hover', lightenColor(accentColor, 10)); // Ajustado para 10% de clareamento
    localStorage.setItem('accentColor', accentColor);
  }, [accentColor]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const setAccentColor = useCallback((color: string) => {
    setAccentColorState(color);
  }, []);

  const resetThemeSettings = useCallback(() => {
    setThemeState(DEFAULT_THEME);
    setAccentColorState(DEFAULT_ACCENT_COLOR);
  }, []);

  const value = {
    theme,
    accentColor,
    setTheme,
    setAccentColor,
    resetThemeSettings,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
