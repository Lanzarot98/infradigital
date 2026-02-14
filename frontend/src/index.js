import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Registrar Service Worker para funcionalidad PWA y modo offline
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    // Notificar al usuario que hay una nueva versión disponible
    const confirmUpdate = window.confirm(
      'Hay una nueva versión de InfraDigital disponible. ¿Desea actualizar ahora?'
    );
    if (confirmUpdate && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  },
  onSuccess: () => {
    console.log('InfraDigital: Aplicación lista para uso sin conexión.');
  },
});

// Medir métricas de rendimiento (opcional: enviar a servicio de analíticas)
function sendToAnalytics(metric) {
  // Se puede enviar a un endpoint de analíticas en el futuro
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', metric.name, metric.value);
  }
}

reportWebVitals(sendToAnalytics);
