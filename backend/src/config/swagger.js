// ============================================================================
// Configuración de Swagger/OpenAPI 3.0
// InfraDigital - Documentación de la API REST
// ============================================================================

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'InfraDigital API',
      version: '1.0.0',
      description:
        'API REST para InfraDigital - Sistema de gestión de procesos empresariales ' +
        'diseñado para pequeñas empresas colombianas. Incluye módulos de inventario, ' +
        'facturación, gestión de clientes y tablero de indicadores.',
      contact: {
        name: 'InfraDigital Team',
        email: 'soporte@infradigital.co'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Servidor de desarrollo local'
      },
      {
        url: process.env.RENDER_EXTERNAL_URL || 'https://infradigital-api.onrender.com',
        description: 'Servidor de producción (Render)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingrese el token JWT obtenido en /api/auth/login'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error interno del servidor' },
            errors: { type: 'array', items: { type: 'string' } }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 100 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            totalPages: { type: 'integer', example: 10 }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Juan Pérez' },
            email: { type: 'string', format: 'email', example: 'juan@ejemplo.com' },
            role: { type: 'string', enum: ['admin', 'user'], example: 'user' },
            company: { type: 'string', example: 'InfraDigital SAS' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Arroz Diana 500g' },
            description: { type: 'string', example: 'Arroz blanco de grano largo' },
            sku: { type: 'string', example: 'ARR-001' },
            price: { type: 'number', example: 3500 },
            cost: { type: 'number', example: 2800 },
            stock: { type: 'integer', example: 100 },
            minStock: { type: 'integer', example: 20 },
            category: { type: 'string', example: 'Alimentos' },
            unit: { type: 'string', enum: ['unidad', 'kilogramo', 'litro', 'metro', 'caja'], example: 'unidad' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Client: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Tienda Don José' },
            email: { type: 'string', format: 'email', example: 'donjose@ejemplo.com' },
            phone: { type: 'string', example: '3001234567' },
            address: { type: 'string', example: 'Calle 10 #25-30' },
            city: { type: 'string', example: 'Bogotá' },
            nit_cc: { type: 'string', example: '900123456-1' },
            type: { type: 'string', enum: ['persona_natural', 'persona_juridica'], example: 'persona_juridica' },
            notes: { type: 'string', example: 'Cliente frecuente desde 2024' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Invoice: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            invoiceNumber: { type: 'string', example: 'FE-2026-0001' },
            clientId: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            subtotal: { type: 'number', example: 50000 },
            taxRate: { type: 'number', example: 19.00 },
            taxAmount: { type: 'number', example: 9500 },
            total: { type: 'number', example: 59500 },
            status: { type: 'string', enum: ['pendiente', 'pagada', 'anulada'], example: 'pendiente' },
            paymentMethod: { type: 'string', enum: ['efectivo', 'transferencia', 'tarjeta_credito', 'tarjeta_debito'], example: 'efectivo' },
            notes: { type: 'string', example: 'Entrega en la dirección del cliente' },
            issueDate: { type: 'string', format: 'date-time' },
            dueDate: { type: 'string', format: 'date', nullable: true },
            client: { $ref: '#/components/schemas/Client' },
            user: { $ref: '#/components/schemas/User' },
            items: { type: 'array', items: { $ref: '#/components/schemas/InvoiceItem' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        InvoiceItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            invoiceId: { type: 'string', format: 'uuid' },
            productId: { type: 'string', format: 'uuid' },
            productName: { type: 'string', example: 'Arroz Diana 500g' },
            quantity: { type: 'integer', example: 5 },
            unitPrice: { type: 'number', example: 3500 },
            subtotal: { type: 'number', example: 17500 }
          }
        },
        Permission: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            role: { type: 'string', enum: ['admin', 'user'], example: 'user' },
            module: { type: 'string', example: 'products' },
            canView: { type: 'boolean', example: true },
            canCreate: { type: 'boolean', example: false },
            canEdit: { type: 'boolean', example: false },
            canDelete: { type: 'boolean', example: false }
          }
        },
        AuditLog: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            action: { type: 'string', enum: ['crear', 'actualizar', 'eliminar', 'ajustar_stock', 'cambiar_estado', 'iniciar_sesion', 'cerrar_sesion'], example: 'crear' },
            tableName: { type: 'string', enum: ['products', 'clients', 'invoices', 'users', 'inventory_movements', 'permissions'], example: 'invoices' },
            recordId: { type: 'string', format: 'uuid' },
            previousValues: { type: 'object', nullable: true },
            newValues: { type: 'object', nullable: true },
            description: { type: 'string', example: 'Creó la factura FE-2026-0001' },
            ipAddress: { type: 'string', example: '192.168.1.1' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        InventoryMovement: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            productId: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['entrada', 'salida', 'ajuste'], example: 'entrada' },
            quantity: { type: 'integer', example: 50 },
            previousStock: { type: 'integer', example: 100 },
            newStock: { type: 'integer', example: 150 },
            reason: { type: 'string', example: 'Reposición de inventario' },
            reference: { type: 'string', example: 'OC-2026-001' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  // Rutas donde están las anotaciones JSDoc de Swagger
  apis: [
    './src/routes/*.js',
    './src/models/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
