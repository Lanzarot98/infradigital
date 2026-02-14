// ============================================================================
// Configuración de Base de Datos - Sequelize con PostgreSQL
// InfraDigital - Sistema de gestión empresarial
// ============================================================================

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Crear instancia de Sequelize con las variables de entorno
const sequelize = new Sequelize(
  process.env.DB_NAME || 'infradigital',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,        // Máximo de conexiones en el pool
      min: 0,         // Mínimo de conexiones en el pool
      acquire: 30000, // Tiempo máximo (ms) para intentar obtener una conexión
      idle: 10000     // Tiempo máximo (ms) que una conexión puede estar inactiva
    },
    define: {
      timestamps: true,  // Agregar createdAt y updatedAt automáticamente
      underscored: true, // Usar snake_case en lugar de camelCase para columnas
      freezeTableName: true // No pluralizar nombres de tablas
    },
    timezone: '-05:00' // Zona horaria de Colombia (UTC-5)
  }
);

module.exports = sequelize;
