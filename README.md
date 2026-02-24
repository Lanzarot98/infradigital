# InfraDigital - Plataforma Web Progresiva (PWA) para MiPyMEs

**Proyecto de Grado - Ingeniería de Sistemas**  
Universidad Nacional Abierta y a Distancia (UNAD)  
Curso: Proyecto de Grado - Código: 202016907

## Descripción

InfraDigital es una Aplicación Web Progresiva (PWA) orientada a facilitar la digitalización y gestión integral de los procesos productivos en micro y pequeñas empresas (MiPyMEs) colombianas. La plataforma integra módulos de gestión de inventarios, facturación electrónica con IVA del 19%, administración de clientes (CRM básico), y un dashboard analítico con indicadores de productividad.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React.js 18, React Router v6, Recharts, jsPDF |
| **Backend** | Node.js, Express.js, Sequelize ORM |
| **Base de Datos** | PostgreSQL |
| **Autenticación** | JWT (JSON Web Tokens) |
| **PWA** | Service Workers, IndexedDB, Web App Manifest |
| **Documentación API** | Swagger / OpenAPI 3.0 |

## Arquitectura

```
┌─────────────────────────────────────────────────┐
│                  FRONTEND (PWA)                  │
│        React.js + Service Workers + IndexedDB    │
├─────────────────────────────────────────────────┤
│                   API REST                       │
│           Express.js + JWT Auth                  │
├─────────────────────────────────────────────────┤
│               BASE DE DATOS                      │
│          PostgreSQL + Sequelize ORM              │
└─────────────────────────────────────────────────┘
```

## Módulos Funcionales

1. **Gestión de Inventarios** - CRUD de productos, control de stock en tiempo real, alertas de desabastecimiento, registro de movimientos de entrada/salida
2. **Facturación** - Generación de facturas con IVA 19%, historial de transacciones, exportación PDF, métodos de pago
3. **CRM Básico** - Registro de clientes, historial de compras, segmentación por tipo (Persona Natural/Jurídica)
4. **Dashboard Analítico** - KPIs en tiempo real, gráficas de ventas, productos más vendidos, tendencias de ingresos
5. **Capacidades PWA** - Funcionamiento offline, instalación desde navegador, sincronización en segundo plano

## Requisitos Previos

- **Node.js** >= 18.x
- **PostgreSQL** >= 14.x
- **npm** >= 9.x
- **Git**

## Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/infradigital.git
cd infradigital
```

### 2. Configurar el Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL
```

Editar el archivo `.env`:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=infradigital
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
JWT_SECRET=tu_clave_secreta_jwt
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

### 3. Crear la base de datos

```bash
# En PostgreSQL
createdb infradigital
```

### 4. Poblar datos de ejemplo (Seed)

```bash
npm run seed
```

Esto creará:
- 2 usuarios (admin@infradigital.co / admin123, maria@infradigital.co / maria123)
- 18 productos típicos de negocio colombiano
- 10 clientes de ejemplo
- 10 facturas con ítems

### 5. Iniciar el Backend

```bash
# Modo desarrollo (con hot-reload)
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en `http://localhost:5000`  
Documentación API (Swagger): `http://localhost:5000/api-docs`

### 6. Configurar el Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Configurar variables de entorno (opcional)
# Por defecto conecta a http://localhost:5000/api
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```

### 7. Iniciar el Frontend

```bash
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## Credenciales de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@infradigital.co | admin123 |
| Usuario | maria@infradigital.co | maria123 |

## Estructura del Proyecto

```
infradigital/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuración de BD y Swagger
│   │   ├── controllers/     # Lógica de negocio
│   │   ├── middleware/       # Auth JWT, validación, errores
│   │   ├── models/           # Modelos Sequelize (User, Product, Client, Invoice...)
│   │   ├── routes/           # Endpoints API REST
│   │   ├── seeders/          # Datos de ejemplo
│   │   └── utils/            # Funciones auxiliares
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── index.html        # Shell HTML
│   │   ├── manifest.json     # PWA Manifest
│   │   └── sw.js             # Service Worker
│   ├── src/
│   │   ├── components/       # Componentes reutilizables (Layout, Card, Table, Modal...)
│   │   ├── context/          # AuthContext, AppContext
│   │   ├── hooks/            # Custom hooks (useOnlineStatus)
│   │   ├── pages/            # Páginas por módulo (Auth, Dashboard, Inventory, Invoices, Clients)
│   │   ├── services/         # API service, IndexedDB offline
│   │   ├── styles/           # Variables CSS, estilos globales
│   │   └── utils/            # Formatters (moneda colombiana, fechas)
│   └── package.json
├── .gitignore
└── README.md
```

## API Endpoints

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/profile` | Obtener perfil |

### Productos (Inventario)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/products` | Listar productos (paginado, búsqueda, filtros) |
| GET | `/api/products/:id` | Detalle de producto |
| POST | `/api/products` | Crear producto |
| PUT | `/api/products/:id` | Actualizar producto |
| DELETE | `/api/products/:id` | Eliminar producto (soft delete) |
| POST | `/api/products/:id/adjust-stock` | Ajustar stock |
| GET | `/api/products/alerts/low-stock` | Productos con bajo stock |

### Clientes (CRM)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/clients` | Listar clientes |
| GET | `/api/clients/:id` | Detalle de cliente |
| POST | `/api/clients` | Crear cliente |
| PUT | `/api/clients/:id` | Actualizar cliente |
| DELETE | `/api/clients/:id` | Eliminar cliente |
| GET | `/api/clients/stats/top` | Top clientes por compras |

### Facturas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/invoices` | Listar facturas |
| GET | `/api/invoices/:id` | Detalle de factura |
| POST | `/api/invoices` | Crear factura (con cálculo IVA 19%) |
| PATCH | `/api/invoices/:id/status` | Cambiar estado |
| GET | `/api/invoices/client/:clientId` | Facturas por cliente |

### Dashboard
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Resumen general |
| GET | `/api/dashboard/sales-chart` | Ventas mensuales |
| GET | `/api/dashboard/top-products` | Productos más vendidos |
| GET | `/api/dashboard/revenue-by-payment` | Ingresos por método de pago |
| GET | `/api/dashboard/inventory-alerts` | Alertas de inventario |
| GET | `/api/dashboard/sales-trend` | Tendencia de ventas diaria |

## Características PWA

- **Funcionamiento Offline**: Service Workers con estrategia Cache-First para recursos estáticos y Network-First para datos dinámicos
- **Instalable**: Web App Manifest permite instalar la app desde el navegador
- **Sincronización**: Background Sync para reenviar peticiones fallidas al recuperar conexión
- **IndexedDB**: Almacenamiento local de datos críticos para acceso offline
- **Responsiva**: Diseño adaptable a cualquier dispositivo (móvil, tablet, escritorio)

## Nivel de Madurez Tecnológica (TRL)

El proyecto alcanza un **TRL 6** - Prototipo funcional validado en condiciones cercanas al entorno operativo real de una MiPyME.

## Alineación con ODS

**ODS 9 - Industria, Innovación e Infraestructura**
- Meta 9.3: Acceso de pequeñas industrias a servicios tecnológicos
- Meta 9.b: Desarrollo de tecnología e innovación nacional

## Licencia

Este proyecto fue desarrollado como trabajo de grado para el programa de Ingeniería de Sistemas de la UNAD.

## Autor

**Luis Rojas**  
Programa de Ingeniería de Sistemas  
Universidad Nacional Abierta y a Distancia (UNAD)  
Colombia, 2026
