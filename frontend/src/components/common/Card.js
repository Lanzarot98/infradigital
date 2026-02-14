import React from 'react';
import './Card.css';

const Card = ({ title, subtitle, children, className, headerAction }) => {
  const cardClass = ['card-component', className].filter(Boolean).join(' ');
  const hasHeader = title || subtitle || headerAction;

  return (
    <div className={cardClass}>
      {hasHeader && (
        <div className="card-component__header">
          <div className="card-component__header-text">
            {title && <h3 className="card-component__title">{title}</h3>}
            {subtitle && <p className="card-component__subtitle">{subtitle}</p>}
          </div>
          {headerAction && (
            <div className="card-component__header-action">{headerAction}</div>
          )}
        </div>
      )}
      <div className="card-component__body">{children}</div>
    </div>
  );
};

export default Card;
