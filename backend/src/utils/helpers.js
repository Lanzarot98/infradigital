// ============================================================================
// Utilidades y Funciones Helper
// InfraDigital - Funciones reutilizables del sistema
// ============================================================================

const { Invoice } = require('../models');
const { Op, fn, col } = require('sequelize');

/**
 * Genera un número de factura secuencial con formato colombiano.
 * Formato: FE-YYYY-NNNN (ej: FE-2026-0001)
 *
 * FE = Factura Electrónica
 * YYYY = Año actual
 * NNNN = Número secuencial con 4 dígitos
 *
 * @param {Transaction} [transaction] - Transacción de Sequelize (opcional)
 * @returns {Promise<string>} Número de factura generado
 */
const generateInvoiceNumber = async (transaction = null) => {
  const currentYear = new Date().getFullYear();
  const prefix = `FE-${currentYear}-`;

  // Buscar la última factura del año actual
  const lastInvoice = await Invoice.findOne({
    where: {
      invoiceNumber: { [Op.like]: `${prefix}%` }
    },
    order: [['invoiceNumber', 'DESC']],
    attributes: ['invoiceNumber'],
    ...(transaction && { transaction })
  });

  let nextNumber = 1;

  if (lastInvoice) {
    // Extraer el número secuencial de la última factura
    const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-').pop(), 10);
    nextNumber = lastNumber + 1;
  }

  // Formatear con ceros a la izquierda (4 dígitos)
  const sequentialNumber = String(nextNumber).padStart(4, '0');

  return `${prefix}${sequentialNumber}`;
};

/**
 * Formatea un número al formato de moneda colombiana (COP).
 * Ejemplo: 1500000 → "$1.500.000"
 *
 * @param {number} amount - Monto a formatear
 * @param {boolean} [showDecimals=false] - Mostrar decimales
 * @returns {string} Monto formateado como peso colombiano
 */
const formatCurrency = (amount, showDecimals = false) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0';
  }

  const options = {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0
  };

  return new Intl.NumberFormat('es-CO', options).format(amount);
};

/**
 * Calcula el IVA (Impuesto al Valor Agregado) de Colombia.
 * La tasa estándar de IVA en Colombia es del 19%.
 *
 * @param {number} subtotal - Monto base antes de impuestos
 * @param {number} [rate=19] - Tasa de IVA (porcentaje)
 * @returns {Object} Objeto con taxAmount y total
 * @returns {number} returns.taxAmount - Monto del IVA
 * @returns {number} returns.total - Total con IVA incluido
 */
const calculateIVA = (subtotal, rate = 19) => {
  const taxAmount = parseFloat((subtotal * (rate / 100)).toFixed(2));
  const total = parseFloat((subtotal + taxAmount).toFixed(2));

  return {
    taxAmount,
    total
  };
};

/**
 * Estandariza los parámetros de paginación de las consultas.
 * Establece valores por defecto y limita el máximo de registros.
 *
 * @param {Object} query - Query params del request (req.query)
 * @param {number} [query.page=1] - Número de página
 * @param {number} [query.limit=10] - Registros por página
 * @returns {Object} Parámetros de paginación estandarizados
 * @returns {number} returns.page - Página actual
 * @returns {number} returns.limit - Registros por página
 * @returns {number} returns.offset - Offset para la consulta SQL
 */
const paginationHelper = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

module.exports = {
  generateInvoiceNumber,
  formatCurrency,
  calculateIVA,
  paginationHelper
};
