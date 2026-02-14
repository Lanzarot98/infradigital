import React, { useEffect, useCallback } from 'react';
import { FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';
import './Alert.css';

const iconMap = {
  success: FiCheckCircle,
  error: FiAlertCircle,
  warning: FiAlertTriangle,
  info: FiInfo,
};

const Alert = ({ type, message, onClose, autoClose }) => {
  const alertType = type || 'info';
  const Icon = iconMap[alertType] || FiInfo;

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (autoClose && autoClose > 0) {
      const timer = setTimeout(handleClose, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, handleClose]);

  const alertClass = ['alert', 'alert--' + alertType].join(' ');

  return (
    <div className={alertClass} role="alert">
      <div className="alert__icon">
        <Icon size={20} />
      </div>
      <p className="alert__message">{message}</p>
      {onClose && (
        <button
          className="alert__close"
          onClick={handleClose}
          aria-label="Cerrar alerta"
        >
          <FiX size={16} />
        </button>
      )}
    </div>
  );
};

export default Alert;
