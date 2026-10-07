import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import styles from './Login.module.css';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await login(usuario, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    } else {
      navigate('/');
    }
  };

  return (
    <div className={styles['login-body']}>
      <div className={styles['login-container']}>
        <h1 className={styles['login-title']}>Ingresar</h1>
        <form onSubmit={handleSubmit} className={styles['login-form']}>
          {error && <div style={{ color: 'var(--color-danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
          <div className={styles['input-group']}>
            <label htmlFor="login-usuario">Usuario</label>
            <input
              type="text"
              id="login-usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Ingresá tu usuario"
              autoComplete="new-email"
              required
            />
          </div>
          <div className={styles['input-group']}>
            <label htmlFor="login-password">Contraseña</label>
            <input
              type="password"
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresá tu contraseña"
              autoComplete="new-password"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="app-btn-primary app-btn-guardar-login">
            {loading ? 'Conectando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
