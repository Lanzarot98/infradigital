import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiPackage, FiFileText, FiUsers, FiShield, FiLogOut, FiBarChart2, FiX, FiUserCheck } from 'react-icons/fi';
import { AuthContext } from '../../context/AuthContext';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: FiHome, roles: ['admin', 'user'] },
  { path: '/inventory', label: 'Inventario', icon: FiPackage, roles: ['admin', 'user'] },
  { path: '/invoices', label: 'Facturación', icon: FiFileText, roles: ['admin', 'user'] },
  { path: '/clients', label: 'Clientes', icon: FiUsers, roles: ['admin', 'user'] },
  { path: '/audit', label: 'Auditoría', icon: FiShield, roles: ['admin', 'user'] },
  { path: '/users', label: 'Usuarios', icon: FiUserCheck, roles: ['admin'] },
];

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const sidebarClass = ['sidebar', isOpen ? 'sidebar--open' : ''].filter(Boolean).join(' ');

  return (
    <aside className={sidebarClass}>
      <div className="sidebar__header">
        <div className="sidebar__brand">
          <div className="sidebar__logo">
            <FiBarChart2 size={24} />
          </div>
          <span className="sidebar__title">InfraDigital</span>
        </div>
        <button
          className="sidebar__close-btn"
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          <FiX size={20} />
        </button>
      </div>

      <nav className="sidebar__nav">
        <ul className="sidebar__nav-list">
          {navItems.filter((item) => !item.roles || item.roles.includes(user?.role)).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            const linkClass = ['sidebar__nav-link', isActive ? 'sidebar__nav-link--active' : ''].filter(Boolean).join(' ');
            return (
              <li key={item.path} className="sidebar__nav-item">
                <NavLink
                  to={item.path}
                  className={linkClass}
                  onClick={handleNavClick}
                >
                  <Icon className="sidebar__nav-icon" size={20} />
                  <span className="sidebar__nav-label">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="sidebar__user-info">
            <span className="sidebar__user-name">{user?.name || 'Usuario'}</span>
            <span className="sidebar__user-role">{user?.role === 'admin' ? 'Administrador' : 'Usuario'}</span>
          </div>
        </div>
        <button
          className="sidebar__logout-btn"
          onClick={handleLogout}
          title="Cerrar sesión"
        >
          <FiLogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
