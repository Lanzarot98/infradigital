// ============================================================================
// Middleware de Manejo Centralizado de Errores
// InfraDigital - Captura y formatea todos los errores de la aplicación
// ============================================================================

/**
 * Middleware centralizado para manejo de errores.
 * Captura errores de Sequelize, JWT, Zod y errores generales,
 * retornando respuestas JSON consistentes.
 */
const errorHandler = (err, req, res, next) => {
  // Log del error en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  }

  // Respuesta base de error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';
  let errors = [];

  // ── Errores de validación de Sequelize ──────────────────────────────
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Error de validación en los datos proporcionados';
    errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
  }

  // ── Errores de restricción única de Sequelize ───────────────────────
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Ya existe un registro con los datos proporcionados';
    errors = err.errors.map((e) => ({
      field: e.path,
      message: `El valor '${e.value}' ya está registrado para el campo '${e.path}'`
    }));
  }

  // ── Errores de clave foránea de Sequelize ───────────────────────────
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Error de referencia: el registro asociado no existe';
    errors = [{
      field: err.fields ? err.fields[0] : 'unknown',
      message: 'La referencia proporcionada no es válida'
    }];
  }

  // ── Errores de conexión a base de datos ─────────────────────────────
  if (err.name === 'SequelizeConnectionError' || err.name === 'SequelizeConnectionRefusedError') {
    statusCode = 503;
    message = 'Error de conexión con la base de datos. Intente más tarde.';
    errors = [];
  }

  // ── Errores de JWT ──────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token de autenticación no válido';
    errors = [];
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token de autenticación expirado. Inicie sesión nuevamente.';
    errors = [];
  }

  // ── Errores de validación Zod ───────────────────────────────────────
  if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Error de validación en los datos enviados';
    errors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code
    }));
  }

  // ── Errores de sintaxis JSON (body mal formado) ─────────────────────
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'El cuerpo de la solicitud no es un JSON válido';
    errors = [];
  }

  // ── Construir respuesta de error consistente ────────────────────────
  const response = {
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      originalError: err.name
    })
  };

  res.status(statusCode).json(response);
};

/**
 * Middleware para manejar rutas no encontradas (404)
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
};

module.exports = { errorHandler, notFoundHandler };
