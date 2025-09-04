"use client";

import { useEffect, useRef } from 'react';

/**
 * Hook personalizado para manejar el desplazamiento automático cuando aparece el teclado virtual en móviles
 * Detecta cuando un campo de entrada recibe foco y ajusta el scroll para mantenerlo visible
 */
export function useKeyboardScroll() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Función para manejar el foco en campos de entrada
    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      
      // Verificar si el elemento enfocado es un campo de entrada
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.contentEditable === 'true'
      ) {
        // Esperar un poco para que el teclado virtual aparezca
        setTimeout(() => {
          // Calcular la posición del elemento
          const rect = target.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          
          // Si el elemento está en la mitad inferior de la pantalla
          if (rect.top > viewportHeight / 2) {
            // Calcular cuánto desplazar
            const scrollAmount = rect.top - (viewportHeight * 0.3);
            
            // Desplazar suavemente
            window.scrollTo({
              top: window.scrollY + scrollAmount,
              behavior: 'smooth'
            });
          }
        }, 300); // Delay para permitir que aparezca el teclado
      }
    };

    // Función para manejar cuando se pierde el foco
    const handleBlur = () => {
      // Opcional: volver a la posición original cuando se cierra el teclado
      // Esto puede ser útil en algunos casos pero puede ser molesto en otros
    };

    // Agregar event listeners
    container.addEventListener('focusin', handleFocus);
    container.addEventListener('focusout', handleBlur);

    // Cleanup
    return () => {
      container.removeEventListener('focusin', handleFocus);
      container.removeEventListener('focusout', handleBlur);
    };
  }, []);

  return containerRef;
}

/**
 * Hook alternativo que usa el método de ajuste de viewport para móviles
 * Útil para casos donde se necesita un control más preciso
 */
export function useKeyboardScrollViewport() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Detectar si estamos en un dispositivo móvil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (!isMobile) return;

    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.contentEditable === 'true'
      ) {
        setTimeout(() => {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }, 300);
      }
    };

    container.addEventListener('focusin', handleFocus);

    return () => {
      container.removeEventListener('focusin', handleFocus);
    };
  }, []);

  return containerRef;
}