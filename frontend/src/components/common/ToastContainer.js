import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import Toast from './Toast';
import './ToastContainer.css';

const MAX_VISIBLE = 5;

const ToastContainer = () => {
  const { notifications, removeNotification } = useContext(AppContext);

  var visibleToasts = notifications.slice(0, MAX_VISIBLE);

  if (visibleToasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-label="Notificaciones">
      {visibleToasts.map(function (notification) {
        return (
          <Toast
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        );
      })}
    </div>
  );
};

export default ToastContainer;
