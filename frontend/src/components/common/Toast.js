import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';
import './Toast.css';

const iconMap = {
  success: FiCheckCircle,
  error: FiAlertCircle,
  warning: FiAlertTriangle,
  info: FiInfo,
};

const Toast = ({ notification, onClose }) => {
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const animFrameRef = useRef(null);

  var type = notification.type || 'info';
  var Icon = iconMap[type] || FiInfo;
  var autoClose = notification.autoClose;
  var hasAutoClose = typeof autoClose === 'number' && autoClose > 0;

  const handleClose = useCallback(function () {
    setExiting(true);
    setTimeout(function () {
      if (onClose) onClose(notification.id);
    }, 300);
  }, [notification.id, onClose]);

  useEffect(function () {
    if (!hasAutoClose) return;

    startTimeRef.current = Date.now();

    function tick() {
      var elapsed = Date.now() - startTimeRef.current;
      var remaining = Math.max(0, 100 - (elapsed / autoClose) * 100);
      setProgress(remaining);

      if (remaining > 0) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    }

    animFrameRef.current = requestAnimationFrame(tick);

    timerRef.current = setTimeout(function () {
      handleClose();
    }, autoClose);

    return function () {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [hasAutoClose, autoClose, handleClose]);

  var className = 'toast toast--' + type;
  if (exiting) className += ' toast--exiting';

  return (
    <div className={className} role="alert">
      <div className="toast__body">
        <div className={'toast__icon toast__icon--' + type}>
          <Icon size={20} />
        </div>
        <div className="toast__content">
          {notification.title && (
            <h4 className="toast__title">{notification.title}</h4>
          )}
          {notification.message && (
            <p className="toast__message">{notification.message}</p>
          )}
        </div>
        <button
          className="toast__close"
          onClick={handleClose}
          aria-label="Cerrar notificación"
          type="button"
        >
          <FiX size={16} />
        </button>
      </div>
      {hasAutoClose && (
        <div className="toast__progress-track">
          <div
            className={'toast__progress-bar toast__progress-bar--' + type}
            style={{ width: progress + '%' }}
          />
        </div>
      )}
    </div>
  );
};

export default Toast;
