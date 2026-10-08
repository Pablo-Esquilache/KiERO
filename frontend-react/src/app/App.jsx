import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth, AuthProvider } from '../shared/auth/AuthContext';
import Login from '../shared/auth/Login';
import Productos from '../features/productos/Productos';
import Clientes from '../features/clientes/Clientes';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Sidebar() {
  const { session, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Inicio', icon: '🏠' },
    { path: '/productos', label: 'Productos', icon: '📦' },
    { path: '/clientes', label: 'Clientes', icon: '👥' },
  ];

  return (
    <aside style={{ 
      width: '250px', 
      background: '#151515', 
      color: 'white', 
      display: 'flex', 
      flexDirection: 'column',
      borderRight: '1px solid #333'
    }}>
      <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ color: '#e07a5f', margin: 0, fontSize: '2rem', letterSpacing: '2px' }}>KiERO</h2>
        <span style={{ fontSize: '0.8rem', color: '#888' }}>{session?.comercio_nombre}</span>
      </div>
      
      <nav style={{ flex: 1, padding: '0 1rem' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {menuItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link 
                  to={item.path} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.75rem 1rem',
                    color: isActive ? '#fff' : '#888',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    background: isActive ? '#222' : 'transparent',
                    fontWeight: isActive ? '600' : 'normal',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div style={{ padding: '1.5rem', borderTop: '1px solid #333' }}>
        <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ fontSize: '0.9rem', color: '#fff' }}>{session?.usuario}</span>
          <span style={{ fontSize: '0.75rem', color: '#888' }}>{session?.rol}</span>
        </div>
        <button 
          onClick={logout} 
          className="app-btn-danger" 
          style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem' }}
        >
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}

function Layout({ children }) {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '2rem', background: '#f8fafc', overflowY: 'auto' }}>
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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Private Routes */}
            <Route path="/" element={<PrivateRoute>
              <div className="card">
                <h2 className="section-title">Dashboard (Próximamente)</h2>
                <p>Seleccioná un módulo del menú izquierdo para probar React Query.</p>
              </div>
            </PrivateRoute>} />
            
            <Route path="/productos" element={<PrivateRoute><Productos /></PrivateRoute>} />
            <Route path="/clientes" element={<PrivateRoute><Clientes /></PrivateRoute>} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
