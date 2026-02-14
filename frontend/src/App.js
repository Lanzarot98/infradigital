import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';

// Layout
import Layout from './components/Layout/Layout';

// Importacion lazy de paginas para code-splitting
const Dashboard = React.lazy(() => import('./pages/Dashboard/DashboardPage'));
const InventoryList = React.lazy(() => import('./pages/Inventory/InventoryList'));
const InventoryForm = React.lazy(() => import('./pages/Inventory/ProductForm'));
const InvoiceList = React.lazy(() => import('./pages/Invoices/InvoiceList'));
const InvoiceForm = React.lazy(() => import('./pages/Invoices/InvoiceCreate'));
const InvoiceDetail = React.lazy(() => import('./pages/Invoices/InvoiceDetail'));
const ClientList = React.lazy(() => import('./pages/Clients/ClientList'));
const ClientForm = React.lazy(() => import('./pages/Clients/ClientForm'));
const ClientDetail = React.lazy(() => import('./pages/Clients/ClientDetail'));
const Login = React.lazy(() => import('./pages/Auth/Login'));
const Register = React.lazy(() => import('./pages/Auth/Register'));

/**
 * Componente de carga para Suspense
 */
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '1rem',
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid #e2e8f0',
      borderTopColor: '#1e40af',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Cargando...</p>
  </div>
);

/**
 * Componente de ruta protegida
 * Redirige a /login si el usuario no esta autenticado
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('infradigital_token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/**
 * Componente de ruta publica
 * Redirige a /dashboard si el usuario ya esta autenticado
 */
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('infradigital_token');

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

/**
 * App - Componente principal de InfraDigital
 * 
 * Estructura de rutas:
 * - Rutas publicas: /login, /register
 * - Rutas protegidas: todas las demas, envueltas en Layout
 * - Redireccion de / a /dashboard
 */
function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <React.Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* --- Rutas publicas --- */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* --- Rutas protegidas con Layout --- */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard */}
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Inventario */}
              <Route path="/inventory" element={<InventoryList />} />
              <Route path="/inventory/new" element={<InventoryForm />} />
              <Route path="/inventory/edit/:id" element={<InventoryForm />} />

              {/* Facturacion */}
              <Route path="/invoices" element={<InvoiceList />} />
              <Route path="/invoices/new" element={<InvoiceForm />} />
              <Route path="/invoices/:id" element={<InvoiceDetail />} />

              {/* Clientes / CRM */}
              <Route path="/clients" element={<ClientList />} />
              <Route path="/clients/new" element={<ClientForm />} />
              <Route path="/clients/edit/:id" element={<ClientForm />} />
              <Route path="/clients/:id" element={<ClientDetail />} />
            </Route>

            {/* --- Redireccion raiz --- */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* --- Ruta 404 --- */}
            <Route
              path="*"
              element={
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '100vh',
                  background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                  color: '#ffffff',
                  textAlign: 'center',
                  padding: '2rem',
                }}>
                  <h1 style={{ fontSize: '6rem', fontWeight: 800, marginBottom: '0.5rem', opacity: 0.3 }}>404</h1>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Pagina no encontrada</h2>
                  <p style={{ opacity: 0.8, marginBottom: '2rem', maxWidth: '400px' }}>
                    La pagina que buscas no existe o fue movida a otra ubicacion.
                  </p>
                  <a
                    href="/dashboard"
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      color: '#ffffff',
                      border: '2px solid rgba(255,255,255,0.4)',
                      padding: '0.75rem 2rem',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                    }}
                  >
                    Volver al inicio
                  </a>
                </div>
              }
            />
          </Routes>
        </React.Suspense>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;