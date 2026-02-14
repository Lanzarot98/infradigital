import React, { useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { FiX } from 'react-icons/fi';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, children, footer, size }) => {
  const modalSize = size || 'md';

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const sizeClass = 'modal__content--' + modalSize;

  return ReactDOM.createPortal(
    <div className="modal__backdrop" onClick={handleBackdropClick}>
      <div className={['modal__content', sizeClass].join(' ')} role="dialog" aria-modal="true">
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button
            className="modal__close-btn"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <FiX size={20} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
