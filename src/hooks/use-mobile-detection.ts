"use client";

import { useEffect, useState } from 'react';

/**
 * Hook para detectar el tipo de dispositivo móvil y sistema operativo
 */
export function useMobileDetection() {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userAgent = navigator.userAgent;
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const isChrome = /Chrome/.test(userAgent);

    setDeviceInfo({
      isMobile,
      isIOS,
      isAndroid,
      isSafari,
      isChrome,
    });

    // Agregar clases CSS al body para estilos específicos del dispositivo
    const body = document.body;
    
    if (isMobile) body.classList.add('mobile');
    if (isIOS) body.classList.add('ios');
    if (isAndroid) body.classList.add('android');
    if (isSafari) body.classList.add('safari');
    if (isChrome) body.classList.add('chrome');

    // Cleanup
    return () => {
      body.classList.remove('mobile', 'ios', 'android', 'safari', 'chrome');
    };
  }, []);

  return deviceInfo;
}

/**
 * Hook para detectar cuando el teclado virtual está visible
 * Útil para ajustar la UI cuando aparece/desaparece el teclado
 */
export function useVirtualKeyboard() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initialHeight = window.innerHeight;
    setViewportHeight(initialHeight);

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialHeight - currentHeight;
      
      // Si la altura se reduce significativamente, probablemente el teclado está visible
      const keyboardThreshold = 150; // píxeles
      const keyboardVisible = heightDifference > keyboardThreshold;
      
      setIsKeyboardVisible(keyboardVisible);
      setViewportHeight(currentHeight);
      
      // Agregar clase CSS al body
      if (keyboardVisible) {
        document.body.classList.add('keyboard-visible');
      } else {
        document.body.classList.remove('keyboard-visible');
      }
    };

    window.addEventListener('resize', handleResize);
    
    // También escuchar eventos de orientación en móviles
    window.addEventListener('orientationchange', () => {
      setTimeout(handleResize, 500); // Delay para permitir que se complete el cambio
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.body.classList.remove('keyboard-visible');
    };
  }, []);

  return {
    isKeyboardVisible,
    viewportHeight,
  };
}