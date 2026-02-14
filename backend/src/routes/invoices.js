// ============================================================================
// Rutas de Facturas
// InfraDigital - Facturación electrónica con IVA colombiano
// ============================================================================

const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, invoiceSchema } = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Facturas
 *   description: Gestión de facturas y facturación electrónica
 */

/**
 * @swagger
 * /api/invoices:
 *   get:
 *     summary: Listar todas las facturas
 *     tags: [Facturas]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pendiente, pagada, anulada]
 *         description: Filtrar por estado de la factura
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por ID del cliente
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio del rango (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin del rango (YYYY-MM-DD)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por número de factura
 *     responses:
 *       200:
 *         description: Lista de facturas con paginación
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
 *                     invoices:
 *                       type: array
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', authenticate, invoiceController.getAll);

/**
 * @swagger
 * /api/invoices/{id}:
 *   get:
 *     summary: Obtener una factura por ID
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la factura
 *     responses:
 *       200:
 *         description: Factura con ítems, cliente y usuario
 *       404:
 *         description: Factura no encontrada
 */
router.get('/:id', authenticate, invoiceController.getById);

/**
 * @swagger
 * /api/invoices:
 *   post:
 *     summary: Crear una nueva factura
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientId
 *               - items
 *             properties:
 *               clientId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del cliente
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                     - unitPrice
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       example: 5
 *                     unitPrice:
 *                       type: number
 *                       example: 3500
 *               notes:
 *                 type: string
 *                 example: "Entrega en la dirección del cliente"
 *               paymentMethod:
 *                 type: string
 *                 enum: [efectivo, tarjeta, transferencia]
 *                 example: "efectivo"
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha de vencimiento
 *     responses:
 *       201:
 *         description: Factura creada exitosamente con cálculo automático de IVA (19%)
 *       400:
 *         description: Error de validación o stock insuficiente
 *       404:
 *         description: Cliente o producto no encontrado
 */
router.post('/', authenticate, validate(invoiceSchema), invoiceController.create);

/**
 * @swagger
 * /api/invoices/{id}/status:
 *   patch:
 *     summary: Actualizar estado de una factura
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pendiente, pagada, anulada]
 *                 description: Nuevo estado de la factura
 *     responses:
 *       200:
 *         description: Estado actualizado. Si se anula, se devuelve el stock.
 *       400:
 *         description: Estado no válido
 *       404:
 *         description: Factura no encontrada
 */
router.patch('/:id/status', authenticate, invoiceController.updateStatus);

/**
 * @swagger
 * /api/invoices/client/{clientId}:
 *   get:
 *     summary: Obtener facturas de un cliente específico
 *     tags: [Facturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del cliente
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
 *         description: Facturas del cliente con paginación
 *       404:
 *         description: Cliente no encontrado
 */
router.get('/client/:clientId', authenticate, invoiceController.getByClient);

module.exports = router;
