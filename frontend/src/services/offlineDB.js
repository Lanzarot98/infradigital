import { openDB } from 'idb';

/**
 * InfraDigital - Servicio de Base de Datos Offline (IndexedDB)
 *
 * Utiliza la libreria 'idb' para interactuar con IndexedDB de forma sencilla.
 * Almacena datos localmente para acceso sin conexion:
 * - Productos: cache del inventario
 * - Clientes: cache del directorio de clientes
 * - Facturas: cache de facturas recientes
 * - PendingSync: cola de operaciones pendientes de sincronizacion
 */

const DB_NAME = 'infradigital-offline';
const DB_VERSION = 1;

/**
 * Inicializar y obtener la instancia de la base de datos
 */
function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Store de productos
      if (!db.objectStoreNames.contains('products')) {
        const productStore = db.createObjectStore('products', { keyPath: '_id' });
        productStore.createIndex('nombre', 'nombre', { unique: false });
        productStore.createIndex('categoria', 'categoria', { unique: false });
        productStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // Store de clientes
      if (!db.objectStoreNames.contains('clients')) {
        const clientStore = db.createObjectStore('clients', { keyPath: '_id' });
        clientStore.createIndex('nombre', 'nombre', { unique: false });
        clientStore.createIndex('documento', 'documento', { unique: false });
        clientStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // Store de facturas
      if (!db.objectStoreNames.contains('invoices')) {
        const invoiceStore = db.createObjectStore('invoices', { keyPath: '_id' });
        invoiceStore.createIndex('numero', 'numero', { unique: false });
        invoiceStore.createIndex('estado', 'estado', { unique: false });
        invoiceStore.createIndex('fecha', 'fecha', { unique: false });
        invoiceStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // Store de operaciones pendientes de sincronizacion
      if (!db.objectStoreNames.contains('pendingSync')) {
        const syncStore = db.createObjectStore('pendingSync', { keyPath: 'id' });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncStore.createIndex('type', 'type', { unique: false });
      }
    },
  });
}

// ============================================
// OPERACIONES DE PRODUCTOS
// ============================================

/**
 * Guardar lista de productos en IndexedDB
 * Reemplaza todos los productos existentes
 * @param {Array} products - Lista de productos
 */
export async function saveProducts(products) {
  try {
    const db = await getDB();
    const tx = db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');

    // Limpiar store existente y agregar nuevos datos
    await store.clear();
    for (const product of products) {
      await store.put({
        ...product,
        _offlineCached: new Date().toISOString(),
      });
    }

    await tx.done;
    console.log('OfflineDB: ' + products.length + ' productos guardados en cache local');
  } catch (error) {
    console.error('OfflineDB: Error al guardar productos:', error);
  }
}

/**
 * Obtener todos los productos almacenados localmente
 * @returns {Array} Lista de productos
 */
export async function getProducts() {
  try {
    const db = await getDB();
    const products = await db.getAll('products');
    return products || [];
  } catch (error) {
    console.error('OfflineDB: Error al obtener productos:', error);
    return [];
  }
}

/**
 * Obtener un producto por ID desde cache local
 * @param {string} id - ID del producto
 * @returns {Object|null} Producto encontrado o null
 */
export async function getProductById(id) {
  try {
    const db = await getDB();
    return await db.get('products', id) || null;
  } catch (error) {
    console.error('OfflineDB: Error al obtener producto:', error);
    return null;
  }
}

// ============================================
// OPERACIONES DE CLIENTES
// ============================================

/**
 * Guardar lista de clientes en IndexedDB
 * @param {Array} clients - Lista de clientes
 */
export async function saveClients(clients) {
  try {
    const db = await getDB();
    const tx = db.transaction('clients', 'readwrite');
    const store = tx.objectStore('clients');

    await store.clear();
    for (const client of clients) {
      await store.put({
        ...client,
        _offlineCached: new Date().toISOString(),
      });
    }

    await tx.done;
    console.log('OfflineDB: ' + clients.length + ' clientes guardados en cache local');
  } catch (error) {
    console.error('OfflineDB: Error al guardar clientes:', error);
  }
}

/**
 * Obtener todos los clientes almacenados localmente
 * @returns {Array} Lista de clientes
 */
export async function getClients() {
  try {
    const db = await getDB();
    const clients = await db.getAll('clients');
    return clients || [];
  } catch (error) {
    console.error('OfflineDB: Error al obtener clientes:', error);
    return [];
  }
}

/**
 * Obtener un cliente por ID desde cache local
 * @param {string} id - ID del cliente
 * @returns {Object|null} Cliente encontrado o null
 */
export async function getClientById(id) {
  try {
    const db = await getDB();
    return await db.get('clients', id) || null;
  } catch (error) {
    console.error('OfflineDB: Error al obtener cliente:', error);
    return null;
  }
}

// ============================================
// OPERACIONES DE FACTURAS
// ============================================

/**
 * Guardar lista de facturas en IndexedDB
 * @param {Array} invoices - Lista de facturas
 */
export async function saveInvoices(invoices) {
  try {
    const db = await getDB();
    const tx = db.transaction('invoices', 'readwrite');
    const store = tx.objectStore('invoices');

    await store.clear();
    for (const invoice of invoices) {
      await store.put({
        ...invoice,
        _offlineCached: new Date().toISOString(),
      });
    }

    await tx.done;
    console.log('OfflineDB: ' + invoices.length + ' facturas guardadas en cache local');
  } catch (error) {
    console.error('OfflineDB: Error al guardar facturas:', error);
  }
}

/**
 * Obtener todas las facturas almacenadas localmente
 * @returns {Array} Lista de facturas
 */
export async function getInvoices() {
  try {
    const db = await getDB();
    const invoices = await db.getAll('invoices');
    return invoices || [];
  } catch (error) {
    console.error('OfflineDB: Error al obtener facturas:', error);
    return [];
  }
}

/**
 * Obtener una factura por ID desde cache local
 * @param {string} id - ID de la factura
 * @returns {Object|null} Factura encontrada o null
 */
export async function getInvoiceById(id) {
  try {
    const db = await getDB();
    return await db.get('invoices', id) || null;
  } catch (error) {
    console.error('OfflineDB: Error al obtener factura:', error);
    return null;
  }
}

// ============================================
// OPERACIONES DE SINCRONIZACION PENDIENTE
// ============================================

/**
 * Agregar una operacion a la cola de sincronizacion
 * @param {Object} syncItem - { url, method, headers, body, type }
 */
export async function addPendingSync(syncItem) {
  try {
    const db = await getDB();
    await db.put('pendingSync', {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      timestamp: Date.now(),
      retryCount: 0,
      ...syncItem,
    });
    console.log('OfflineDB: Operacion pendiente agregada a la cola de sincronizacion');
  } catch (error) {
    console.error('OfflineDB: Error al agregar operacion pendiente:', error);
  }
}

/**
 * Obtener todas las operaciones pendientes de sincronizacion
 * Ordenadas por timestamp (mas antiguas primero)
 * @returns {Array} Lista de operaciones pendientes
 */
export async function getPendingSync() {
  try {
    const db = await getDB();
    const items = await db.getAllFromIndex('pendingSync', 'timestamp');
    return items || [];
  } catch (error) {
    console.error('OfflineDB: Error al obtener operaciones pendientes:', error);
    return [];
  }
}

/**
 * Eliminar una operacion pendiente por ID (despues de sincronizar)
 * @param {string} id - ID de la operacion
 */
export async function removePendingSync(id) {
  try {
    const db = await getDB();
    await db.delete('pendingSync', id);
  } catch (error) {
    console.error('OfflineDB: Error al eliminar operacion pendiente:', error);
  }
}

/**
 * Limpiar toda la cola de sincronizacion
 */
export async function clearPendingSync() {
  try {
    const db = await getDB();
    const tx = db.transaction('pendingSync', 'readwrite');
    await tx.objectStore('pendingSync').clear();
    await tx.done;
    console.log('OfflineDB: Cola de sincronizacion limpiada');
  } catch (error) {
    console.error('OfflineDB: Error al limpiar cola de sincronizacion:', error);
  }
}

/**
 * Obtener el conteo de operaciones pendientes
 * @returns {number} Cantidad de operaciones pendientes
 */
export async function getPendingSyncCount() {
  try {
    const db = await getDB();
    return await db.count('pendingSync');
  } catch (error) {
    console.error('OfflineDB: Error al contar operaciones pendientes:', error);
    return 0;
  }
}

// ============================================
// UTILIDADES GENERALES
// ============================================

/**
 * Limpiar toda la base de datos offline
 */
export async function clearAllData() {
  try {
    const db = await getDB();
    const storeNames = ['products', 'clients', 'invoices', 'pendingSync'];

    for (const storeName of storeNames) {
      const tx = db.transaction(storeName, 'readwrite');
      await tx.objectStore(storeName).clear();
      await tx.done;
    }

    console.log('OfflineDB: Todos los datos locales eliminados');
  } catch (error) {
    console.error('OfflineDB: Error al limpiar datos:', error);
  }
}

/**
 * Obtener estadisticas de almacenamiento local
 * @returns {Object} Conteo de registros por store
 */
export async function getStorageStats() {
  try {
    const db = await getDB();
    return {
      products: await db.count('products'),
      clients: await db.count('clients'),
      invoices: await db.count('invoices'),
      pendingSync: await db.count('pendingSync'),
    };
  } catch (error) {
    console.error('OfflineDB: Error al obtener estadisticas:', error);
    return { products: 0, clients: 0, invoices: 0, pendingSync: 0 };
  }
}

export default {
  // Productos
  saveProducts,
  getProducts,
  getProductById,
  // Clientes
  saveClients,
  getClients,
  getClientById,
  // Facturas
  saveInvoices,
  getInvoices,
  getInvoiceById,
  // Sincronizacion
  addPendingSync,
  getPendingSync,
  removePendingSync,
  clearPendingSync,
  getPendingSyncCount,
  // Utilidades
  clearAllData,
  getStorageStats,
};