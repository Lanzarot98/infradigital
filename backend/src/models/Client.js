// ============================================================================
// Modelo de Cliente
// InfraDigital - Gestión de clientes del negocio
// ============================================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Client = sequelize.define('clients', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'Identificador único del cliente'
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre del cliente no puede estar vacío' },
      len: { args: [2, 200], msg: 'El nombre debe tener entre 2 y 200 caracteres' }
    },
    comment: 'Nombre completo o razón social del cliente'
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true,
    validate: {
      isEmail: { msg: 'Debe proporcionar un correo electrónico válido' }
    },
    comment: 'Correo electrónico de contacto del cliente'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Número de teléfono del cliente'
  },
  address: {
    type: DataTypes.STRING(300),
    allowNull: true,
    comment: 'Dirección física del cliente'
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Ciudad de residencia o ubicación del cliente'
  },
  nit_cc: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: {
      msg: 'Este NIT/CC ya está registrado para otro cliente'
    },
    comment: 'Número de identificación tributaria (NIT) o cédula de ciudadanía (CC)'
  },
  type: {
    type: DataTypes.ENUM('persona_natural', 'persona_juridica'),
    defaultValue: 'persona_natural',
    allowNull: false,
    comment: 'Tipo de persona: natural o jurídica'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas adicionales sobre el cliente'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
    comment: 'Indica si el cliente está activo (false = eliminado lógicamente)'
  }
});

module.exports = Client;
