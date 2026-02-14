// ============================================================================
// Modelo de Movimiento de Inventario
// InfraDigital - Registro de entradas, salidas y ajustes de inventario
// ============================================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryMovement = sequelize.define('inventory_movements', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'Identificador único del movimiento de inventario'
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'product_id',
    references: {
      model: 'products',
      key: 'id'
    },
    comment: 'ID del producto afectado por el movimiento'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID del usuario que realizó el movimiento'
  },
  type: {
    type: DataTypes.ENUM('entrada', 'salida', 'ajuste'),
    allowNull: false,
    comment: 'Tipo de movimiento: entrada (compra/reposición), salida (venta), ajuste (corrección)'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: { msg: 'La cantidad debe ser un número entero' }
    },
    comment: 'Cantidad de unidades del movimiento'
  },
  previousStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'previous_stock',
    comment: 'Stock antes del movimiento'
  },
  newStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'new_stock',
    comment: 'Stock después del movimiento'
  },
  reason: {
    type: DataTypes.STRING(300),
    allowNull: true,
    comment: 'Razón o motivo del movimiento de inventario'
  },
  reference: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Referencia externa (ej: número de factura, orden de compra)'
  }
});

module.exports = InventoryMovement;
