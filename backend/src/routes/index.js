// ============================================================================
// Índice de Rutas - Combina todas las rutas de la API
// InfraDigital - Punto central de enrutamiento
// ============================================================================

const express = require('express');
const router = express.Router();

// Importar rutas individuales
const authRoutes = require('./auth');
const productRoutes = require('./products');
const clientRoutes = require('./clients');
const invoiceRoutes = require('./invoices');
const dashboardRoutes = require('./dashboard');
const auditRoutes = require('./audit');
const userRoutes = require('./users');

// Montar rutas en sus respectivos prefijos
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/clients', clientRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/audit', auditRoutes);
router.use('/users', userRoutes);

module.exports = router;
