const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Permission = sequelize.define('permissions', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'Identificador único del permiso'
  },
  role: {
    type: DataTypes.ENUM('admin', 'user'),
    allowNull: false,
    comment: 'Rol al que aplica este permiso'
  },
  module: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Módulo del sistema: dashboard, inventory, invoices, clients, audit, users'
  },
  canView: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'can_view',
    comment: 'Permiso para visualizar el módulo'
  },
  canCreate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'can_create',
    comment: 'Permiso para crear registros'
  },
  canEdit: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'can_edit',
    comment: 'Permiso para editar registros'
  },
  canDelete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'can_delete',
    comment: 'Permiso para eliminar registros'
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['role', 'module'],
      name: 'unique_role_module'
    }
  ]
});

module.exports = Permission;
