// ============================================================================
// Middleware de Autenticación y Autorización
// InfraDigital - Verificación de JWT y control de roles
// ============================================================================

const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Middleware de autenticación - Verifica el token JWT
 * Extrae el token del header Authorization, lo verifica y adjunta
 * la información del usuario al objeto request.
 */
const authenticate = async (req, res, next) => {
  try {
    // Obtener el header de autorización
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. No se proporcionó token de autenticación.'
      });
    }

    // Extraer el token (remover "Bearer ")
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Token no válido.'
      });
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar el usuario en la base de datos
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token no válido. Usuario no encontrado.'
      });
    }

    // Verificar que el usuario esté activo
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Cuenta de usuario desactivada. Contacte al administrador.'
      });
    }

    // Adjuntar usuario al request para uso en controladores
    req.user = user;
    next();
  } catch (error) {
    // Manejar errores específicos de JWT
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token no válido.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado. Inicie sesión nuevamente.'
      });
    }

    next(error);
  }
};

/**
 * Middleware de autorización por roles
 * Verifica que el usuario autenticado tenga el rol requerido.
 * Debe usarse DESPUÉS del middleware authenticate.
 *
 * @param  {...string} roles - Roles permitidos (ej: 'admin', 'user')
 * @returns {Function} Middleware de Express
 *
 * Ejemplo de uso:
 *   router.get('/admin', authenticate, authorize('admin'), controller)
 *   router.get('/both', authenticate, authorize('admin', 'user'), controller)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Verificar que el middleware authenticate se ejecutó primero
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Debe autenticarse primero.'
      });
    }

    // Verificar si el rol del usuario está en la lista de roles permitidos
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}.`
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
