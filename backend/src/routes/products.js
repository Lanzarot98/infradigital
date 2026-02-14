// ============================================================================
// Rutas de Productos
// InfraDigital - CRUD de productos y gestión de inventario
// ============================================================================

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, productSchema } = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Productos
 *   description: Gestión de productos e inventario
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Listar todos los productos
 *     tags: [Productos]
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
 *         description: Búsqueda por nombre, SKU o descripción
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoría
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *         description: Filtrar productos con stock bajo
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filtrar por estado activo/inactivo
 *     responses:
 *       200:
 *         description: Lista de productos con paginación
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
 *                     products:
 *                       type: array
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', authenticate, productController.getAll);

/**
 * @swagger
 * /api/products/low-stock:
 *   get:
 *     summary: Obtener productos con stock bajo
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de productos con stock bajo o igual al mínimo
 */
router.get('/low-stock', authenticate, productController.getLowStock);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obtener un producto por ID
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto con historial de movimientos de inventario
 *       404:
 *         description: Producto no encontrado
 */
router.get('/:id', authenticate, productController.getById);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Crear un nuevo producto
 *     tags: [Productos]
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
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Arroz Diana 500g"
 *               description:
 *                 type: string
 *                 example: "Arroz blanco de grano largo"
 *               sku:
 *                 type: string
 *                 example: "ARR-001"
 *               price:
 *                 type: number
 *                 example: 3500
 *               cost:
 *                 type: number
 *                 example: 2800
 *               stock:
 *                 type: integer
 *                 example: 100
 *               minStock:
 *                 type: integer
 *                 example: 20
 *               category:
 *                 type: string
 *                 example: "Alimentos"
 *               unit:
 *                 type: string
 *                 enum: [unidad, kilogramo, litro, metro, caja]
 *                 example: "unidad"
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *       400:
 *         description: Error de validación
 */
router.post('/', authenticate, validate(productSchema), productController.create);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Actualizar un producto
 *     tags: [Productos]
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
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               cost:
 *                 type: number
 *               minStock:
 *                 type: integer
 *               category:
 *                 type: string
 *               unit:
 *                 type: string
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *       404:
 *         description: Producto no encontrado
 */
router.put('/:id', authenticate, productController.update);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Eliminar un producto (soft delete)
 *     tags: [Productos]
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
 *         description: Producto eliminado exitosamente
 *       404:
 *         description: Producto no encontrado
 */
router.delete('/:id', authenticate, authorize('admin'), productController.remove);

/**
 * @swagger
 * /api/products/{id}/stock:
 *   patch:
 *     summary: Ajustar stock de un producto
 *     tags: [Productos]
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
 *               - type
 *               - quantity
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [entrada, salida, ajuste]
 *                 example: "entrada"
 *               quantity:
 *                 type: integer
 *                 example: 50
 *               reason:
 *                 type: string
 *                 example: "Reposición de inventario"
 *               reference:
 *                 type: string
 *                 example: "OC-2026-001"
 *     responses:
 *       200:
 *         description: Stock actualizado exitosamente
 *       400:
 *         description: Stock insuficiente o datos inválidos
 *       404:
 *         description: Producto no encontrado
 */
router.patch('/:id/stock', authenticate, productController.adjustStock);

module.exports = router;
