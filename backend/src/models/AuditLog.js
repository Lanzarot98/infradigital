// ============================================================================
// Modelo de Auditoría
// InfraDigital - Registro de todas las acciones realizadas en el sistema
// ============================================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('audit_logs', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'Identificador único del registro de auditoría'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID del usuario que realizó la acción'
  },
  action: {
    type: DataTypes.ENUM(
      'crear',
      'actualizar',
      'eliminar',
      'ajustar_stock',
      'cambiar_estado',
      'iniciar_sesion',
      'cerrar_sesion'
    ),
    allowNull: false,
    comment: 'Tipo de acción realizada'
  },
  tableName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'table_name',
    comment: 'Tabla afectada por la acción'
  },
  recordId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'record_id',
    comment: 'ID del registro afectado'
  },
  previousValues: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'previous_values',
    comment: 'Estado anterior del registro'
  },
  newValues: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'new_values',
    comment: 'Estado nuevo del registro'
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Descripción legible de la acción realizada'
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    field: 'ip_address',
    comment: 'Dirección IP desde donde se realizó la acción'
  },
  userAgent: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'user_agent',
    comment: 'User-Agent del navegador'
  }
}, {
  timestamps: true,
  updatedAt: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['action'] },
    { fields: ['table_name'] },
    { fields: ['created_at'] }
  ]
});

module.exports = AuditLog;
