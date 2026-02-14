// ============================================================================
// Modelo de Usuario
// InfraDigital - Gestión de usuarios del sistema
// ============================================================================

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('users', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'Identificador único del usuario'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre no puede estar vacío' },
      len: { args: [2, 100], msg: 'El nombre debe tener entre 2 y 100 caracteres' }
    },
    comment: 'Nombre completo del usuario'
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: {
      msg: 'Este correo electrónico ya está registrado'
    },
    validate: {
      isEmail: { msg: 'Debe proporcionar un correo electrónico válido' },
      notEmpty: { msg: 'El correo electrónico no puede estar vacío' }
    },
    comment: 'Correo electrónico único del usuario'
  },
  password: {
    type: DataTypes.STRING(128),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'La contraseña no puede estar vacía' },
      len: { args: [6, 128], msg: 'La contraseña debe tener al menos 6 caracteres' }
    },
    comment: 'Contraseña encriptada con bcrypt'
  },
  role: {
    type: DataTypes.ENUM('admin', 'user'),
    defaultValue: 'user',
    allowNull: false,
    comment: 'Rol del usuario: admin o user'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
    comment: 'Indica si el usuario está activo en el sistema'
  }
}, {
  // Hooks para encriptar la contraseña automáticamente
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  },
  // No devolver la contraseña por defecto en queries
  defaultScope: {
    attributes: { exclude: ['password'] }
  },
  scopes: {
    // Scope para incluir la contraseña (usado en login)
    withPassword: {
      attributes: { include: ['password'] }
    }
  }
});

/**
 * Método de instancia para validar la contraseña proporcionada
 * contra la contraseña encriptada almacenada.
 *
 * @param {string} password - Contraseña en texto plano a verificar
 * @returns {Promise<boolean>} true si la contraseña es correcta
 */
User.prototype.validatePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = User;
