import axios from 'axios';

/**
 * InfraDigital - Servicio API con Axios
 *
 * Configuracion centralizada para todas las llamadas al backend:
 * - Base URL configurable via variable de entorno
 * - Interceptores para autenticacion JWT
 * - Manejo global de errores (401 -> logout automatico)
 * - Servicios CRUD: auth, productos, clientes, facturas, dashboard
 */

// Instancia de axios con configuracion base
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// INTERCEPTOR DE PETICIONES
// Agrega el token JWT a cada peticion
// ============================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('infradigital_token');
    if (token) {
      config.headers.Authorization = 'Bearer ' + token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================
// INTERCEPTOR DE RESPUESTAS
// Manejo global de errores
// ============================================
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Error de red o timeout
    if (!error.response) {
      console.warn('InfraDigital API: Error de red o servidor no disponible');
      return Promise.reject({
        message: 'No se pudo conectar con el servidor. Verifica tu conexion a internet.',
        offline: true,
      });
    }

    const { status, data } = error.response;

    // 401 - No autorizado: token expirado o invalido
    if (status === 401) {
      console.warn('InfraDigital API: Sesion expirada o no autorizada');
      localStorage.removeItem('infradigital_token');
      localStorage.removeItem('infradigital_user');

      // Redirigir al login si no estamos ya ahi
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // 403 - Prohibido
    if (status === 403) {
      console.warn('InfraDigital API: Acceso prohibido');
    }

    // 500 - Error interno del servidor
    if (status >= 500) {
      console.error('InfraDigital API: Error del servidor', data);
    }

    return Promise.reject(error);
  }
);

// ============================================
// SERVICIO DE AUTENTICACION
// ============================================
export const authService = {
  /** Iniciar sesion */
  login: (credentials) =>
    api.post('/auth/login', credentials),

  /** Registrar nuevo usuario */
  register: (userData) =>
    api.post('/auth/register', userData),

  /** Obtener perfil del usuario autenticado */
  getProfile: () =>
    api.get('/auth/profile'),

  /** Actualizar perfil del usuario */
  updateProfile: (data) =>
    api.put('/auth/profile', data),
};

// ============================================
// SERVICIO DE PRODUCTOS / INVENTARIO
// Endpoints: GET/POST /products, GET/PUT/DELETE /products/:id
//            GET /products/low-stock, PATCH /products/:id/stock
// ============================================
export const productService = {
  /** Listar productos con filtros: { search, category, lowStock, page, limit } */
  getAll: (params = {}) =>
    api.get('/products', { params }),

  /** Obtener producto por ID (incluye movimientos de inventario) */
  getById: (id) =>
    api.get('/products/' + id),

  /** Crear producto */
  create: (data) =>
    api.post('/products', data),

  /** Actualizar producto */
  update: (id, data) =>
    api.put('/products/' + id, data),

  /** Eliminar producto (soft delete) */
  delete: (id) =>
    api.delete('/products/' + id),

  /** Obtener productos con stock bajo */
  getLowStock: () =>
    api.get('/products/low-stock'),

  /** Ajustar stock: { type: 'entrada'|'salida'|'ajuste', quantity, reason, reference } */
  adjustStock: (id, data) =>
    api.patch('/products/' + id + '/stock', data),
};

// ============================================
// SERVICIO DE CLIENTES / CRM
// Endpoints: GET/POST /clients, GET/PUT/DELETE /clients/:id
//            GET /clients/stats/top
// ============================================
export const clientService = {
  /** Listar clientes con filtros: { search, type, page, limit } */
  getAll: (params = {}) =>
    api.get('/clients', { params }),

  /** Obtener cliente por ID (incluye historial de compras) */
  getById: (id) =>
    api.get('/clients/' + id),

  /** Crear cliente */
  create: (data) =>
    api.post('/clients', data),

  /** Actualizar cliente */
  update: (id, data) =>
    api.put('/clients/' + id, data),

  /** Eliminar cliente (soft delete) */
  delete: (id) =>
    api.delete('/clients/' + id),

  /** Top clientes por compras */
  getTopClients: () =>
    api.get('/clients/stats/top'),
};

// ============================================
// SERVICIO DE FACTURAS / FACTURACION
// Endpoints: GET/POST /invoices, GET /invoices/:id
//            PATCH /invoices/:id/status
//            GET /invoices/client/:clientId
// ============================================
export const invoiceService = {
  /** Listar facturas con filtros: { search, status, clientId, startDate, endDate, page, limit } */
  getAll: (params = {}) =>
    api.get('/invoices', { params }),

  /** Obtener factura por ID (incluye items, cliente y usuario) */
  getById: (id) =>
    api.get('/invoices/' + id),

  /** Crear factura: { clientId, items: [{productId, quantity, unitPrice}], notes, paymentMethod } */
  create: (data) =>
    api.post('/invoices', data),

  /** Cambiar estado de factura: { status: 'pendiente'|'pagada'|'anulada' } */
  updateStatus: (id, status) =>
    api.patch('/invoices/' + id + '/status', { status }),

  /** Obtener facturas de un cliente */
  getByClient: (clientId, params = {}) =>
    api.get('/invoices/client/' + clientId, { params }),
};

// ============================================
// SERVICIO DE DASHBOARD / ANALITICAS
// Endpoints del backend:
//   GET /dashboard/summary
//   GET /dashboard/sales-chart
//   GET /dashboard/top-products
//   GET /dashboard/revenue-by-payment
//   GET /dashboard/inventory-alerts
//   GET /dashboard/sales-trend
// ============================================
export const dashboardService = {
  /** Resumen general: totalProducts, totalClients, totalInvoices, totalRevenue, pendingInvoices, lowStockCount */
  getSummary: () =>
    api.get('/dashboard/summary'),

  /** Ventas agrupadas por mes (ultimos 12 meses) */
  getSalesChart: () =>
    api.get('/dashboard/sales-chart'),

  /** Productos mas vendidos */
  getTopProducts: (params = {}) =>
    api.get('/dashboard/top-products', { params }),

  /** Ingresos por metodo de pago */
  getRevenueByPaymentMethod: () =>
    api.get('/dashboard/revenue-by-payment'),

  /** Alertas de inventario (productos con stock bajo) */
  getInventoryAlerts: () =>
    api.get('/dashboard/inventory-alerts'),

  /** Tendencia de ventas diarias (ultimos 30 dias) */
  getSalesTrend: () =>
    api.get('/dashboard/sales-trend'),
};

export default api;
