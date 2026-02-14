import React from 'react';
import './Loading.css';

const Loading = ({ size, fullPage }) => {
  const spinnerSize = size || 'md';
  const spinnerClass = ['loading-spinner', 'loading-spinner--' + spinnerSize].join(' ');

  if (fullPage) {
    return (
      <div className="loading-fullpage">
        <div className="loading-fullpage__content">
          <div className={spinnerClass}>
            <div className="loading-spinner__circle" />
          </div>
          <span className="loading-fullpage__text">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="loading-inline">
      <div className={spinnerClass}>
        <div className="loading-spinner__circle" />
      </div>
    </div>
  );
};

export default Loading;
