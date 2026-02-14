import React, { createContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';

/**
 * AuthContext - Contexto de autenticacion para InfraDigital
 *
 * Gestiona: usuario, token JWT, estado de carga, errores
 * Acciones: login, register, logout, getProfile, clearError
 */
export const AuthContext = createContext(null);

// Clave para almacenamiento local
const TOKEN_KEY = 'infradigital_token';
const USER_KEY = 'infradigital_user';

// Tipos de accion
const AUTH_ACTIONS = {
  AUTH_START: 'AUTH_START',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_ERROR: 'AUTH_ERROR',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_USER: 'SET_USER',
  SET_LOADING: 'SET_LOADING',
};

// Estado inicial
const initialState = {
  user: null,
  token: localStorage.getItem(TOKEN_KEY) || null,
  loading: true,
  error: null,
  isAuthenticated: false,
};

// Reducer de autenticacion
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.AUTH_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case AUTH_ACTIONS.AUTH_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
        isAuthenticated: true,
      };

    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        loading: false,
        isAuthenticated: true,
      };

    case AUTH_ACTIONS.AUTH_ERROR:
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload,
        isAuthenticated: false,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    default:
      return state;
  }
}

/**
 * AuthProvider - Proveedor del contexto de autenticacion
 */
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Configurar token en axios y localStorage
   */
  const setAuthToken = useCallback((token) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      api.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      delete api.defaults.headers.common['Authorization'];
    }
  }, []);

  /**
   * Auto-login al montar: verificar si hay un token valido almacenado
   */
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);

      if (!storedToken) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        return;
      }

      try {
        // Configurar el token en axios
        api.defaults.headers.common['Authorization'] = 'Bearer ' + storedToken;

        // Obtener perfil del usuario
        const response = await api.get('/auth/profile');

        if (response.data && response.data.user) {
          dispatch({
            type: AUTH_ACTIONS.AUTH_SUCCESS,
            payload: {
              user: response.data.user,
              token: storedToken,
            },
          });
          localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
        } else {
          throw new Error('Respuesta de perfil invalida');
        }
      } catch (error) {
        console.warn('InfraDigital: Token expirado o invalido, cerrando sesion.');

        // Si estamos offline, intentar cargar usuario desde localStorage
        if (!navigator.onLine) {
          const cachedUser = localStorage.getItem(USER_KEY);
          if (cachedUser) {
            try {
              const user = JSON.parse(cachedUser);
              dispatch({
                type: AUTH_ACTIONS.AUTH_SUCCESS,
                payload: { user, token: storedToken },
              });
              return;
            } catch (e) {
              // JSON invalido, continuar con logout
            }
          }
        }

        setAuthToken(null);
        dispatch({ type: AUTH_ACTIONS.AUTH_ERROR, payload: null });
      }
    };

    initializeAuth();
  }, [setAuthToken]);

  /**
   * Iniciar sesion
   * @param {string} email - Correo electronico
   * @param {string} password - Contrasena
   */
  const login = useCallback(async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.AUTH_START });

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      setAuthToken(token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      dispatch({
        type: AUTH_ACTIONS.AUTH_SUCCESS,
        payload: { user, token },
      });

      return { success: true, user };
    } catch (error) {
      const message = (error.response && error.response.data && error.response.data.message)
        || 'Error al iniciar sesion. Verifica tus credenciales.';

      dispatch({ type: AUTH_ACTIONS.AUTH_ERROR, payload: message });
      return { success: false, message };
    }
  }, [setAuthToken]);

  /**
   * Registrar nuevo usuario
   * @param {Object} userData - Datos del usuario (nombre, email, password, empresa)
   */
  const register = useCallback(async (userData) => {
    dispatch({ type: AUTH_ACTIONS.AUTH_START });

    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data;

      setAuthToken(token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      dispatch({
        type: AUTH_ACTIONS.AUTH_SUCCESS,
        payload: { user, token },
      });

      return { success: true, user };
    } catch (error) {
      const message = (error.response && error.response.data && error.response.data.message)
        || 'Error al registrar el usuario. Intenta nuevamente.';

      dispatch({ type: AUTH_ACTIONS.AUTH_ERROR, payload: message });
      return { success: false, message };
    }
  }, [setAuthToken]);

  /**
   * Cerrar sesion
   */
  const logout = useCallback(() => {
    setAuthToken(null);
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  }, [setAuthToken]);

  /**
   * Obtener perfil actualizado del usuario
   */
  const getProfile = useCallback(async () => {
    try {
      const response = await api.get('/auth/profile');

      if (response.data && response.data.user) {
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.data.user });
        localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
        return response.data.user;
      }

      return null;
    } catch (error) {
      console.error('Error al obtener perfil:', error.message);
      return null;
    }
  }, []);

  /**
   * Limpiar errores de autenticacion
   */
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Valor del contexto memoizado
  const contextValue = useMemo(() => ({
    // Estado
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    isAuthenticated: state.isAuthenticated,

    // Acciones
    login,
    register,
    logout,
    getProfile,
    clearError,
  }), [state, login, register, logout, getProfile, clearError]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;