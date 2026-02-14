// ============================================================================
// Controlador de Facturas
// InfraDigital - Facturación con cálculo automático de IVA (19% Colombia)
// ============================================================================

const { Op } = require('sequelize');
const { sequelize, Invoice, InvoiceItem, Product, Client, User, InventoryMovement } = require('../models');
const { paginationHelper, generateInvoiceNumber, calculateIVA } = require('../utils/helpers');

// ── Listar todas las facturas con filtros ────────────────────────────────────
const getAll = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginationHelper(req.query);
    const { status, clientId, startDate, endDate, search } = req.query;

    // Construir condiciones de búsqueda
    const where = {};

    // Filtro por estado
    if (status) {
      where.status = status;
    }

    // Filtro por cliente
    if (clientId) {
      where.clientId = clientId;
    }

    // Filtro por rango de fechas
    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) {
        where.issueDate[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.issueDate[Op.lte] = new Date(endDate);
      }
    }

    // Búsqueda por número de factura
    if (search) {
      where.invoiceNumber = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows: invoices } = await Invoice.findAndCountAll({
      where,
      limit,
      offset,
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'nit_cc', 'email']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        invoices,
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

// ── Obtener una factura por ID con todos sus ítems ───────────────────────────
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findByPk(id, {
      include: [
        {
          model: Client,
          as: 'client'
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: InvoiceItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku', 'price', 'stock']
            }
          ]
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada.'
      });
    }

    res.json({
      success: true,
      data: { invoice }
    });
  } catch (error) {
    next(error);
  }
};

// ── Crear una nueva factura con ítems ────────────────────────────────────────
const create = async (req, res, next) => {
  // Usar transacción para garantizar consistencia de datos
  const transaction = await sequelize.transaction();

  try {
    const { clientId, items, notes, paymentMethod, dueDate } = req.body;

    // Verificar que el cliente existe y está activo
    const client = await Client.findByPk(clientId, { transaction });
    if (!client || !client.isActive) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado o está inactivo.'
      });
    }

    // Generar número de factura secuencial
    const invoiceNumber = await generateInvoiceNumber(transaction);

    // Calcular subtotal procesando cada ítem
    let subtotal = 0;
    const invoiceItems = [];

    for (const item of items) {
      // Verificar que el producto existe y está activo
      const product = await Product.findByPk(item.productId, { transaction });

      if (!product || !product.isActive) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: `Producto no encontrado o inactivo: ${item.productId}`
        });
      }

      // Verificar stock disponible
      if (product.stock < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, solicitado: ${item.quantity}.`
        });
      }

      // Calcular subtotal del ítem
      const itemSubtotal = parseFloat((item.quantity * item.unitPrice).toFixed(2));
      subtotal += itemSubtotal;

      // Preparar ítem de factura con snapshot del nombre del producto
      invoiceItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: itemSubtotal
      });

      // Descontar stock del producto
      const previousStock = product.stock;
      const newStock = previousStock - item.quantity;
      await product.update({ stock: newStock }, { transaction });

      // Crear movimiento de inventario (salida por venta)
      await InventoryMovement.create({
        productId: product.id,
        userId: req.user.id,
        type: 'salida',
        quantity: item.quantity,
        previousStock,
        newStock,
        reason: 'Venta - Facturación',
        reference: invoiceNumber
      }, { transaction });
    }

    // Calcular IVA y total
    const { taxAmount, total } = calculateIVA(subtotal);

    // Crear la factura
    const invoice = await Invoice.create({
      invoiceNumber,
      userId: req.user.id,
      clientId,
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxRate: 19.00,
      taxAmount,
      total,
      status: 'pendiente',
      paymentMethod: paymentMethod || 'efectivo',
      notes,
      issueDate: new Date(),
      dueDate: dueDate ? new Date(dueDate) : null
    }, { transaction });

    // Crear los ítems de la factura
    for (const item of invoiceItems) {
      await InvoiceItem.create({
        invoiceId: invoice.id,
        ...item
      }, { transaction });
    }

    // Confirmar transacción
    await transaction.commit();

    // Obtener la factura completa con todas las relaciones
    const fullInvoice = await Invoice.findByPk(invoice.id, {
      include: [
        { model: Client, as: 'client' },
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        {
          model: InvoiceItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: `Factura ${invoiceNumber} creada exitosamente.`,
      data: { invoice: fullInvoice }
    });
  } catch (error) {
    // Revertir transacción en caso de error
    await transaction.rollback();
    next(error);
  }
};

// ── Actualizar estado de una factura ─────────────────────────────────────────
const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validar estado
    if (!['pendiente', 'pagada', 'anulada'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido. Debe ser: pendiente, pagada o anulada.'
      });
    }

    const invoice = await Invoice.findByPk(id, {
      include: [
        { model: InvoiceItem, as: 'items' }
      ]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada.'
      });
    }

    // Si se anula la factura, devolver el stock de los productos
    if (status === 'anulada' && invoice.status !== 'anulada') {
      const transaction = await sequelize.transaction();
      try {
        for (const item of invoice.items) {
          const product = await Product.findByPk(item.productId, { transaction });
          if (product) {
            const previousStock = product.stock;
            const newStock = previousStock + item.quantity;
            await product.update({ stock: newStock }, { transaction });

            // Registrar movimiento de inventario (entrada por anulación)
            await InventoryMovement.create({
              productId: product.id,
              userId: req.user.id,
              type: 'entrada',
              quantity: item.quantity,
              previousStock,
              newStock,
              reason: 'Devolución por anulación de factura',
              reference: invoice.invoiceNumber
            }, { transaction });
          }
        }

        await invoice.update({ status }, { transaction });
        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } else {
      await invoice.update({ status });
    }

    // Obtener factura actualizada
    const updatedInvoice = await Invoice.findByPk(id, {
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'nit_cc'] },
        { model: User, as: 'user', attributes: ['id', 'name'] }
      ]
    });

    res.json({
      success: true,
      message: `Estado de factura actualizado a "${status}".`,
      data: { invoice: updatedInvoice }
    });
  } catch (error) {
    next(error);
  }
};

// ── Obtener facturas de un cliente específico ────────────────────────────────
const getByClient = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { page, limit, offset } = paginationHelper(req.query);

    // Verificar que el cliente existe
    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado.'
      });
    }

    const { count, rows: invoices } = await Invoice.findAndCountAll({
      where: { clientId },
      limit,
      offset,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name'] },
        {
          model: InvoiceItem,
          as: 'items',
          attributes: ['id', 'productName', 'quantity', 'unitPrice', 'subtotal']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        client: { id: client.id, name: client.name, nit_cc: client.nit_cc },
        invoices,
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

module.exports = {
  getAll,
  getById,
  create,
  updateStatus,
  getByClient
};
