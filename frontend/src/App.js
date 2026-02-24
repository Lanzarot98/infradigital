import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { AppProvider } from './context/AppContext';

// Layout
import Layout from './components/Layout/Layout';
import Loading from './components/common/Loading';

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
const AuditPage = React.lazy(() => import('./pages/Audit/AuditPage'));
const UsersPage = React.lazy(() => import('./pages/Users/UsersPage'));
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
    <Loading size="lg" />
  </div>
);

/**
 * Ruta protegida - usa AuthContext para verificar autenticacion
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  // Mientras carga la verificacion del token, mostrar loading
  if (loading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/**
 * Ruta publica - redirige si ya esta autenticado
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  // Mientras carga, mostrar loading (no redirigir prematuramente)
  if (loading) {
    return <LoadingFallback />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

/**
 * App - Componente principal de InfraDigital
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

              {/* Auditoría */}
              <Route path="/audit" element={<AuditPage />} />

              {/* Gestión de Usuarios */}
              <Route path="/users" element={<UsersPage />} />
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
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Página no encontrada</h2>
                  <p style={{ opacity: 0.8, marginBottom: '2rem', maxWidth: '400px' }}>
                    La página que buscas no existe o fue movida a otra ubicación.
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
