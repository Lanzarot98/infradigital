# Guía de Despliegue - InfraDigital

Guía paso a paso para desplegar InfraDigital en servicios cloud gratuitos.

| Componente | Servicio       | Plan    |
|------------|----------------|---------|
| Backend    | Render.com     | Free    |
| Frontend   | Vercel         | Free    |
| Base de datos | Render PostgreSQL | Free |

---

## 1. Despliegue en Render.com (Backend + PostgreSQL)

### 1.1 Crear la base de datos PostgreSQL

1. Crear una cuenta en [render.com](https://render.com) (se puede vincular con GitHub).
2. En el dashboard, hacer clic en **New** → **PostgreSQL**.
3. Configurar:
   - **Name**: `infradigital-db`
   - **Database**: `infradigital`
   - **Plan**: **Free**
4. Hacer clic en **Create Database**.
5. Una vez creada, ir a la sección **Info** y copiar las credenciales:
   - `Host`, `Port`, `Database`, `Username`, `Password`
   - También copiar la **Internal Database URL** (se usará si backend y BD están en la misma región).

### 1.2 Desplegar el backend (Web Service)

1. En el dashboard de Render, hacer clic en **New** → **Web Service**.
2. Conectar el repositorio de GitHub donde está el proyecto.
3. Configurar el servicio:
   - **Name**: `infradigital-api`
   - **Root Directory**: `backend`
   - **Runtime**: **Node**
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
   - **Plan**: **Free**
4. En la sección **Environment Variables**, agregar las siguientes variables:

   | Variable       | Valor                                      |
   |----------------|--------------------------------------------|
   | `NODE_ENV`     | `production`                               |
   | `PORT`         | `5000`                                     |
   | `DB_HOST`      | *(host de la BD creada en el paso 1.1)*    |
   | `DB_PORT`      | `5432`                                     |
   | `DB_NAME`      | `infradigital`                             |
   | `DB_USER`      | *(usuario de la BD)*                       |
   | `DB_PASSWORD`  | *(contraseña de la BD)*                    |
   | `JWT_SECRET`   | *(generar un valor seguro aleatorio)*      |
   | `CORS_ORIGIN`  | `https://infradigital.vercel.app`          |

5. Hacer clic en **Create Web Service**.
6. Esperar a que el despliegue termine (puede tomar 2-5 minutos).

> **Nota:** También se puede usar el archivo `render.yaml` (Blueprint) para configuración automática. En el dashboard de Render, ir a **Blueprints** → **New Blueprint Instance** y seleccionar el repositorio.

### 1.3 Ejecutar el seed de datos iniciales

1. En el dashboard del Web Service en Render, ir a la pestaña **Shell**.
2. Ejecutar el siguiente comando:
   ```bash
   node src/seeders/seed.js
   ```
3. Esto creará el usuario administrador y los datos de prueba.

### 1.4 Verificar el backend

- Acceder a `https://infradigital-api.onrender.com/health` — debe responder `{ "status": "ok" }`.
- Acceder a `https://infradigital-api.onrender.com/api-docs` para ver la documentación Swagger.

> **Importante:** En el plan gratuito de Render, el servicio entra en reposo después de 15 minutos de inactividad. La primera solicitud después del reposo puede tardar 30-60 segundos.

---

## 2. Despliegue en Vercel (Frontend)

### 2.1 Configurar e importar el proyecto

1. Crear una cuenta en [vercel.com](https://vercel.com) (se puede vincular con GitHub).
2. Hacer clic en **Add New** → **Project**.
3. Importar el repositorio de GitHub.
4. Configurar:
   - **Root Directory**: `frontend`
   - **Framework Preset**: **Create React App**
   - **Build Command**: `npm run build` *(se detecta automáticamente)*
   - **Output Directory**: `build` *(se detecta automáticamente)*

### 2.2 Variables de entorno

En la sección **Environment Variables**, agregar:

| Variable              | Valor                                                |
|-----------------------|------------------------------------------------------|
| `REACT_APP_API_URL`  | `https://infradigital-api.onrender.com/api`          |

### 2.3 Desplegar

1. Hacer clic en **Deploy**.
2. Esperar a que termine el build (aproximadamente 1-2 minutos).
3. Vercel asignará una URL como `https://infradigital.vercel.app`.

> **Nota:** Si la URL asignada es diferente a `infradigital.vercel.app`, actualizar la variable `CORS_ORIGIN` en Render con la URL correcta del frontend.

---

## 3. Verificación del despliegue

### 3.1 Backend

- [ ] Acceder a `https://infradigital-api.onrender.com/health` y verificar respuesta `ok`.
- [ ] Acceder a `https://infradigital-api.onrender.com/api-docs` y verificar documentación Swagger.
- [ ] En Swagger, probar el endpoint `POST /api/auth/login` con las credenciales de prueba.

### 3.2 Frontend

- [ ] Acceder a la URL de Vercel (ej. `https://infradigital.vercel.app`).
- [ ] Verificar que la página de login carga correctamente.
- [ ] Iniciar sesión con las credenciales de prueba:
  - **Usuario**: `admin@infradigital.co`
  - **Contraseña**: `Admin123!`
- [ ] Navegar por los módulos: Dashboard, Inventario, Clientes, Facturación.

### 3.3 Conectividad

- [ ] Verificar que el frontend se comunica correctamente con el backend (las solicitudes no dan error CORS).
- [ ] Verificar que los datos se cargan desde la base de datos.

---

## 4. Solución de problemas comunes

### El backend no inicia

- Revisar los logs en Render → Web Service → **Logs**.
- Verificar que todas las variables de entorno estén configuradas correctamente.
- Asegurarse de que la base de datos esté activa y accesible.

### Error CORS en el frontend

- Verificar que `CORS_ORIGIN` en Render coincida exactamente con la URL del frontend en Vercel (sin barra final `/`).
- Si se necesitan múltiples orígenes, separarlos por comas: `https://infradigital.vercel.app,http://localhost:3000`.

### La base de datos no tiene datos

- Ejecutar el seed desde la Shell de Render: `node src/seeders/seed.js`.
- Verificar que las credenciales de la BD sean correctas.

### El servicio tarda en responder

- El plan gratuito de Render pone los servicios en reposo tras 15 minutos de inactividad.
- La primera solicitud después del reposo puede tardar 30-60 segundos mientras el servicio se reactiva.

---

## 5. Arquitectura del despliegue

```
┌─────────────────────┐         ┌──────────────────────┐
│   Vercel (Frontend)  │  HTTPS  │  Render (Backend)    │
│                     │────────▶│                      │
│  React SPA          │         │  Express API         │
│  infradigital       │         │  infradigital-api    │
│  .vercel.app        │         │  .onrender.com       │
└─────────────────────┘         └──────────┬───────────┘
                                           │
                                           │ PostgreSQL
                                           ▼
                                ┌──────────────────────┐
                                │  Render PostgreSQL   │
                                │  infradigital-db     │
                                │  (Free tier)         │
                                └──────────────────────┘
```

---

## 6. Alternativa: Base de datos en Supabase

Si se prefiere usar [Supabase](https://supabase.com) en lugar de Render PostgreSQL:

1. Crear un proyecto en Supabase (plan gratuito).
2. Ir a **Settings** → **Database** y copiar las credenciales de conexión.
3. En las variables de entorno de Render, reemplazar las credenciales de la BD con las de Supabase:
   - `DB_HOST`: el host proporcionado por Supabase
   - `DB_PORT`: `5432` (o el indicado por Supabase, generalmente `6543` para pooling)
   - `DB_NAME`: `postgres`
   - `DB_USER`: `postgres`
   - `DB_PASSWORD`: la contraseña del proyecto en Supabase

> **Ventaja de Supabase:** La base de datos no entra en reposo como en el plan gratuito de Render (la BD gratuita de Render se pausa después de 90 días).
