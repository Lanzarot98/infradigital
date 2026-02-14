/**
 * InfraDigital - Registro del Service Worker
 * 
 * Registra el Service Worker para habilitar funcionalidades PWA:
 * - Caché de recursos para uso sin conexión
 * - Sincronización en segundo plano
 * - Notificaciones de actualización
 */

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

/**
 * Registra el Service Worker
 * @param {Object} config - Configuración con callbacks onUpdate y onSuccess
 */
export function register(config) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);

    // El service worker no funcionará si PUBLIC_URL está en un origen diferente
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

      if (isLocalhost) {
        // En localhost, verificar si el SW existe y es válido
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'InfraDigital: La aplicación está siendo servida desde caché por un Service Worker. ' +
            'Para más información, visita https://cra.link/PWA'
          );
        });
      } else {
        // En producción, registrar directamente
        registerValidSW(swUrl, config);
      }
    });
  }
}

/**
 * Registra un Service Worker válido
 */
function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('InfraDigital: Service Worker registrado exitosamente.');

      // Verificar actualizaciones periódicamente (cada 60 minutos)
      setInterval(() => {
        registration.update();
        console.log('InfraDigital: Verificando actualizaciones del Service Worker...');
      }, 1000 * 60 * 60);

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Nuevo contenido disponible; ejecutar callback de actualización
              console.log(
                'InfraDigital: Nuevo contenido disponible. Se actualizará al cerrar todas las pestañas.'
              );

              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // Todo el contenido ha sido precacheado por primera vez
              console.log('InfraDigital: Contenido cacheado para uso sin conexión.');

              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('InfraDigital: Error al registrar el Service Worker:', error);
    });
}

/**
 * Verificar si el Service Worker es válido (para localhost)
 */
function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No se encontró Service Worker, probablemente una app diferente
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service Worker encontrado, proceder con registro
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log(
        'InfraDigital: Sin conexión a internet. La aplicación se ejecuta en modo offline.'
      );
    });
}

/**
 * Desregistrar el Service Worker
 */
export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log('InfraDigital: Service Worker desregistrado.');
      })
      .catch((error) => {
        console.error('InfraDigital: Error al desregistrar Service Worker:', error.message);
      });
  }
}

/**
 * Enviar mensaje al Service Worker activo
 * @param {Object} message - Mensaje a enviar
 */
export function sendMessageToSW(message) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
}

/**
 * Verificar si hay una actualización disponible
 */
export async function checkForUpdates() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
  }
}
