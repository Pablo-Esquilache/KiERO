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
        usuario: data.usuario,
        rol: data.rol,
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
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignorar error al hacer logout
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
