// ============================================================================
// Rutas de Clientes
// InfraDigital - CRUD de clientes y estadísticas de compras
// ============================================================================

const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, clientSchema } = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Clientes
 *   description: Gestión de clientes del negocio
 */

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: Listar todos los clientes
 *     tags: [Clientes]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre, email, NIT/CC, teléfono o ciudad
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [persona_natural, persona_juridica]
 *         description: Filtrar por tipo de persona
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filtrar por estado activo/inactivo
 *     responses:
 *       200:
 *         description: Lista de clientes con paginación
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
 *                     clients:
 *                       type: array
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', authenticate, clientController.getAll);

/**
 * @swagger
 * /api/clients/top:
 *   get:
 *     summary: Obtener los clientes con más compras
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de clientes top a retornar
 *     responses:
 *       200:
 *         description: Lista de clientes ordenados por total de compras
 */
router.get('/top', authenticate, clientController.getTopClients);

/**
 * @swagger
 * /api/clients/{id}:
 *   get:
 *     summary: Obtener un cliente por ID
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Cliente con historial de facturas
 *       404:
 *         description: Cliente no encontrado
 */
router.get('/:id', authenticate, clientController.getById);

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Crear un nuevo cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Tienda Don José"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "donjose@ejemplo.com"
 *               phone:
 *                 type: string
 *                 example: "3001234567"
 *               address:
 *                 type: string
 *                 example: "Calle 10 #25-30"
 *               city:
 *                 type: string
 *                 example: "Bogotá"
 *               nit_cc:
 *                 type: string
 *                 example: "900123456-1"
 *               type:
 *                 type: string
 *                 enum: [persona_natural, persona_juridica]
 *                 example: "persona_juridica"
 *               notes:
 *                 type: string
 *                 example: "Cliente frecuente desde 2024"
 *     responses:
 *       201:
 *         description: Cliente creado exitosamente
 *       400:
 *         description: Error de validación
 *       409:
 *         description: NIT/CC ya registrado
 */
router.post('/', authenticate, validate(clientSchema), clientController.create);

/**
 * @swagger
 * /api/clients/{id}:
 *   put:
 *     summary: Actualizar un cliente
 *     tags: [Clientes]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               nit_cc:
 *                 type: string
 *               type:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cliente actualizado exitosamente
 *       404:
 *         description: Cliente no encontrado
 *       409:
 *         description: NIT/CC ya registrado por otro cliente
 */
router.put('/:id', authenticate, clientController.update);

/**
 * @swagger
 * /api/clients/{id}:
 *   delete:
 *     summary: Eliminar un cliente (soft delete)
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Cliente eliminado exitosamente
 *       404:
 *         description: Cliente no encontrado
 */
router.delete('/:id', authenticate, authorize('admin'), clientController.remove);

module.exports = router;
