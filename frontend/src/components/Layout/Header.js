import React, { useContext, useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FiMenu, FiBell, FiWifi, FiWifiOff, FiChevronDown, FiLogOut, FiUser } from 'react-icons/fi';
import { AppContext } from '../../context/AppContext';
import { AuthContext } from '../../context/AuthContext';
import './Header.css';

const routeTitles = {
  '/dashboard': 'Dashboard',
  '/inventario': 'Inventario',
  '/facturacion': 'Facturaci\u00f3n',
  '/clientes': 'Clientes',
};

const Header = () => {
  const location = useLocation();
  const { sidebarOpen, setSidebarOpen, isOnline, notifications } = useContext(AppContext);
  const { user, logout } = useContext(AuthContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="header">
      <div className="header__left">
        <button
          className="header__menu-btn"
          onClick={handleToggleSidebar}
          aria-label="Abrir men\u00fa"
        >
          <FiMenu size={22} />
        </button>
        <h1 className="header__title">{getPageTitle()}</h1>
      </div>

      <div className="header__right">
        <div className={['header__status', isOnline ? 'header__status--online' : 'header__status--offline'].join(' ')}>
          {isOnline ? <FiWifi size={16} /> : <FiWifiOff size={16} />}
          <span className="header__status-text">
            {isOnline ? 'En l\u00ednea' : 'Sin conexi\u00f3n'}
          </span>
        </div>

        <button className="header__notification-btn" aria-label="Notificaciones">
          <FiBell size={20} />
          {unreadCount > 0 && (
            <span className="header__notification-badge">{unreadCount}</span>
          )}
        </button>

        <div className="header__user-menu" ref={dropdownRef}>
          <button
            className="header__user-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="header__user-avatar">
              {user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="header__user-name">{user?.nombre || 'Usuario'}</span>
            <FiChevronDown
              size={16}
              className={['header__chevron', dropdownOpen ? 'header__chevron--open' : ''].join(' ')}
            />
          </button>

          {dropdownOpen && (
            <div className="header__dropdown">
              <div className="header__dropdown-header">
                <span className="header__dropdown-name">{user?.nombre || 'Usuario'}</span>
                <span className="header__dropdown-email">{user?.email || 'usuario@empresa.com'}</span>
              </div>
              <div className="header__dropdown-divider" />
              <button className="header__dropdown-item" onClick={() => setDropdownOpen(false)}>
                <FiUser size={16} />
                <span>Mi perfil</span>
              </button>
              <button className="header__dropdown-item header__dropdown-item--danger" onClick={handleLogout}>
                <FiLogOut size={16} />
                <span>Cerrar sesi\u00f3n</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
