import React, { useContext, useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FiMenu, FiBell, FiWifi, FiWifiOff, FiChevronDown, FiLogOut, FiUser, FiX, FiInfo } from 'react-icons/fi';
import { AppContext } from '../../context/AppContext';
import { AuthContext } from '../../context/AuthContext';
import './Header.css';

const routeTitles = {
  '/dashboard': 'Dashboard',
  '/inventory': 'Inventario',
  '/invoices': 'Facturación',
  '/clients': 'Clientes',
  '/audit': 'Auditoría',
  '/users': 'Gestión de Usuarios',
};

const Header = () => {
  const location = useLocation();
  const { sidebarOpen, setSidebarOpen, isOnline, notifications, removeNotification, clearNotifications } = useContext(AppContext);
  const { user, logout } = useContext(AuthContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const getPageTitle = () => {
    const path = location.pathname;
    for (const [route, title] of Object.entries(routeTitles)) {
      if (path === route || path.startsWith(route + '/')) {
        return title;
      }
    }
    return 'InfraDigital';
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
  };

  const notifCount = notifications ? notifications.length : 0;

  return (
    <header className="header">
      <div className="header__left">
        <button
          className="header__menu-btn"
          onClick={handleToggleSidebar}
          aria-label="Abrir menú"
        >
          <FiMenu size={22} />
        </button>
        <h1 className="header__title">{getPageTitle()}</h1>
      </div>

      <div className="header__right">
        <div className={['header__status', isOnline ? 'header__status--online' : 'header__status--offline'].join(' ')}>
          {isOnline ? <FiWifi size={16} /> : <FiWifiOff size={16} />}
          <span className="header__status-text">
            {isOnline ? 'En línea' : 'Sin conexión'}
          </span>
        </div>

        {/* Notificaciones */}
        <div className="header__notif-wrapper" ref={notifRef}>
          <button
            className="header__notification-btn"
            aria-label="Notificaciones"
            onClick={() => setNotifOpen(!notifOpen)}
          >
            <FiBell size={20} />
            {notifCount > 0 && (
              <span className="header__notification-badge">{notifCount}</span>
            )}
          </button>

          {notifOpen && (
            <div className="header__notif-dropdown">
              <div className="header__notif-header">
                <span className="header__notif-title">Notificaciones</span>
                {notifCount > 0 && (
                  <button
                    className="header__notif-clear"
                    onClick={() => { clearNotifications(); setNotifOpen(false); }}
                  >
                    Limpiar
                  </button>
                )}
              </div>
              <div className="header__notif-list">
                {notifCount > 0 ? (
                  notifications.slice(0, 10).map((notif) => (
                    <div key={notif.id} className={'header__notif-item header__notif-item--' + (notif.type || 'info')}>
                      <FiInfo size={16} className="header__notif-icon" />
                      <div className="header__notif-content">
                        {notif.title && <strong className="header__notif-item-title">{notif.title}</strong>}
                        <span className="header__notif-msg">{notif.message}</span>
                      </div>
                      <button
                        className="header__notif-dismiss"
                        onClick={(e) => { e.stopPropagation(); removeNotification(notif.id); }}
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="header__notif-empty">
                    <FiBell size={24} />
                    <p>No hay notificaciones</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="header__user-menu" ref={dropdownRef}>
          <button
            className="header__user-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="header__user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="header__user-name">{user?.name || 'Usuario'}</span>
            <FiChevronDown
              size={16}
              className={['header__chevron', dropdownOpen ? 'header__chevron--open' : ''].join(' ')}
            />
          </button>

          {dropdownOpen && (
            <div className="header__dropdown">
              <div className="header__dropdown-header">
                <span className="header__dropdown-name">{user?.name || 'Usuario'}</span>
                <span className="header__dropdown-email">{user?.email || ''}</span>
              </div>
              <div className="header__dropdown-divider" />
              <button className="header__dropdown-item" onClick={() => setDropdownOpen(false)}>
                <FiUser size={16} />
                <span>Mi perfil</span>
              </button>
              <button className="header__dropdown-item header__dropdown-item--danger" onClick={handleLogout}>
                <FiLogOut size={16} />
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
