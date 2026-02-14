// ============================================================================
// Controlador de Clientes
// InfraDigital - CRUD de clientes y estadísticas de compras
// ============================================================================

const { Op, fn, col, literal } = require('sequelize');
const { Client, Invoice, InvoiceItem } = require('../models');
const { paginationHelper } = require('../utils/helpers');

// ── Listar todos los clientes con filtros ────────────────────────────────────
const getAll = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginationHelper(req.query);
    const { search, type, isActive } = req.query;

    // Construir condiciones de búsqueda
    const where = {};

    // Filtro por estado activo (por defecto solo activos)
    where.isActive = isActive !== undefined ? isActive === 'true' : true;

    // Búsqueda por nombre, email, NIT/CC o teléfono
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { nit_cc: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { city: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filtro por tipo de persona
    if (type) {
      where.type = type;
    }

    const { count, rows: clients } = await Client.findAndCountAll({
      where,
      limit,
      offset,
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        clients,
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

// ── Obtener un cliente por ID con historial de compras ───────────────────────
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const client = await Client.findByPk(id, {
      include: [
        {
          model: Invoice,
          as: 'invoices',
          limit: 20,
          order: [['createdAt', 'DESC']],
          attributes: ['id', 'invoiceNumber', 'total', 'status', 'paymentMethod', 'issueDate', 'createdAt']
        }
      ]
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado.'
      });
    }

    res.json({
      success: true,
      data: { client }
    });
  } catch (error) {
    next(error);
  }
};

// ── Crear un nuevo cliente ───────────────────────────────────────────────────
const create = async (req, res, next) => {
  try {
    const { name, email, phone, address, city, nit_cc, type, notes } = req.body;

    // Verificar si el NIT/CC ya está registrado (si se proporciona)
    if (nit_cc) {
      const existingClient = await Client.findOne({ where: { nit_cc } });
      if (existingClient) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un cliente registrado con este NIT/CC.'
        });
      }
    }

    const client = await Client.create({
      name,
      email,
      phone,
      address,
      city,
      nit_cc,
      type: type || 'persona_natural',
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente.',
      data: { client }
    });
  } catch (error) {
    next(error);
  }
};

// ── Actualizar un cliente existente ──────────────────────────────────────────
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = await Client.findByPk(id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado.'
      });
    }

    // Verificar NIT/CC único si se está actualizando
    if (req.body.nit_cc && req.body.nit_cc !== client.nit_cc) {
      const existingClient = await Client.findOne({
        where: { nit_cc: req.body.nit_cc, id: { [Op.ne]: id } }
      });
      if (existingClient) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe otro cliente con este NIT/CC.'
        });
      }
    }

    // Actualizar solo los campos proporcionados
    const allowedFields = ['name', 'email', 'phone', 'address', 'city', 'nit_cc', 'type', 'notes', 'isActive'];
    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    await client.update(updateData);

    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente.',
      data: { client }
    });
  } catch (error) {
    next(error);
  }
};

// ── Eliminar cliente (soft delete) ───────────────────────────────────────────
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = await Client.findByPk(id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado.'
      });
    }

    // Eliminación lógica: marcar como inactivo
    await client.update({ isActive: false });

    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente.'
    });
  } catch (error) {
    next(error);
  }
};

// ── Obtener los clientes con más compras ─────────────────────────────────────
const getTopClients = async (req, res, next) => {
  try {
    const limitCount = parseInt(req.query.limit, 10) || 10;

    const clients = await Client.findAll({
      where: { isActive: true },
      attributes: {
        include: [
          [fn('COUNT', col('invoices.id')), 'totalInvoices'],
          [fn('COALESCE', fn('SUM', col('invoices.total')), 0), 'totalPurchases']
        ]
      },
      include: [
        {
          model: Invoice,
          as: 'invoices',
          attributes: [],
          where: { status: { [Op.ne]: 'anulada' } },
          required: false
        }
      ],
      group: ['clients.id'],
      order: [[literal('\"totalPurchases\"'), 'DESC']],
      limit: limitCount,
      subQuery: false
    });

    res.json({
      success: true,
      data: { clients }
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
  getTopClients
};
