// ============================================================================
// Índice de Modelos - Inicialización y Asociaciones
// InfraDigital - Centraliza la carga de todos los modelos y sus relaciones
// ============================================================================

const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const Client = require('./Client');
const Invoice = require('./Invoice');
const InvoiceItem = require('./InvoiceItem');
const InventoryMovement = require('./InventoryMovement');

// ══════════════════════════════════════════════════════════════════════════════
// DEFINICIÓN DE ASOCIACIONES (RELACIONES ENTRE MODELOS)
// ══════════════════════════════════════════════════════════════════════════════

// ── Usuario → Facturas ───────────────────────────────────────────────────────
// Un usuario puede crear muchas facturas
User.hasMany(Invoice, {
  foreignKey: 'userId',
  as: 'invoices'
});
Invoice.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// ── Cliente → Facturas ───────────────────────────────────────────────────────
// Un cliente puede tener muchas facturas
Client.hasMany(Invoice, {
  foreignKey: 'clientId',
  as: 'invoices'
});
Invoice.belongsTo(Client, {
  foreignKey: 'clientId',
  as: 'client'
});

// ── Factura → Ítems de Factura ───────────────────────────────────────────────
// Una factura tiene muchos ítems
Invoice.hasMany(InvoiceItem, {
  foreignKey: 'invoiceId',
  as: 'items',
  onDelete: 'CASCADE'
});
InvoiceItem.belongsTo(Invoice, {
  foreignKey: 'invoiceId',
  as: 'invoice'
});

// ── Producto → Ítems de Factura ──────────────────────────────────────────────
// Un producto puede aparecer en muchos ítems de factura
Product.hasMany(InvoiceItem, {
  foreignKey: 'productId',
  as: 'invoiceItems'
});
InvoiceItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product'
});

// ── Producto → Movimientos de Inventario ─────────────────────────────────────
// Un producto tiene muchos movimientos de inventario
Product.hasMany(InventoryMovement, {
  foreignKey: 'productId',
  as: 'movements',
  onDelete: 'CASCADE'
});
InventoryMovement.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product'
});

// ── Usuario → Movimientos de Inventario ──────────────────────────────────────
// Un usuario puede realizar muchos movimientos de inventario
User.hasMany(InventoryMovement, {
  foreignKey: 'userId',
  as: 'inventoryMovements'
});
InventoryMovement.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// ══════════════════════════════════════════════════════════════════════════════
// EXPORTAR MODELOS E INSTANCIA DE SEQUELIZE
// ══════════════════════════════════════════════════════════════════════════════

module.exports = {
  sequelize,
  User,
  Product,
  Client,
  Invoice,
  InvoiceItem,
  InventoryMovement
};
