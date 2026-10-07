import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from '../shared/auth/AuthContext';
import Login from '../shared/auth/Login';

// Placeholder for Layout
function Layout({ children }) {
  const { session, logout } = useAuth();
  
  return (
    <div className="layout-wrapper" style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {/* Sidebar Placeholder */}
      <aside style={{ width: '250px', background: 'var(--color-bg-dark)', color: 'white', padding: '1rem' }}>
        <h2>KiERO</h2>
        <p>Usuario: {session?.usuario}</p>
        <button onClick={logout} className="app-btn-danger">Cerrar Sesión</button>
      </aside>
      
      {/* Main Content Placeholder */}
      <main style={{ flex: 1, padding: '2rem', background: 'var(--color-bg)' }}>
        {children}
      </main>
    </div>
  );
}

function PrivateRoute({ children }) {
  const { session } = useAuth();
  return session ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><h1>Dashboard (En construcción)</h1></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
