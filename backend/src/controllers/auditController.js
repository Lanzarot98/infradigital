// ============================================================================
// Controlador de Auditoría
// InfraDigital - Consulta y estadísticas del registro de auditoría
// ============================================================================

const { Op, fn, col, literal } = require('sequelize');
const { AuditLog, User } = require('../models');
const { paginationHelper } = require('../utils/helpers');

// ── Listar registros de auditoría con filtros ────────────────────────────────
const getAll = async (req, res, next) => {
  try {
    const { page, limit, offset } = paginationHelper(req.query);
    const { userId, action, tableName, dateFrom, dateTo, search } = req.query;

    const where = {};

    if (req.user.role !== 'admin') {
      where.userId = req.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (tableName) {
      where.tableName = tableName;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt[Op.gte] = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = endDate;
      }
    }

    if (search) {
      where.description = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where,
      limit,
      offset,
      include: [
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
        logs,
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

// ── Obtener registros de auditoría por usuario ───────────────────────────────
const getByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (req.user.role !== 'admin' && userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver los registros de otro usuario.'
      });
    }

    const { page, limit, offset } = paginationHelper(req.query);

    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where: { userId },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        user,
        logs,
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

// ── Obtener registros de auditoría por tabla ─────────────────────────────────
const getByTable = async (req, res, next) => {
  try {
    const { tableName } = req.params;
    const { page, limit, offset } = paginationHelper(req.query);

    const validTables = ['products', 'clients', 'invoices', 'users', 'inventory_movements'];
    if (!validTables.includes(tableName)) {
      return res.status(400).json({
        success: false,
        message: `Tabla no válida. Opciones: ${validTables.join(', ')}`
      });
    }

    const where = { tableName };
    if (req.user.role !== 'admin') {
      where.userId = req.user.id;
    }

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where,
      limit,
      offset,
      include: [
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
        tableName,
        logs,
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

// ── Estadísticas de auditoría ────────────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const scopeWhere = req.user.role !== 'admin' ? { userId: req.user.id } : {};

    const totalActions = await AuditLog.count({ where: scopeWhere });

    const actionsByTable = await AuditLog.findAll({
      attributes: [
        'tableName',
        [fn('COUNT', col('id')), 'total']
      ],
      where: scopeWhere,
      group: ['tableName'],
      order: [[literal('"total"'), 'DESC']],
      raw: true
    });

    const actionsByType = await AuditLog.findAll({
      attributes: [
        'action',
        [fn('COUNT', col('id')), 'total']
      ],
      where: scopeWhere,
      group: ['action'],
      order: [[literal('"total"'), 'DESC']],
      raw: true
    });

    const mostActiveUsers = await AuditLog.findAll({
      attributes: [
        'userId',
        [fn('COUNT', col('audit_logs.id')), 'total']
      ],
      where: scopeWhere,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email']
        }
      ],
      group: ['userId', 'user.id', 'user.name', 'user.email'],
      order: [[literal('"total"'), 'DESC']],
      limit: 10,
      raw: true,
      nest: true
    });

    const recentActions = await AuditLog.findAll({
      where: scopeWhere,
      limit: 10,
      include: [
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
        totalActions,
        actionsByTable,
        actionsByType,
        mostActiveUsers,
        recentActions
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getByUser,
  getByTable,
  getStats
};
