// ============================================================================
// Modelo de Producto
// InfraDigital - Gestión de inventario de productos
// ============================================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('products', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'Identificador único del producto'
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre del producto no puede estar vacío' },
      len: { args: [2, 200], msg: 'El nombre debe tener entre 2 y 200 caracteres' }
    },
    comment: 'Nombre del producto'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción detallada del producto'
  },
  sku: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: {
      msg: 'Este SKU ya está registrado para otro producto'
    },
    comment: 'Código SKU único del producto'
  },
  price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      isDecimal: { msg: 'El precio debe ser un número decimal válido' },
      min: { args: [0.01], msg: 'El precio debe ser mayor a 0' }
    },
    comment: 'Precio de venta del producto en COP'
  },
  cost: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    validate: {
      isDecimal: { msg: 'El costo debe ser un número decimal válido' },
      min: { args: [0], msg: 'El costo no puede ser negativo' }
    },
    comment: 'Costo de adquisición del producto en COP'
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      isInt: { msg: 'El stock debe ser un número entero' },
      min: { args: [0], msg: 'El stock no puede ser negativo' }
    },
    comment: 'Cantidad actual en inventario'
  },
  minStock: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    allowNull: false,
    field: 'min_stock',
    validate: {
      isInt: { msg: 'El stock mínimo debe ser un número entero' },
      min: { args: [0], msg: 'El stock mínimo no puede ser negativo' }
    },
    comment: 'Nivel mínimo de stock para alertas'
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Categoría del producto'
  },
  unit: {
    type: DataTypes.ENUM('unidad', 'kilogramo', 'litro', 'metro', 'caja'),
    defaultValue: 'unidad',
    allowNull: false,
    comment: 'Unidad de medida del producto'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
    comment: 'Indica si el producto está activo (false = eliminado lógicamente)'
  },
  // Campo virtual: indica si el producto tiene stock bajo
  isLowStock: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('stock') <= this.getDataValue('minStock');
    },
    comment: 'Campo virtual que indica si el stock está por debajo del mínimo'
  }
});

module.exports = Product;
