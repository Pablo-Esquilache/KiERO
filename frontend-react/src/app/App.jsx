import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth, AuthProvider } from '../shared/auth/AuthContext';
import Login from '../shared/auth/Login';
import Productos from '../features/productos/Productos';
import Clientes from '../features/clientes/Clientes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Navbar() {
  const { session, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { path: '/caja', label: 'Caja', id: 'tab-caja' },
    { path: '/ventas', label: 'Ventas', id: 'tab-ventas' },
    { path: '/productos', label: 'Productos', id: 'tab-productos' },
    { path: '/clientes', label: 'Clientes', id: 'tab-clientes' },
    { path: '/gastos', label: 'Gastos', id: 'tab-gastos' },
    { path: '/reportes', label: 'Reportes', id: 'tab-reportes' },
    { path: '/turnos', label: 'Turnos', id: 'tab-turnero' },
    { path: '/ajustes', label: 'Ajustes', id: 'tab-ajustes' }
  ];

  // Filtramos ajustes si no es admin (asumiendo que en el viejo sistema se ocultaba)
  // o lo dejamos y adentro verificamos. Lo dejamos por ahora.
  const filteredMenu = menuItems.filter(item => 
    item.path !== '/ajustes' || session?.rol === 'admin'
  );

  return (
    <nav className="app-navbar">
      <div className="app-navbar-logo">
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
          KiERO
        </Link>
      </div>

      <ul className="app-navbar-menu">
        {filteredMenu.map(item => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <li key={item.id} id={item.id}>
              <Link to={item.path} className={isActive ? 'app-active' : ''}>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="app-navbar-user">
        <span id="nav-user-name">Usuario: {session?.usuario}</span>
        <button id="btn-logout" className="app-btn-danger" onClick={logout}>Salir</button>
      </div>
    </nav>
  );
}

function Layout({ children }) {
  return (
    <div>
      <Navbar />
      <div style={{ padding: '20px' }}>
        {children}
      </div>
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
            
            <Route path="/" element={<Navigate to="/productos" />} />
            
            <Route path="/caja" element={<PrivateRoute><h2>Caja (Próximamente)</h2></PrivateRoute>} />
            <Route path="/ventas" element={<PrivateRoute><h2>Ventas (Próximamente)</h2></PrivateRoute>} />
            <Route path="/productos" element={<PrivateRoute><Productos /></PrivateRoute>} />
            <Route path="/clientes" element={<PrivateRoute><Clientes /></PrivateRoute>} />
            <Route path="/gastos" element={<PrivateRoute><h2>Gastos (Próximamente)</h2></PrivateRoute>} />
            <Route path="/reportes" element={<PrivateRoute><h2>Reportes (Próximamente)</h2></PrivateRoute>} />
            <Route path="/turnos" element={<PrivateRoute><h2>Turnos (Próximamente)</h2></PrivateRoute>} />
            <Route path="/ajustes" element={<PrivateRoute><h2>Ajustes (Próximamente)</h2></PrivateRoute>} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
