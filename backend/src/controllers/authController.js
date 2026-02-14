// ============================================================================
// Controlador de Autenticación
// InfraDigital - Registro, inicio de sesión y perfil de usuario
// ============================================================================

const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Genera un token JWT para el usuario proporcionado.
 * @param {Object} user - Instancia del modelo User
 * @returns {string} Token JWT firmado
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// ── Registro de nuevo usuario ────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Verificar si el correo ya está registrado
    const existingUser = await User.scope('withPassword').findOne({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Este correo electrónico ya está registrado.'
      });
    }

    // Crear el nuevo usuario
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user'
    });

    // Generar token JWT
    const token = generateToken(user);

    // Responder con el usuario creado (sin contraseña) y el token
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── Inicio de sesión ─────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario incluyendo la contraseña (scope especial)
    const user = await User.scope('withPassword').findOne({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas. Verifique su correo y contraseña.'
      });
    }

    // Verificar que el usuario esté activo
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Su cuenta ha sido desactivada. Contacte al administrador.'
      });
    }

    // Verificar la contraseña
    const isValidPassword = await user.validatePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas. Verifique su correo y contraseña.'
      });
    }

    // Generar token JWT
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── Obtener perfil del usuario autenticado ───────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    // req.user ya fue adjuntado por el middleware de autenticación
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// ── Actualizar perfil del usuario autenticado ────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    // Si cambia el email, verificar que no esté en uso
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Este correo electrónico ya está en uso por otro usuario.'
        });
      }
    }

    // Actualizar campos proporcionados
    await user.update({
      ...(name && { name }),
      ...(email && { email })
    });

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente.',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};
