import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';
import { AuthContext } from '../../context/AuthContext';
import Alert from '../../components/common/Alert';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, loading, error, clearError, isAuthenticated } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleChange = (e) => {
    var name = e.target.name;
    var value = e.target.value;
    setFormData(function (prev) {
      return Object.assign({}, prev, { [name]: value });
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    var result = await login(formData.email, formData.password);
    if (result.success) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__bg-shapes">
        <div className="login-page__shape login-page__shape--1" />
        <div className="login-page__shape login-page__shape--2" />
        <div className="login-page__shape login-page__shape--3" />
      </div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <div className="login-logo-icon">
                <span>ID</span>
              </div>
              <h1 className="login-brand">InfraDigital</h1>
            </div>
            <p className="login-subtitle">Gestión Empresarial para MiPyMEs</p>
          </div>

          {error && (
            <div className="login-alert">
              <Alert type="error" message={error} onClose={clearError} />
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label className="auth-form-label" htmlFor="login-email">
                Correo electrónico
              </label>
              <div className="auth-input-wrapper">
                <FiMail className="auth-input-icon" size={18} />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  className="auth-form-input"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label className="auth-form-label" htmlFor="login-password">
                Contraseña
              </label>
              <div className="auth-input-wrapper">
                <FiLock className="auth-input-icon" size={18} />
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  className="auth-form-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading || !formData.email || !formData.password}
            >
              {loading ? (
                <span className="auth-btn-loading">
                  <span className="auth-spinner" />
                  Iniciando sesión...
                </span>
              ) : (
                <span className="auth-btn-content">
                  <FiLogIn size={18} />
                  Iniciar Sesión
                </span>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className="auth-link">
                Crear cuenta
              </Link>
            </p>
          </div>
        </div>

        <p className="auth-copyright">
          &copy; {new Date().getFullYear()} InfraDigital — Todos los derechos reservados
        </p>
      </div>
    </div>
  );
};

export default Login;
