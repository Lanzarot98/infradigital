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
        description: 'Servidor de desarrollo'
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
