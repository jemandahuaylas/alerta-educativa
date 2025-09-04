// Script para limpiar localStorage y resolver problemas de autenticación
// Ejecutar en la consola del navegador

if (typeof window !== "undefined") {
  console.log('🧹 Limpiando localStorage y sessionStorage...');
  
  // Limpiar todo el localStorage
  window.localStorage.clear();
  
  // Limpiar todo el sessionStorage
  window.sessionStorage.clear();
  
  // Limpiar cookies específicas de Supabase si existen
  const cookies = document.cookie.split(";");
  cookies.forEach(cookie => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    if (name.includes('sb-') || name.includes('supabase')) {
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
  });
  
  console.log('✅ Storage limpiado exitosamente');
  console.log('🔄 Recargando página...');
  
  // Recargar la página después de limpiar
  setTimeout(() => {
    window.location.reload();
  }, 1000);
} else {
  console.log('❌ Este script debe ejecutarse en el navegador');
}