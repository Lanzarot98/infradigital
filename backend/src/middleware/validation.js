// ============================================================================
// Middleware de Validación con Zod
// InfraDigital - Esquemas de validación y middleware factory
// ============================================================================

const { z } = require('zod');

// ── Middleware Factory de Validación ──────────────────────────────────────────
// Recibe un esquema Zod y retorna un middleware que valida req.body

/**
 * Fábrica de middleware de validación.
 * Recibe un esquema Zod y retorna un middleware de Express
 * que valida el cuerpo de la solicitud contra ese esquema.
 *
 * @param {z.ZodSchema} schema - Esquema de validación Zod
 * @returns {Function} Middleware de Express
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      // Validar y transformar los datos del body
      const validated = schema.parse(req.body);
      req.body = validated; // Reemplazar body con datos validados/transformados
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Formatear errores de Zod en español
        const formattedErrors = error.issues.map((issue) => ({
          campo: issue.path.join('.'),
          mensaje: issue.message,
          codigo: issue.code
        }));

        return res.status(400).json({
          success: false,
          message: 'Error de validación en los datos enviados',
          errors: formattedErrors
        });
      }
      next(error);
    }
  };
};

// ══════════════════════════════════════════════════════════════════════════════
// ESQUEMAS DE VALIDACIÓN
// ══════════════════════════════════════════════════════════════════════════════

// ── Esquema de Registro de Usuario ───────────────────────────────────────────
const registerSchema = z.object({
  name: z
    .string({ required_error: 'El nombre es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  email: z
    .string({ required_error: 'El correo electrónico es obligatorio' })
    .email('Debe proporcionar un correo electrónico válido')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(128, 'La contraseña no puede exceder 128 caracteres'),
  role: z
    .enum(['admin', 'user'], {
      errorMap: () => ({ message: 'El rol debe ser "admin" o "user"' })
    })
    .optional()
    .default('user')
});

// ── Esquema de Inicio de Sesión ──────────────────────────────────────────────
const loginSchema = z.object({
  email: z
    .string({ required_error: 'El correo electrónico es obligatorio' })
    .email('Debe proporcionar un correo electrónico válido')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(1, 'La contraseña es obligatoria')
});

// ── Esquema de Producto ──────────────────────────────────────────────────────
const productSchema = z.object({
  name: z
    .string({ required_error: 'El nombre del producto es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200, 'El nombre no puede exceder 200 caracteres')
    .trim(),
  description: z
    .string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .optional()
    .nullable(),
  sku: z
    .string()
    .max(50, 'El SKU no puede exceder 50 caracteres')
    .trim()
    .optional()
    .nullable(),
  price: z
    .number({ required_error: 'El precio es obligatorio', invalid_type_error: 'El precio debe ser un número' })
    .positive('El precio debe ser un número positivo')
    .max(999999999999.99, 'El precio excede el valor máximo permitido'),
  cost: z
    .number({ invalid_type_error: 'El costo debe ser un número' })
    .positive('El costo debe ser un número positivo')
    .max(999999999999.99, 'El costo excede el valor máximo permitido')
    .optional()
    .nullable(),
  stock: z
    .number({ invalid_type_error: 'El stock debe ser un número' })
    .int('El stock debe ser un número entero')
    .min(0, 'El stock no puede ser negativo')
    .optional()
    .default(0),
  minStock: z
    .number({ invalid_type_error: 'El stock mínimo debe ser un número' })
    .int('El stock mínimo debe ser un número entero')
    .min(0, 'El stock mínimo no puede ser negativo')
    .optional()
    .default(5),
  category: z
    .string()
    .max(100, 'La categoría no puede exceder 100 caracteres')
    .trim()
    .optional()
    .nullable(),
  unit: z
    .enum(['unidad', 'kilogramo', 'litro', 'metro', 'caja'], {
      errorMap: () => ({
        message: 'La unidad debe ser: unidad, kilogramo, litro, metro o caja'
      })
    })
    .optional()
    .default('unidad'),
  isActive: z
    .boolean()
    .optional()
    .default(true)
});

// ── Esquema de Cliente ───────────────────────────────────────────────────────
const clientSchema = z.object({
  name: z
    .string({ required_error: 'El nombre del cliente es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200, 'El nombre no puede exceder 200 caracteres')
    .trim(),
  email: z
    .string()
    .email('Debe proporcionar un correo electrónico válido')
    .toLowerCase()
    .trim()
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .trim()
    .optional()
    .nullable(),
  address: z
    .string()
    .max(300, 'La dirección no puede exceder 300 caracteres')
    .trim()
    .optional()
    .nullable(),
  city: z
    .string()
    .max(100, 'La ciudad no puede exceder 100 caracteres')
    .trim()
    .optional()
    .nullable(),
  nit_cc: z
    .string()
    .max(20, 'El NIT/CC no puede exceder 20 caracteres')
    .trim()
    .optional()
    .nullable(),
  type: z
    .enum(['persona_natural', 'persona_juridica'], {
      errorMap: () => ({
        message: 'El tipo debe ser "persona_natural" o "persona_juridica"'
      })
    })
    .optional()
    .default('persona_natural'),
  notes: z
    .string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .optional()
    .nullable(),
  isActive: z
    .boolean()
    .optional()
    .default(true)
});

// ── Esquema de ítem de factura (sub-esquema) ─────────────────────────────────
const invoiceItemSchema = z.object({
  productId: z
    .string({ required_error: 'El ID del producto es obligatorio' })
    .uuid('El ID del producto debe ser un UUID válido'),
  quantity: z
    .number({ required_error: 'La cantidad es obligatoria', invalid_type_error: 'La cantidad debe ser un número' })
    .int('La cantidad debe ser un número entero')
    .positive('La cantidad debe ser mayor a 0'),
  unitPrice: z
    .number({ required_error: 'El precio unitario es obligatorio', invalid_type_error: 'El precio unitario debe ser un número' })
    .positive('El precio unitario debe ser positivo')
});

// ── Esquema de Factura ───────────────────────────────────────────────────────
const invoiceSchema = z.object({
  clientId: z
    .string({ required_error: 'El ID del cliente es obligatorio' })
    .uuid('El ID del cliente debe ser un UUID válido'),
  items: z
    .array(invoiceItemSchema, {
      required_error: 'Debe incluir al menos un ítem en la factura'
    })
    .min(1, 'La factura debe tener al menos un ítem')
    .max(100, 'La factura no puede tener más de 100 ítems'),
  notes: z
    .string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .optional()
    .nullable(),
  paymentMethod: z
    .enum(['efectivo', 'tarjeta', 'transferencia'], {
      errorMap: () => ({
        message: 'El método de pago debe ser: efectivo, tarjeta o transferencia'
      })
    })
    .optional()
    .default('efectivo'),
  dueDate: z
    .string()
    .datetime({ message: 'La fecha de vencimiento debe ser una fecha válida' })
    .optional()
    .nullable()
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  productSchema,
  clientSchema,
  invoiceSchema
};
