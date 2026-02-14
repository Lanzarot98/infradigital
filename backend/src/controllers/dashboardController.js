// ============================================================================
// Controlador del Dashboard
// InfraDigital - Indicadores y estadísticas del negocio
// ============================================================================

const { Op, fn, col, literal } = require('sequelize');
const { sequelize, Product, Client, Invoice, InvoiceItem } = require('../models');

// ── Resumen general del negocio ──────────────────────────────────────────────
const getSummary = async (req, res, next) => {
  try {
    // Total de productos activos
    const totalProducts = await Product.count({ where: { isActive: true } });

    // Total de clientes activos
    const totalClients = await Client.count({ where: { isActive: true } });

    // Total de facturas
    const totalInvoices = await Invoice.count();

    // Total de ingresos (suma de facturas pagadas)
    const revenueResult = await Invoice.findOne({
      where: { status: 'pagada' },
      attributes: [[fn('COALESCE', fn('SUM', col('total')), 0), 'totalRevenue']]
    });
    const totalRevenue = parseFloat(revenueResult.getDataValue('totalRevenue')) || 0;

    // Facturas pendientes de pago
    const pendingInvoices = await Invoice.count({ where: { status: 'pendiente' } });

    // Monto total pendiente
    const pendingResult = await Invoice.findOne({
      where: { status: 'pendiente' },
      attributes: [[fn('COALESCE', fn('SUM', col('total')), 0), 'pendingAmount']]
    });
    const pendingAmount = parseFloat(pendingResult.getDataValue('pendingAmount')) || 0;

    // Productos con stock bajo
    const lowStockCount = await Product.count({
      where: {
        isActive: true,
        stock: { [Op.lte]: col('min_stock') }
      }
    });

    res.json({
      success: true,
      data: {
        totalProducts,
        totalClients,
        totalInvoices,
        totalRevenue,
        pendingInvoices,
        pendingAmount,
        lowStockCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── Ventas agrupadas por mes (últimos 12 meses) ─────────────────────────────
const getSalesChart = async (req, res, next) => {
  try {
    // Fecha de hace 12 meses
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const salesByMonth = await Invoice.findAll({
      where: {
        status: { [Op.ne]: 'anulada' },
        issueDate: { [Op.gte]: twelveMonthsAgo }
      },
      attributes: [
        [fn('TO_CHAR', col('issue_date'), 'YYYY-MM'), 'month'],
        [fn('COUNT', col('id')), 'invoiceCount'],
        [fn('COALESCE', fn('SUM', col('total')), 0), 'totalSales']
      ],
      group: [fn('TO_CHAR', col('issue_date'), 'YYYY-MM')],
      order: [[fn('TO_CHAR', col('issue_date'), 'YYYY-MM'), 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      data: { salesByMonth }
    });
  } catch (error) {
    next(error);
  }
};

// ── Productos más vendidos ───────────────────────────────────────────────────
const getTopProducts = async (req, res, next) => {
  try {
    const limitCount = parseInt(req.query.limit, 10) || 10;

    const topProducts = await InvoiceItem.findAll({
      attributes: [
        'productId',
        'productName',
        [fn('SUM', col('quantity')), 'totalQuantity'],
        [fn('SUM', col('subtotal')), 'totalRevenue']
      ],
      include: [
        {
          model: Invoice,
          as: 'invoice',
          attributes: [],
          where: { status: { [Op.ne]: 'anulada' } }
        }
      ],
      group: ['productId', 'productName'],
      order: [[fn('SUM', col('quantity')), 'DESC']],
      limit: limitCount,
      raw: true
    });

    res.json({
      success: true,
      data: { topProducts }
    });
  } catch (error) {
    next(error);
  }
};

// ── Ingresos agrupados por método de pago ────────────────────────────────────
const getRevenueByPaymentMethod = async (req, res, next) => {
  try {
    const revenueByMethod = await Invoice.findAll({
      where: { status: 'pagada' },
      attributes: [
        'paymentMethod',
        [fn('COUNT', col('id')), 'invoiceCount'],
        [fn('COALESCE', fn('SUM', col('total')), 0), 'totalRevenue']
      ],
      group: ['paymentMethod'],
      order: [[fn('SUM', col('total')), 'DESC']],
      raw: true
    });

    res.json({
      success: true,
      data: { revenueByMethod }
    });
  } catch (error) {
    next(error);
  }
};

// ── Alertas de inventario (productos con stock bajo) ─────────────────────────
const getInventoryAlerts = async (req, res, next) => {
  try {
    const alerts = await Product.findAll({
      where: {
        isActive: true,
        stock: { [Op.lte]: col('min_stock') }
      },
      attributes: ['id', 'name', 'sku', 'stock', 'minStock', 'category', 'unit'],
      order: [['stock', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        count: alerts.length,
        alerts
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── Tendencia de ventas diarias (últimos 30 días) ────────────────────────────
const getSalesTrend = async (req, res, next) => {
  try {
    // Fecha de hace 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesTrend = await Invoice.findAll({
      where: {
        status: { [Op.ne]: 'anulada' },
        issueDate: { [Op.gte]: thirtyDaysAgo }
      },
      attributes: [
        [fn('DATE', col('issue_date')), 'date'],
        [fn('COUNT', col('id')), 'invoiceCount'],
        [fn('COALESCE', fn('SUM', col('total')), 0), 'dailySales']
      ],
      group: [fn('DATE', col('issue_date'))],
      order: [[fn('DATE', col('issue_date')), 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      data: { salesTrend }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getSalesChart,
  getTopProducts,
  getRevenueByPaymentMethod,
  getInventoryAlerts,
  getSalesTrend
};
