// ============================================================================
// Rutas de Auditoría
// InfraDigital - Consulta del registro de auditoría
// Admins ven todos los registros; usuarios normales solo los propios
// ============================================================================

const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Auditoría
 *   description: Registro de auditoría del sistema (solo administradores)
 */

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: Listar registros de auditoría con filtros
 *     tags: [Auditoría]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de registros por página
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por ID de usuario
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [crear, actualizar, eliminar, ajustar_stock, cambiar_estado, iniciar_sesion, cerrar_sesion]
 *         description: Filtrar por tipo de acción
 *       - in: query
 *         name: tableName
 *         schema:
 *           type: string
 *           enum: [products, clients, invoices, users, inventory_movements]
 *         description: Filtrar por tabla afectada
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicial del rango (YYYY-MM-DD)
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha final del rango (YYYY-MM-DD)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar en la descripción de la acción
 *     responses:
 *       200:
 *         description: Lista de registros de auditoría con paginación
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado (requiere rol admin)
 */
router.get('/', authenticate, auditController.getAll);

/**
 * @swagger
 * /api/audit/stats:
 *   get:
 *     summary: Obtener estadísticas de auditoría
 *     tags: [Auditoría]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas generales de auditoría
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
 *                     totalActions:
 *                       type: integer
 *                     actionsByTable:
 *                       type: array
 *                     actionsByType:
 *                       type: array
 *                     mostActiveUsers:
 *                       type: array
 *                     recentActions:
 *                       type: array
 */
router.get('/stats', authenticate, auditController.getStats);

/**
 * @swagger
 * /api/audit/user/{userId}:
 *   get:
 *     summary: Obtener registros de auditoría de un usuario específico
 *     tags: [Auditoría]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del usuario
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Registros de auditoría del usuario
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/user/:userId', authenticate, auditController.getByUser);

/**
 * @swagger
 * /api/audit/table/{tableName}:
 *   get:
 *     summary: Obtener registros de auditoría por tabla
 *     tags: [Auditoría]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tableName
 *         required: true
 *         schema:
 *           type: string
 *           enum: [products, clients, invoices, users, inventory_movements]
 *         description: Nombre de la tabla
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Registros de auditoría de la tabla
 *       400:
 *         description: Nombre de tabla no válido
 */
router.get('/table/:tableName', authenticate, auditController.getByTable);

module.exports = router;
