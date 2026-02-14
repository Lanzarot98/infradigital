// ============================================================================
// Controlador de Productos
// InfraDigital - CRUD de productos y gestión de inventario
// ============================================================================

const { Op } = require('sequelize');
const { sequelize, Product, InventoryMovement, InvoiceItem } = require('../models');
const { paginationHelper } = require('../utils/helpers');

// ── Listar todos los productos con filtros ───────────────────────────────────
const getAll = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginationHelper(req.query);
    const { search, category, lowStock, isActive } = req.query;

    // Construir condiciones de búsqueda dinámicamente
    const where = {};

    // Filtro por estado activo (por defecto solo activos)
    where.isActive = isActive !== undefined ? isActive === 'true' : true;

    // Búsqueda por nombre o SKU
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filtro por categoría
    if (category) {
      where.category = { [Op.iLike]: `%${category}%` };
    }

    // Filtro por stock bajo
    if (lowStock === 'true') {
      where.stock = {
        [Op.lte]: sequelize.col('min_stock')
      };
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── Obtener un producto por ID con historial de movimientos ──────────────────
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        {
          model: InventoryMovement,
          as: 'movements',
          limit: 20,
          order: [['createdAt', 'DESC']],
          attributes: ['id', 'type', 'quantity', 'previousStock', 'newStock', 'reason', 'reference', 'createdAt']
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado.'
      });
    }

    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

// ── Crear un nuevo producto ──────────────────────────────────────────────────
const create = async (req, res, next) => {
  try {
    const { name, description, sku, price, cost, stock, minStock, category, unit } = req.body;

    // Crear el producto
    const product = await Product.create({
      name,
      description,
      sku,
      price,
      cost,
      stock: stock || 0,
      minStock: minStock || 5,
      category,
      unit: unit || 'unidad'
    });

    // Si se proporciona stock inicial, crear movimiento de inventario
    if (stock && stock > 0) {
      await InventoryMovement.create({
        productId: product.id,
        userId: req.user.id,
        type: 'entrada',
        quantity: stock,
        previousStock: 0,
        newStock: stock,
        reason: 'Stock inicial al crear el producto',
        reference: `INIT-${product.id.substring(0, 8)}`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente.',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

// ── Actualizar un producto existente ─────────────────────────────────────────
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado.'
      });
    }

    // Actualizar solo los campos proporcionados
    const allowedFields = ['name', 'description', 'sku', 'price', 'cost', 'minStock', 'category', 'unit', 'isActive'];
    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    await product.update(updateData);

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente.',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

// ── Eliminar producto (soft delete) ──────────────────────────────────────────
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado.'
      });
    }

    // Eliminación lógica: marcar como inactivo
    await product.update({ isActive: false });

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente.'
    });
  } catch (error) {
    next(error);
  }
};

// ── Ajustar stock de un producto ─────────────────────────────────────────────
const adjustStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, quantity, reason, reference } = req.body;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado.'
      });
    }

    // Validar tipo de movimiento
    if (!['entrada', 'salida', 'ajuste'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'El tipo de movimiento debe ser: entrada, salida o ajuste.'
      });
    }

    // Validar cantidad
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad debe ser un número positivo.'
      });
    }

    const previousStock = product.stock;
    let newStock;

    // Calcular nuevo stock según el tipo de movimiento
    switch (type) {
      case 'entrada':
        newStock = previousStock + quantity;
        break;
      case 'salida':
        if (previousStock < quantity) {
          return res.status(400).json({
            success: false,
            message: `Stock insuficiente. Stock actual: ${previousStock}, cantidad solicitada: ${quantity}.`
          });
        }
        newStock = previousStock - quantity;
        break;
      case 'ajuste':
        newStock = quantity; // En ajuste, la cantidad es el nuevo stock
        break;
      default:
        newStock = previousStock;
    }

    // Crear movimiento de inventario
    const movement = await InventoryMovement.create({
      productId: product.id,
      userId: req.user.id,
      type,
      quantity,
      previousStock,
      newStock,
      reason: reason || `Movimiento de ${type}`,
      reference
    });

    // Actualizar el stock del producto
    await product.update({ stock: newStock });

    res.json({
      success: true,
      message: `Stock actualizado exitosamente. Nuevo stock: ${newStock}.`,
      data: {
        product: await Product.findByPk(id),
        movement
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── Obtener productos con stock bajo ─────────────────────────────────────────
const getLowStock = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      where: {
        isActive: true,
        stock: {
          [Op.lte]: sequelize.col('min_stock')
        }
      },
      order: [['stock', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        count: products.length,
        products
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  adjustStock,
  getLowStock
};
