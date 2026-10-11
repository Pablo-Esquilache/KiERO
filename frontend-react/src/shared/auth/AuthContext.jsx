import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../api/client';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('session');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const handleUnauthorized = () => {
      setSession(null);
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, []);

  const login = async (usuario, password) => {
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: { usuario, password }
      });
      const newSession = {
        token: data.token,
        session_token: data.session_token,
        usuario: usuario,
        rol: data.role || data.rol,
        comercio_id: data.comercio_id,
        comercio_nombre: data.comercio_nombre
      };
      localStorage.setItem('session', JSON.stringify(newSession));
      setSession(newSession);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      if (session?.session_token) {
        await apiFetch('/auth/logout', {
          method: 'POST',
          body: { session_token: session.session_token }
        });
      }
    } catch (e) {
      console.error("Error al cerrar sesión en el servidor:", e);
    }
    localStorage.removeItem('session');
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
