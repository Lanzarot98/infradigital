import { useState, useEffect, useCallback } from 'react';

/**
 * useOnlineStatus - Hook personalizado para detectar el estado de conexion
 *
 * Monitorea los eventos 'online' y 'offline' del navegador para
 * proporcionar el estado de conexion en tiempo real a los componentes.
 *
 * @returns {Object} { isOnline, wasOffline, lastOnlineAt }
 *
 * Ejemplo de uso:
 *   const { isOnline, wasOffline } = useOnlineStatus();
 *   if (!isOnline) { mostrar mensaje de modo offline }
 *   if (wasOffline) { mostrar aviso de reconexion y sincronizar }
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [lastOnlineAt, setLastOnlineAt] = useState(
    navigator.onLine ? new Date() : null
  );

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setLastOnlineAt(new Date());

    // Si estaba offline antes, marcar que se reconecto
    setWasOffline(true);

    // Limpiar el indicador despues de 5 segundos
    setTimeout(() => {
      setWasOffline(false);
    }, 5000);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    /** true si el navegador tiene conexion a internet */
    isOnline,
    /** true brevemente despues de reconectarse (util para sincronizar) */
    wasOffline,
    /** Fecha/hora de la ultima vez que estuvo online */
    lastOnlineAt,
  };
}

export default useOnlineStatus;