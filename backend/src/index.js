// ============================================================================
// Servidor Principal - InfraDigital Backend
// Sistema de gestión de procesos empresariales para pequeñas empresas colombianas
// ============================================================================

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

// Configuraciones
const swaggerSpec = require('./config/swagger');
const { sequelize } = require('./models');

// Rutas
const routes = require('./routes');

// Middleware de errores
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// ── Crear aplicación Express ─────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ══════════════════════════════════════════════════════════════════════════════
// MIDDLEWARES GLOBALES
// ══════════════════════════════════════════════════════════════════════════════

// Seguridad HTTP con Helmet (protección de headers)
app.use(helmet());

// Compresión GZIP para reducir el tamaño de las respuestas
app.use(compression());

// Registro de solicitudes HTTP en consola (log)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Habilitar CORS (Cross-Origin Resource Sharing)
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
const allowedOrigins = corsOrigin.split(',').map(o => o.trim());

app.use(cors({
  origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Parsear JSON en el cuerpo de las solicitudes (límite de 10MB)
app.use(express.json({ limit: '10mb' }));

// Parsear datos de formularios URL-encoded
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Limitación de tasa de solicitudes (rate limiting)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Ventana de 15 minutos
  max: 1000,                 // Máximo 1000 solicitudes por ventana (amplio para desarrollo)
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP. Intente nuevamente en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// ══════════════════════════════════════════════════════════════════════════════
// DOCUMENTACIÓN SWAGGER
// ══════════════════════════════════════════════════════════════════════════════

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'InfraDigital API - Documentación'
}));

// ══════════════════════════════════════════════════════════════════════════════
// RUTAS DE LA API
// ══════════════════════════════════════════════════════════════════════════════

// Health check para Render y monitoreo
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Ruta raíz - Información de la API
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenido a InfraDigital API',
    version: '1.0.0',
    description: 'Sistema de gestión empresarial para pequeñas empresas colombianas',
    documentation: `http://localhost:${PORT}/api-docs`,
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      clients: '/api/clients',
      invoices: '/api/invoices',
      dashboard: '/api/dashboard'
    }
  });
});

// Montar todas las rutas de la API bajo /api
app.use('/api', routes);

// ══════════════════════════════════════════════════════════════════════════════
// MANEJO DE ERRORES
// ══════════════════════════════════════════════════════════════════════════════

// Ruta no encontrada (404)
app.use(notFoundHandler);

// Middleware centralizado de errores
app.use(errorHandler);

// ══════════════════════════════════════════════════════════════════════════════
// INICIALIZACIÓN DEL SERVIDOR
// ══════════════════════════════════════════════════════════════════════════════

const startServer = async () => {
  try {
    // Verificar conexión a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida exitosamente.');

    // Sincronizar modelos con la base de datos
    // force: false solo crea tablas faltantes sin modificar las existentes
    await sequelize.sync({ force: false });
    console.log('✅ Modelos sincronizados con la base de datos.');

    // Iniciar el servidor HTTP
    app.listen(PORT, () => {
      console.log('═══════════════════════════════════════════════════');
      console.log(`🚀 InfraDigital API ejecutándose en puerto ${PORT}`);
      console.log(`📚 Documentación: http://localhost:${PORT}/api-docs`);
      console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log('═══════════════════════════════════════════════════');
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error.message);
    process.exit(1);
  }
};

// Iniciar servidor
startServer();

// Exportar app para pruebas
module.exports = app;
