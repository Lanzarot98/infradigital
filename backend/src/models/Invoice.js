// ============================================================================
// Modelo de Factura
// InfraDigital - Facturación electrónica para negocios colombianos
// ============================================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Invoice = sequelize.define('invoices', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'Identificador único de la factura'
  },
  invoiceNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    field: 'invoice_number',
    comment: 'Número de factura único con formato FE-YYYY-NNNN'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID del usuario que creó la factura'
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'client_id',
    references: {
      model: 'clients',
      key: 'id'
    },
    comment: 'ID del cliente al que se le factura'
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Subtotal antes de impuestos en COP'
  },
  taxRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 19.00,
    field: 'tax_rate',
    comment: 'Tasa de IVA aplicada (por defecto 19% en Colombia)'
  },
  taxAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'tax_amount',
    comment: 'Monto del IVA calculado'
  },
  total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Total de la factura incluyendo impuestos en COP'
  },
  status: {
    type: DataTypes.ENUM('pendiente', 'pagada', 'anulada'),
    defaultValue: 'pendiente',
    allowNull: false,
    comment: 'Estado de la factura: pendiente, pagada o anulada'
  },
  paymentMethod: {
    type: DataTypes.ENUM('efectivo', 'tarjeta', 'transferencia'),
    defaultValue: 'efectivo',
    allowNull: true,
    field: 'payment_method',
    comment: 'Método de pago utilizado'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Observaciones o notas adicionales de la factura'
  },
  issueDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'issue_date',
    comment: 'Fecha de emisión de la factura'
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'due_date',
    comment: 'Fecha de vencimiento para el pago'
  }
});

module.exports = Invoice;
