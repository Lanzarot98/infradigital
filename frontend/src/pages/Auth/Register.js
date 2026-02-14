import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiShield, FiUserPlus } from 'react-icons/fi';
import { AuthContext } from '../../context/AuthContext';
import Alert from '../../components/common/Alert';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const { register, loading, error, clearError, isAuthenticated } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({
    level: 0,
    label: '',
    color: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  var calculateStrength = useCallback(function (password) {
    if (!password) {
      return { level: 0, label: '', color: '' };
    }

    var score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { level: 1, label: 'Débil', color: 'var(--danger)' };
    if (score <= 2) return { level: 2, label: 'Regular', color: 'var(--warning)' };
    if (score <= 3) return { level: 3, label: 'Buena', color: 'var(--accent)' };
    if (score <= 4) return { level: 4, label: 'Fuerte', color: 'var(--secondary)' };
    return { level: 5, label: 'Muy fuerte', color: 'var(--success)' };
  }, []);

  var handleChange = function (e) {
    var fieldName = e.target.name;
    var fieldValue = e.target.value;

    setFormData(function (prev) {
      return Object.assign({}, prev, { [fieldName]: fieldValue });
    });

    if (validationErrors[fieldName]) {
      setValidationErrors(function (prev) {
        var next = Object.assign({}, prev);
        delete next[fieldName];
        return next;
      });
    }

    if (fieldName === 'password') {
      setPasswordStrength(calculateStrength(fieldValue));
    }
  };

  var validate = function () {
    var errors = {};

    if (!formData.name.trim()) {
      errors.name = 'El nombre es obligatorio';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.email.trim()) {
      errors.email = 'El correo electrónico es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Ingresa un correo electrónico válido';
    }

    if (!formData.password) {
      errors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  var handleSubmit = async function (e) {
    e.preventDefault();
    clearError();

    if (!validate()) return;

    var result = await register({
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
    });

    if (result.success) {
      navigate('/dashboard', { replace: true });
    }
  };

  var strengthSegments = [1, 2, 3, 4, 5];

  return (
    <div className="register-page">
      <div className="register-page__bg-shapes">
        <div className="register-page__shape register-page__shape--1" />
        <div className="register-page__shape register-page__shape--2" />
        <div className="register-page__shape register-page__shape--3" />
      </div>

      <div className="register-container">
        <div className="register-card">
          <div className="register-header">
            <div className="register-logo">
              <div className="register-logo-icon">
                <span>ID</span>
              </div>
              <h1 className="register-brand">InfraDigital</h1>
            </div>
            <p className="register-subtitle">Crea tu cuenta para comenzar</p>
          </div>

          {error && (
            <div className="register-alert">
              <Alert type="error" message={error} onClose={clearError} />
            </div>
          )}

          <form className="register-form" onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label className="auth-form-label" htmlFor="reg-name">
                Nombre completo <span className="auth-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <FiUser className="auth-input-icon" size={18} />
                <input
                  id="reg-name"
                  name="name"
                  type="text"
                  className={
                    'auth-form-input' +
                    (validationErrors.name ? ' auth-form-input--error' : '')
                  }
                  placeholder="Tu nombre completo"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="name"
                />
              </div>
              {validationErrors.name && (
                <span className="auth-field-error">{validationErrors.name}</span>
              )}
            </div>

            <div className="auth-form-group">
              <label className="auth-form-label" htmlFor="reg-email">
                Correo electrónico <span className="auth-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <FiMail className="auth-input-icon" size={18} />
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  className={
                    'auth-form-input' +
                    (validationErrors.email ? ' auth-form-input--error' : '')
                  }
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              {validationErrors.email && (
                <span className="auth-field-error">{validationErrors.email}</span>
              )}
            </div>

            <div className="auth-form-group">
              <label className="auth-form-label" htmlFor="reg-password">
                Contraseña <span className="auth-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <FiLock className="auth-input-icon" size={18} />
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  className={
                    'auth-form-input' +
                    (validationErrors.password ? ' auth-form-input--error' : '')
                  }
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
              {formData.password && (
                <div className="password-strength">
                  <div className="password-strength__bar">
                    {strengthSegments.map(function (level) {
                      var isActive = level <= passwordStrength.level;
                      var segmentClass =
                        'password-strength__segment' +
                        (isActive ? ' password-strength__segment--active' : '');
                      var segmentStyle = isActive
                        ? { backgroundColor: passwordStrength.color }
                        : {};
                      return (
                        <div
                          key={level}
                          className={segmentClass}
                          style={segmentStyle}
                        />
                      );
                    })}
                  </div>
                  <span
                    className="password-strength__label"
                    style={{ color: passwordStrength.color }}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
              )}
              {validationErrors.password && (
                <span className="auth-field-error">
                  {validationErrors.password}
                </span>
              )}
            </div>

            <div className="auth-form-group">
              <label className="auth-form-label" htmlFor="reg-confirm">
                Confirmar contraseña <span className="auth-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <FiShield className="auth-input-icon" size={18} />
                <input
                  id="reg-confirm"
                  name="confirmPassword"
                  type="password"
                  className={
                    'auth-form-input' +
                    (validationErrors.confirmPassword
                      ? ' auth-form-input--error'
                      : '')
                  }
                  placeholder="Repite tu contraseña"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
              {validationErrors.confirmPassword && (
                <span className="auth-field-error">
                  {validationErrors.confirmPassword}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-btn-loading">
                  <span className="auth-spinner" />
                  Creando cuenta...
                </span>
              ) : (
                <span className="auth-btn-content">
                  <FiUserPlus size={18} />
                  Crear Cuenta
                </span>
              )}
            </button>
          </form>

          <div className="register-footer">
            <p>
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="auth-link">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>

        <p className="auth-copyright">
          &copy; {new Date().getFullYear()} InfraDigital — Todos los derechos
          reservados
        </p>
      </div>
    </div>
  );
};

export default Register;
