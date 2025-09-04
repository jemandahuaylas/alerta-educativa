"use client";

import { useEffect } from 'react';
import { useSettings } from './use-settings';

export function useDynamicFavicon() {
  const { settings } = useSettings();

  useEffect(() => {
    // Solo actualizar el favicon si los settings están completamente cargados
    if (!settings) return;
    
    const updateFavicon = async () => {
      // Obtener o crear el elemento link del favicon
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }

      if (settings.logoUrl) {
        try {
          // Crear un canvas para generar el favicon desde la imagen del logo
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 32;
          canvas.height = 32;

          if (ctx) {
            // Crear una imagen desde el logoUrl
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
              // Limpiar el canvas con fondo transparente
              ctx.clearRect(0, 0, 32, 32);
              
              // Dibujar la imagen centrada y escalada
              const size = Math.min(32, 32);
              const x = (32 - size) / 2;
              const y = (32 - size) / 2;
              
              ctx.drawImage(img, x, y, size, size);
              
              // Convertir canvas a data URL y establecer como favicon
              const dataUrl = canvas.toDataURL('image/png');
              favicon.href = dataUrl;
            };
            
            img.onerror = () => {
              // Si falla la carga de la imagen, usar favicon por defecto
              favicon.href = '/favicon.ico';
            };
            
            img.src = settings.logoUrl;
          }
        } catch (error) {
          console.warn('Error al generar favicon dinámico:', error);
          // Fallback al favicon por defecto
          favicon.href = '/favicon.ico';
        }
      } else {
        // Si no hay logoUrl, generar favicon con el ícono de School
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 32;
        canvas.height = 32;

        if (ctx) {
          // Fondo con color primario
          ctx.fillStyle = settings.primaryColor || '#3b82f6';
          ctx.fillRect(0, 0, 32, 32);
          
          // Dibujar un ícono simple de escuela (rectángulo con triángulo)
          ctx.fillStyle = '#ffffff';
          
          // Base del edificio
          ctx.fillRect(8, 16, 16, 12);
          
          // Techo triangular
          ctx.beginPath();
          ctx.moveTo(16, 8);
          ctx.lineTo(6, 16);
          ctx.lineTo(26, 16);
          ctx.closePath();
          ctx.fill();
          
          // Puerta
          ctx.fillStyle = settings.primaryColor || '#3b82f6';
          ctx.fillRect(14, 22, 4, 6);
          
          const dataUrl = canvas.toDataURL('image/png');
          favicon.href = dataUrl;
        }
      }
    };

    updateFavicon();
  }, [settings]);
}