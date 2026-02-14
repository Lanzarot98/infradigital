import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * InfraDigital - Funciones utilitarias de formato
 *
 * Formateadores para moneda colombiana, fechas, estados de facturas, etc.
 * Todos los textos en espanol.
 */

// ============================================
// FORMATO DE MONEDA
// ============================================

/**
 * Formatear un monto a pesos colombianos
 * Formato: "$ 1.234.567"
 *
 * @param {number|string} amount - Monto a formatear
 * @returns {string} Monto formateado en COP
 *
 * @example
 * formatCurrency(1234567)    // "$ 1.234.567"
 * formatCurrency(50000.5)    // "$ 50.001"
 * formatCurrency(0)          // "$ 0"
 * formatCurrency(null)       // "$ 0"
 */
export function formatCurrency(amount) {
  const num = Number(amount);

  if (isNaN(num)) {
    return '$ 0';
  }

  // Redondear al entero mas cercano (pesos colombianos no usan centavos normalmente)
  const rounded = Math.round(num);

  // Formatear con separador de miles usando punto
  const formatted = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Agregar signo negativo si es necesario
  return rounded < 0 ? '-$ ' + formatted : '$ ' + formatted;
}

/**
 * Formatear monto con centavos (para casos especiales)
 * @param {number|string} amount - Monto a formatear
 * @returns {string} Monto formateado con decimales
 */
export function formatCurrencyDecimal(amount) {
  const num = Number(amount);

  if (isNaN(num)) {
    return '$ 0,00';
  }

  const parts = num.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decPart = parts[1];

  return '$ ' + intPart + ',' + decPart;
}

// ============================================
// FORMATO DE FECHAS
// ============================================

/**
 * Parsear una fecha de forma segura
 * @param {string|Date} date - Fecha a parsear
 * @returns {Date|null} Objeto Date o null si es invalido
 */
function safeParse(date) {
  if (!date) return null;

  if (date instanceof Date) {
    return isValid(date) ? date : null;
  }

  if (typeof date === 'string') {
    try {
      const parsed = parseISO(date);
      return isValid(parsed) ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  return null;
}

/**
 * Formatear fecha a formato dd/MM/yyyy
 *
 * @param {string|Date} date - Fecha a formatear (ISO string o Date)
 * @returns {string} Fecha formateada o cadena vacia si es invalida
 *
 * @example
 * formatDate('2025-12-25T10:30:00Z')  // "25/12/2025"
 * formatDate(new Date())               // "13/02/2026"
 */
export function formatDate(date) {
  const parsed = safeParse(date);
  if (!parsed) return '';

  return format(parsed, 'dd/MM/yyyy', { locale: es });
}

/**
 * Formatear fecha y hora a formato dd/MM/yyyy HH:mm
 *
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Fecha y hora formateada
 *
 * @example
 * formatDateTime('2025-12-25T10:30:00Z')  // "25/12/2025 10:30"
 */
export function formatDateTime(date) {
  const parsed = safeParse(date);
  if (!parsed) return '';

  return format(parsed, 'dd/MM/yyyy HH:mm', { locale: es });
}

/**
 * Formatear fecha en formato largo legible
 *
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Fecha en formato largo
 *
 * @example
 * formatDateLong('2025-12-25')  // "25 de diciembre de 2025"
 */
export function formatDateLong(date) {
  const parsed = safeParse(date);
  if (!parsed) return '';

  return format(parsed, "d 'de' MMMM 'de' yyyy", { locale: es });
}

/**
 * Formatear fecha relativa (hace X tiempo)
 *
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Tiempo relativo en espanol
 *
 * @example
 * formatRelativeDate(haceDosHoras)  // "Hace 2 horas"
 */
export function formatRelativeDate(date) {
  const parsed = safeParse(date);
  if (!parsed) return '';

  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Hace un momento';
  if (diffMinutes < 60) return 'Hace ' + diffMinutes + (diffMinutes === 1 ? ' minuto' : ' minutos');
  if (diffHours < 24) return 'Hace ' + diffHours + (diffHours === 1 ? ' hora' : ' horas');
  if (diffDays < 7) return 'Hace ' + diffDays + (diffDays === 1 ? ' dia' : ' dias');
  if (diffDays < 30) {
    var weeks = Math.floor(diffDays / 7);
    return 'Hace ' + weeks + (weeks === 1 ? ' semana' : ' semanas');
  }

  return formatDate(date);
}

// ============================================
// ESTADOS DE FACTURA
// ============================================

/**
 * Mapa de estados de factura con sus propiedades visuales
 */
const INVOICE_STATUS_MAP = {
  pendiente: {
    label: 'Pendiente',
    color: 'badge-warning',
    textColor: '#b45309',
    bgColor: '#fffbeb',
  },
  pagada: {
    label: 'Pagada',
    color: 'badge-success',
    textColor: '#15803d',
    bgColor: '#f0fdf4',
  },
  vencida: {
    label: 'Vencida',
    color: 'badge-danger',
    textColor: '#b91c1c',
    bgColor: '#fef2f2',
  },
  anulada: {
    label: 'Anulada',
    color: 'badge-neutral',
    textColor: '#475569',
    bgColor: '#f1f5f9',
  },
  parcial: {
    label: 'Pago Parcial',
    color: 'badge-info',
    textColor: '#1d4ed8',
    bgColor: '#eff6ff',
  },
  borrador: {
    label: 'Borrador',
    color: 'badge-neutral',
    textColor: '#64748b',
    bgColor: '#f8fafc',
  },
};

/**
 * Obtener la clase CSS de color para un estado de factura
 *
 * @param {string} status - Estado de la factura
 * @returns {string} Clase CSS del badge
 *
 * @example
 * getStatusColor('pagada')    // "badge-success"
 * getStatusColor('pendiente') // "badge-warning"
 * getStatusColor('vencida')   // "badge-danger"
 */
export function getStatusColor(status) {
  const statusKey = (status || '').toLowerCase().trim();
  const config = INVOICE_STATUS_MAP[statusKey];
  return config ? config.color : 'badge-neutral';
}

/**
 * Obtener la etiqueta en espanol para un estado de factura
 *
 * @param {string} status - Estado de la factura (clave en ingles o espanol)
 * @returns {string} Etiqueta en espanol
 *
 * @example
 * getStatusLabel('pendiente') // "Pendiente"
 * getStatusLabel('pagada')    // "Pagada"
 */
export function getStatusLabel(status) {
  const statusKey = (status || '').toLowerCase().trim();
  const config = INVOICE_STATUS_MAP[statusKey];
  return config ? config.label : status || 'Desconocido';
}

/**
 * Obtener toda la configuracion visual de un estado
 * @param {string} status - Estado de la factura
 * @returns {Object} { label, color, textColor, bgColor }
 */
export function getStatusConfig(status) {
  const statusKey = (status || '').toLowerCase().trim();
  return INVOICE_STATUS_MAP[statusKey] || {
    label: status || 'Desconocido',
    color: 'badge-neutral',
    textColor: '#64748b',
    bgColor: '#f8fafc',
  };
}

// ============================================
// FORMATO DE NUMEROS
// ============================================

/**
 * Formatear numero con separador de miles
 * @param {number|string} num - Numero a formatear
 * @returns {string} Numero formateado
 */
export function formatNumber(num) {
  const n = Number(num);
  if (isNaN(n)) return '0';
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Formatear porcentaje
 * @param {number} value - Valor del porcentaje
 * @param {number} decimals - Decimales a mostrar (default: 1)
 * @returns {string} Porcentaje formateado
 */
export function formatPercentage(value, decimals) {
  if (decimals === undefined) decimals = 1;
  const num = Number(value);
  if (isNaN(num)) return '0%';
  return num.toFixed(decimals).replace('.', ',') + '%';
}

// ============================================
// FORMATO DE DOCUMENTOS COLOMBIANOS
// ============================================

/**
 * Formatear numero de NIT colombiano
 * @param {string} nit - NIT sin formato
 * @returns {string} NIT formateado (ej: "900.123.456-7")
 */
export function formatNIT(nit) {
  if (!nit) return '';
  const clean = nit.replace(/[^0-9]/g, '');

  if (clean.length < 2) return clean;

  const dv = clean.slice(-1);
  const number = clean.slice(0, -1);
  const formatted = number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return formatted + '-' + dv;
}

/**
 * Formatear numero de telefono colombiano
 * @param {string} phone - Numero de telefono
 * @returns {string} Telefono formateado
 */
export function formatPhone(phone) {
  if (!phone) return '';
  const clean = phone.replace(/[^0-9]/g, '');

  if (clean.length === 10) {
    return clean.slice(0, 3) + ' ' + clean.slice(3, 6) + ' ' + clean.slice(6);
  }

  if (clean.length === 7) {
    return clean.slice(0, 3) + ' ' + clean.slice(3);
  }

  return phone;
}

// ============================================
// UTILIDADES GENERALES
// ============================================

/**
 * Truncar texto a una longitud maxima
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud maxima (default: 50)
 * @returns {string} Texto truncado con "..." si excede el limite
 */
export function truncateText(text, maxLength) {
  if (maxLength === undefined) maxLength = 50;
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Capitalizar primera letra de cada palabra
 * @param {string} text - Texto a capitalizar
 * @returns {string} Texto capitalizado
 */
export function capitalizeWords(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(function(word) { return word.charAt(0).toUpperCase() + word.slice(1); })
    .join(' ');
}

export default {
  formatCurrency,
  formatCurrencyDecimal,
  formatDate,
  formatDateTime,
  formatDateLong,
  formatRelativeDate,
  getStatusColor,
  getStatusLabel,
  getStatusConfig,
  formatNumber,
  formatPercentage,
  formatNIT,
  formatPhone,
  truncateText,
  capitalizeWords,
};