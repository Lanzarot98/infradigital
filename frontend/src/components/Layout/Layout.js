import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { AppContext } from '../../context/AppContext';
import './Layout.css';

const Layout = () => {
  const { sidebarOpen, setSidebarOpen } = useContext(AppContext);

  const handleOverlayClick = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className={`layout__overlay ${sidebarOpen ? 'layout__overlay--visible' : ''}`}
        onClick={handleOverlayClick}
        role="presentation"
      />

      <div className="layout__main-area">
        <Header />
        <main className="layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
