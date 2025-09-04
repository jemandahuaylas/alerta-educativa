
'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useSettings } from '@/hooks/use-settings';

const SettingsContext = createContext(null);

// Helper function to convert hex to HSL
const hexToHSL = (hex: string): string => {
  if (!hex || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
    return "14 90% 61%"; // Default color
  }

  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};


export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { settings } = useSettings();

  useEffect(() => {
    if (settings?.primaryColor) {
      const hsl = hexToHSL(settings.primaryColor);
      
      // Aplicar una transición suave para evitar parpadeo
      const root = document.documentElement;
      root.style.transition = 'none'; // Temporalmente deshabilitar transiciones
      
      root.style.setProperty('--primary', hsl);
      root.style.setProperty('--accent', hsl);
      root.style.setProperty('--ring', hsl);
      
      // Restaurar transiciones después de un frame
      requestAnimationFrame(() => {
        root.style.transition = '';
      });
    }
  }, [settings?.primaryColor]);

  return (
    <SettingsContext.Provider value={null}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
};
