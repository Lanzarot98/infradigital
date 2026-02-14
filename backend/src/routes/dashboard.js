// ============================================================================
// Rutas del Dashboard
// InfraDigital - Indicadores, gráficos y estadísticas del negocio
// ============================================================================

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Indicadores y estadísticas del negocio
 */

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Obtener resumen general del negocio
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen con totales de productos, clientes, facturas e ingresos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProducts:
 *                       type: integer
 *                       example: 50
 *                     totalClients:
 *                       type: integer
 *                       example: 30
 *                     totalInvoices:
 *                       type: integer
 *                       example: 120
 *                     totalRevenue:
 *                       type: number
 *                       example: 15000000.00
 *                     pendingInvoices:
 *                       type: integer
 *                       example: 8
 *                     pendingAmount:
 *                       type: number
 *                       example: 2500000.00
 *                     lowStockCount:
 *                       type: integer
 *                       example: 5
 */
router.get('/summary', authenticate, dashboardController.getSummary);

/**
 * @swagger
 * /api/dashboard/sales-chart:
 *   get:
 *     summary: Ventas agrupadas por mes (últimos 12 meses)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos de ventas por mes para gráfico
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     salesByMonth:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                             example: "2026-01"
 *                           invoiceCount:
 *                             type: integer
 *                           totalSales:
 *                             type: number
 */
router.get('/sales-chart', authenticate, dashboardController.getSalesChart);

/**
 * @swagger
 * /api/dashboard/top-products:
 *   get:
 *     summary: Productos más vendidos
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de productos top a retornar
 *     responses:
 *       200:
 *         description: Lista de productos más vendidos por cantidad
 */
router.get('/top-products', authenticate, dashboardController.getTopProducts);

/**
 * @swagger
 * /api/dashboard/revenue-by-payment:
 *   get:
 *     summary: Ingresos agrupados por método de pago
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ingresos totales por cada método de pago
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     revenueByMethod:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           paymentMethod:
 *                             type: string
 *                           invoiceCount:
 *                             type: integer
 *                           totalRevenue:
 *                             type: number
 */
router.get('/revenue-by-payment', authenticate, dashboardController.getRevenueByPaymentMethod);

/**
 * @swagger
 * /api/dashboard/inventory-alerts:
 *   get:
 *     summary: Alertas de inventario (productos con stock bajo)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Productos con stock por debajo del mínimo
 */
router.get('/inventory-alerts', authenticate, dashboardController.getInventoryAlerts);

/**
 * @swagger
 * /api/dashboard/sales-trend:
 *   get:
 *     summary: Tendencia de ventas diarias (últimos 30 días)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ventas diarias para gráfico de tendencia
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     salesTrend:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           invoiceCount:
 *                             type: integer
 *                           dailySales:
 *                             type: number
 */
router.get('/sales-trend', authenticate, dashboardController.getSalesTrend);

module.exports = router;
