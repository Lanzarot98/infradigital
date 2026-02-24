// ============================================================================
// Utilidad de Auditoría
// InfraDigital - Función centralizada para registrar acciones en el sistema
// ============================================================================

const { AuditLog } = require('../models');

/**
 * Registra una acción en la tabla de auditoría.
 * Diseñado para ser no-bloqueante: los errores de auditoría no afectan
 * la operación principal.
 *
 * @param {Object} params
 * @param {string}  params.userId         - UUID del usuario que ejecutó la acción
 * @param {string}  params.action         - Tipo de acción (crear, actualizar, eliminar, etc.)
 * @param {string}  params.tableName      - Tabla afectada
 * @param {string}  [params.recordId]     - ID del registro afectado
 * @param {Object}  [params.previousValues] - Estado anterior del registro
 * @param {Object}  [params.newValues]    - Estado nuevo del registro
 * @param {string}  [params.description]  - Descripción legible en español
 * @param {Object}  [params.req]          - Objeto request de Express (para IP y User-Agent)
 */
const logAudit = async ({ userId, action, tableName, recordId, previousValues, newValues, description, req }) => {
  try {
    const ipAddress = req
      ? req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null
      : null;

    const userAgent = req
      ? req.headers['user-agent'] || null
      : null;

    await AuditLog.create({
      userId,
      action,
      tableName,
      recordId: recordId || null,
      previousValues: previousValues || null,
      newValues: newValues || null,
      description: description || null,
      ipAddress,
      userAgent
    });
  } catch (error) {
    console.error('[AuditLogger] Error al registrar auditoría:', error.message);
  }
};

module.exports = { logAudit };
