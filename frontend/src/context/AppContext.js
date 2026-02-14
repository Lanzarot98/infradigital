import React, { createContext, useReducer, useEffect, useCallback, useMemo } from 'react';

/**
 * AppContext - Contexto global de la aplicacion InfraDigital
 *
 * Gestiona: sidebar, notificaciones, tema visual
 * Acciones: toggleSidebar, addNotification, removeNotification
 */
export const AppContext = createContext(null);

// Tipos de accion
const APP_ACTIONS = {
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_SIDEBAR: 'SET_SIDEBAR',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS',
  SET_THEME: 'SET_THEME',
  SET_ONLINE: 'SET_ONLINE',
};

// Detectar si es movil
const isMobile = () => window.innerWidth <= 1024;

// Estado inicial
const initialState = {
  sidebarOpen: !isMobile(),
  isOnline: navigator.onLine,
  notifications: [],
  theme: localStorage.getItem('infradigital_theme') || 'light',
};

// Reducer de la aplicacion
function appReducer(state, action) {
  switch (action.type) {
    case APP_ACTIONS.TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen,
      };

    case APP_ACTIONS.SET_SIDEBAR:
      return {
        ...state,
        sidebarOpen: action.payload,
      };

    case APP_ACTIONS.ADD_NOTIFICATION: {
      const notification = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
        timestamp: new Date().toISOString(),
        ...action.payload,
      };
      return {
        ...state,
        notifications: [notification, ...state.notifications].slice(0, 50),
      };
    }

    case APP_ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
      };

    case APP_ACTIONS.CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: [],
      };

    case APP_ACTIONS.SET_ONLINE:
      return {
        ...state,
        isOnline: action.payload,
      };

    case APP_ACTIONS.SET_THEME:
      return {
        ...state,
        theme: action.payload,
      };

    default:
      return state;
  }
}

/**
 * AppProvider - Proveedor del contexto de la aplicacion
 */
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  /**
   * Manejar cambio de tamano de ventana para sidebar responsivo
   */
  useEffect(() => {
    const handleResize = () => {
      if (isMobile()) {
        dispatch({ type: APP_ACTIONS.SET_SIDEBAR, payload: false });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  /**
   * Detectar estado de conexion online/offline
   */
  useEffect(() => {
    const handleOnline = () => dispatch({ type: APP_ACTIONS.SET_ONLINE, payload: true });
    const handleOffline = () => dispatch({ type: APP_ACTIONS.SET_ONLINE, payload: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  /**
   * Escuchar mensajes del Service Worker
   */
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event) => {
        const { type, payload } = event.data || {};

        if (type === 'SYNC_STATUS' && payload && payload.synced) {
          dispatch({
            type: APP_ACTIONS.ADD_NOTIFICATION,
            payload: {
              type: 'success',
              title: 'Sincronizacion completada',
              message: 'Se sincronizaron ' + (payload.count || 0) + ' operaciones pendientes.',
              autoClose: 5000,
            },
          });
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
    }
  }, []);

  /**
   * Alternar sidebar abierto/cerrado
   */
  const toggleSidebar = useCallback(() => {
    dispatch({ type: APP_ACTIONS.TOGGLE_SIDEBAR });
  }, []);

  /**
   * Establecer estado del sidebar directamente
   */
  const setSidebarOpen = useCallback((isOpen) => {
    dispatch({ type: APP_ACTIONS.SET_SIDEBAR, payload: isOpen });
  }, []);

  /**
   * Agregar una notificacion
   * @param {Object} notification - { type: 'success'|'error'|'warning'|'info', title, message, autoClose? }
   */
  const addNotification = useCallback((notification) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);

    dispatch({
      type: APP_ACTIONS.ADD_NOTIFICATION,
      payload: { ...notification, id },
    });

    // Auto-cerrar si se especifica
    if (notification.autoClose !== false) {
      const timeout = notification.autoClose || 4000;
      setTimeout(() => {
        dispatch({ type: APP_ACTIONS.REMOVE_NOTIFICATION, payload: id });
      }, timeout);
    }

    return id;
  }, []);

  /**
   * Eliminar una notificacion por ID
   */
  const removeNotification = useCallback((id) => {
    dispatch({ type: APP_ACTIONS.REMOVE_NOTIFICATION, payload: id });
  }, []);

  /**
   * Limpiar todas las notificaciones
   */
  const clearNotifications = useCallback(() => {
    dispatch({ type: APP_ACTIONS.CLEAR_NOTIFICATIONS });
  }, []);

  /**
   * Cambiar el tema visual
   */
  const setTheme = useCallback((theme) => {
    localStorage.setItem('infradigital_theme', theme);
    dispatch({ type: APP_ACTIONS.SET_THEME, payload: theme });
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  // Valor del contexto memoizado
  const contextValue = useMemo(() => ({
    // Estado
    sidebarOpen: state.sidebarOpen,
    isOnline: state.isOnline,
    notifications: state.notifications,
    theme: state.theme,

    // Acciones
    toggleSidebar,
    setSidebarOpen,
    addNotification,
    removeNotification,
    clearNotifications,
    setTheme,
  }), [
    state.sidebarOpen,
    state.isOnline,
    state.notifications,
    state.theme,
    toggleSidebar,
    setSidebarOpen,
    addNotification,
    removeNotification,
    clearNotifications,
    setTheme,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;