// ============================================================================
// Modelo de Ítem de Factura
// InfraDigital - Detalle de productos en cada factura
// ============================================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InvoiceItem = sequelize.define('invoice_items', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'Identificador único del ítem de factura'
  },
  invoiceId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'invoice_id',
    references: {
      model: 'invoices',
      key: 'id'
    },
    comment: 'ID de la factura a la que pertenece este ítem'
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'product_id',
    references: {
      model: 'products',
      key: 'id'
    },
    comment: 'ID del producto facturado'
  },
  productName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'product_name',
    comment: 'Nombre del producto al momento de la facturación (snapshot)'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: { msg: 'La cantidad debe ser un número entero' },
      min: { args: [1], msg: 'La cantidad debe ser al menos 1' }
    },
    comment: 'Cantidad de unidades facturadas'
  },
  unitPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'unit_price',
    validate: {
      isDecimal: { msg: 'El precio unitario debe ser un número decimal válido' },
      min: { args: [0], msg: 'El precio unitario no puede ser negativo' }
    },
    comment: 'Precio unitario al momento de la facturación en COP'
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      isDecimal: { msg: 'El subtotal debe ser un número decimal válido' }
    },
    comment: 'Subtotal del ítem (cantidad × precio unitario) en COP'
  }
});

module.exports = InvoiceItem;
