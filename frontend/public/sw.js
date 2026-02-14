/**
 * InfraDigital - Service Worker
 * 
 * Estrategias de cache:
 * - Cache-First para recursos estaticos (JS, CSS, imagenes, fuentes)
 * - Network-First para llamadas API con respaldo a cache
 * - Sincronizacion en segundo plano para operaciones fallidas
 * - Respaldo offline para navegacion
 */

const CACHE_NAME = 'infradigital-v1';
const API_CACHE_NAME = 'infradigital-api-v1';
const SYNC_QUEUE_NAME = 'infradigital-sync-queue';

// Recursos del shell de la aplicacion para precachear
const APP_SHELL_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/static/js/bundle.js',
  '/static/css/main.css',
];

// Patrones de URL para estrategias de cache
const API_URL_PATTERN = /\/api\//;
const STATIC_EXTENSIONS = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/;
const GOOGLE_FONTS_PATTERN = /fonts\.(googleapis|gstatic)\.com/;

// ============================================
// EVENTO INSTALL - Precachear shell de la app
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker - InfraDigital v1');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precacheando recursos del shell de la aplicacion');
        return Promise.allSettled(
          APP_SHELL_RESOURCES.map((url) =>
            cache.add(url).catch((err) => {
              console.warn('[SW] No se pudo precachear: ' + url, err.message);
            })
          )
        );
      })
      .then(() => {
        console.log('[SW] Precache completado');
        return self.skipWaiting();
      })
  );
});

// ============================================
// EVENTO ACTIVATE - Limpiar caches obsoletos
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker - InfraDigital v1');

  const cachesToKeep = [CACHE_NAME, API_CACHE_NAME];

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cachesToKeep.includes(cacheName)) {
              console.log('[SW] Eliminando cache obsoleto: ' + cacheName);
              return caches.delete(cacheName);
            }
            return null;
          })
        );
      })
      .then(() => {
        console.log('[SW] Limpieza de caches completada');
        return self.clients.claim();
      })
  );
});

// ============================================
// EVENTO FETCH - Estrategias de cache
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar peticiones que no son GET para cache
  if (request.method !== 'GET') {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      event.respondWith(handleMutationRequest(request));
    }
    return;
  }

  // Estrategia segun tipo de recurso
  if (API_URL_PATTERN.test(url.pathname)) {
    event.respondWith(networkFirstStrategy(request, API_CACHE_NAME));
  } else if (STATIC_EXTENSIONS.test(url.pathname) || GOOGLE_FONTS_PATTERN.test(url.hostname)) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
  } else {
    event.respondWith(networkFirstStrategy(request, CACHE_NAME));
  }
});

// ============================================
// ESTRATEGIA CACHE-FIRST
// ============================================
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      updateCacheInBackground(request, cacheName);
      return cachedResponse;
    }

    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.warn('[SW] Error en Cache-First:', error.message);
    const fallback = await caches.match(request);
    return fallback || createOfflineResponse();
  }
}

// ============================================
// ESTRATEGIA NETWORK-FIRST
// ============================================
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.warn('[SW] Red no disponible, buscando en cache:', request.url);

    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Si es navegacion, devolver index.html (SPA)
    if (request.mode === 'navigate' || (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
      const indexResponse = await caches.match('/index.html');
      if (indexResponse) {
        return indexResponse;
      }
    }

    // Si es API sin cache, devolver respuesta JSON offline
    if (API_URL_PATTERN.test(new URL(request.url).pathname)) {
      return createOfflineApiResponse();
    }

    return createOfflineResponse();
  }
}

// ============================================
// MANEJO DE PETICIONES DE ESCRITURA (POST/PUT/DELETE)
// ============================================
async function handleMutationRequest(request) {
  try {
    const response = await fetch(request.clone());
    return response;
  } catch (error) {
    console.warn('[SW] Peticion de escritura fallida, encolando para sincronizacion:', request.url);

    await saveToSyncQueue(request);

    return new Response(
      JSON.stringify({
        success: true,
        offline: true,
        message: 'Operacion guardada. Se sincronizara automaticamente al recuperar la conexion.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// ============================================
// COLA DE SINCRONIZACION EN SEGUNDO PLANO
// ============================================
async function saveToSyncQueue(request) {
  try {
    const body = await request.clone().text();
    const syncData = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: body || null,
      timestamp: Date.now(),
    };

    const clients = await self.clients.matchAll();
    for (const client of clients) {
      client.postMessage({
        type: 'SAVE_SYNC_REQUEST',
        payload: syncData,
      });
    }

    if ('sync' in self.registration) {
      await self.registration.sync.register(SYNC_QUEUE_NAME);
      console.log('[SW] Sincronizacion en segundo plano registrada');
    }
  } catch (error) {
    console.error('[SW] Error al guardar en cola de sincronizacion:', error);
  }
}

// ============================================
// EVENTO SYNC - Sincronizacion en segundo plano
// ============================================
self.addEventListener('sync', (event) => {
  console.log('[SW] Evento de sincronizacion recibido:', event.tag);

  if (event.tag === SYNC_QUEUE_NAME) {
    event.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue() {
  console.log('[SW] Procesando cola de sincronizacion...');

  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage({
      type: 'PROCESS_SYNC_QUEUE',
    });
  }
}

// ============================================
// EVENTO MESSAGE - Comunicacion con la app
// ============================================
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      console.log('[SW] Saltando espera, activando nueva version');
      self.skipWaiting();
      break;

    case 'SYNC_COMPLETE':
      console.log('[SW] Sincronizacion completada para:', payload && payload.count, 'elementos');
      notifyClients({
        type: 'SYNC_STATUS',
        payload: { synced: true, count: (payload && payload.count) || 0 },
      });
      break;

    case 'CLEAR_CACHE':
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
        console.log('[SW] Todos los caches eliminados');
      });
      break;

    default:
      break;
  }
});

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function updateCacheInBackground(request, cacheName) {
  fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(cacheName).then((cache) => {
          cache.put(request, response);
        });
      }
    })
    .catch(() => {});
}

function createOfflineResponse() {
  const html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>InfraDigital - Sin Conexion</title><style>body{font-family:"Inter",-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);color:#fff}.container{text-align:center;padding:2rem;max-width:480px}h1{font-size:2rem;margin-bottom:.5rem;font-weight:800}p{font-size:1rem;opacity:.9;line-height:1.6;margin-bottom:1.5rem}.icon{font-size:4rem;margin-bottom:1rem}button{background:rgba(255,255,255,.2);color:#fff;border:2px solid rgba(255,255,255,.4);padding:.75rem 2rem;border-radius:.5rem;font-size:1rem;cursor:pointer;font-family:inherit;transition:all .2s}button:hover{background:rgba(255,255,255,.3);border-color:rgba(255,255,255,.6)}</style></head><body><div class="container"><div class="icon">&#128268;</div><h1>Sin Conexion</h1><p>No se pudo conectar al servidor. Verifica tu conexion a internet e intenta nuevamente.</p><button onclick="window.location.reload()">Reintentar</button></div></body></html>';

  return new Response(html, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function createOfflineApiResponse() {
  return new Response(
    JSON.stringify({
      success: false,
      offline: true,
      message: 'Sin conexion a internet. Los datos mostrados pueden no estar actualizados.',
    }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach((client) => {
    client.postMessage(message);
  });
}

console.log('[SW] Service Worker de InfraDigital cargado');