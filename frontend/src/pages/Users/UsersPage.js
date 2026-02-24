import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  FiUserCheck,
  FiUserPlus,
  FiEdit,
  FiKey,
  FiUserX,
  FiUsers,
  FiShield,
  FiUser,
  FiCheckCircle,
  FiSave,
  FiLock,
} from 'react-icons/fi';
import { AppContext } from '../../context/AppContext';
import { userService } from '../../services/api';
import StatsCard from '../../components/common/StatsCard';
import SearchBar from '../../components/common/SearchBar';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Loading from '../../components/common/Loading';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import './UsersPage.css';

const ITEMS_PER_PAGE = 10;

const MODULE_LABELS = {
  dashboard: 'Dashboard',
  inventory: 'Inventario',
  invoices: 'Facturación',
  clients: 'Clientes',
  audit: 'Auditoría',
  users: 'Usuarios',
};

const UsersPage = () => {
  const { addNotification } = useContext(AppContext);

  // --- Main state ---
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, admins: 0, regularUsers: 0, active: 0 });

  // --- Tabs ---
  const [activeTab, setActiveTab] = useState('users');

  // --- User form modal ---
  const [formModal, setFormModal] = useState({ open: false, user: null });
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user', company: '', isActive: true });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // --- Reset password modal ---
  const [resetModal, setResetModal] = useState({ open: false, user: null });
  const [resetData, setResetData] = useState({ newPassword: '', confirmPassword: '' });
  const [resetting, setResetting] = useState(false);

  // --- Permissions ---
  const [permRole, setPermRole] = useState('admin');
  const [permissions, setPermissions] = useState([]);
  const [permLoading, setPermLoading] = useState(false);
  const [permSaving, setPermSaving] = useState(false);

  // ========================================
  // FETCH USERS
  // ========================================
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      var params = { page: currentPage, limit: ITEMS_PER_PAGE };
      if (searchTerm) params.search = searchTerm;
      if (filterRole) params.role = filterRole;

      var response = await userService.getAll(params);
      var responseData = response.data;
      var innerData = responseData.data || responseData;
      var userList = innerData.users || [];
      var pagination = innerData.pagination || {};

      setUsers(userList);
      setTotalPages(pagination.totalPages || 1);

      var total = pagination.total || userList.length;
      var admins = userList.filter(function(u) { return u.role === 'admin'; }).length;
      var regularCount = userList.filter(function(u) { return u.role === 'user'; }).length;
      var activeCount = userList.filter(function(u) { return u.isActive; }).length;

      setStats({
        total: total,
        admins: admins,
        regularUsers: regularCount,
        active: activeCount,
      });
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError('No se pudieron cargar los usuarios. Intenta nuevamente.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterRole]);

  useEffect(function() {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [fetchUsers, activeTab]);

  // ========================================
  // FETCH PERMISSIONS
  // ========================================
  const fetchPermissions = useCallback(async function() {
    setPermLoading(true);
    try {
      var response = await userService.getPermissions(permRole);
      var responseData = response.data;
      var innerData = responseData.data || responseData;
      setPermissions(innerData.permissions || []);
    } catch (err) {
      console.error('Error al cargar permisos:', err);
      setPermissions([]);
    } finally {
      setPermLoading(false);
    }
  }, [permRole]);

  useEffect(function() {
    if (activeTab === 'permissions') {
      fetchPermissions();
    }
  }, [fetchPermissions, activeTab]);

  // ========================================
  // HANDLERS - SEARCH & FILTER
  // ========================================
  var handleSearch = useCallback(function(value) {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  // ========================================
  // HANDLERS - USER FORM
  // ========================================
  var openCreateModal = function() {
    setFormData({ name: '', email: '', password: '', role: 'user', company: '', isActive: true });
    setFormErrors({});
    setFormModal({ open: true, user: null });
  };

  var openEditModal = function(user) {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'user',
      company: user.company || '',
      isActive: user.isActive !== undefined ? user.isActive : true,
    });
    setFormErrors({});
    setFormModal({ open: true, user: user });
  };

  var closeFormModal = function() {
    setFormModal({ open: false, user: null });
    setFormData({ name: '', email: '', password: '', role: 'user', company: '', isActive: true });
    setFormErrors({});
  };

  var validateForm = function() {
    var errors = {};
    if (!formData.name.trim()) errors.name = 'El nombre es obligatorio';
    if (!formData.email.trim()) errors.email = 'El email es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email no válido';
    if (!formModal.user && !formData.password) errors.password = 'La contraseña es obligatoria';
    else if (!formModal.user && formData.password.length < 6) errors.password = 'Mínimo 6 caracteres';
    if (!formData.role) errors.role = 'El rol es obligatorio';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  var handleFormChange = function(field, value) {
    setFormData(function(prev) {
      var updated = Object.assign({}, prev);
      updated[field] = value;
      return updated;
    });
    if (formErrors[field]) {
      setFormErrors(function(prev) {
        var updated = Object.assign({}, prev);
        delete updated[field];
        return updated;
      });
    }
  };

  var handleFormSubmit = async function(e) {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (formModal.user) {
        var updateData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          company: formData.company,
          isActive: formData.isActive,
        };
        await userService.update(formModal.user.id, updateData);
        addNotification({ type: 'success', title: 'Usuario actualizado', message: 'El usuario se actualizó correctamente.' });
      } else {
        await userService.create(formData);
        addNotification({ type: 'success', title: 'Usuario creado', message: 'El nuevo usuario se creó correctamente.' });
      }
      closeFormModal();
      fetchUsers();
    } catch (err) {
      var msg = (err.response && err.response.data && err.response.data.message) || 'Error al guardar el usuario.';
      setFormErrors({ general: msg });
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // HANDLERS - RESET PASSWORD
  // ========================================
  var openResetModal = function(user) {
    setResetData({ newPassword: '', confirmPassword: '' });
    setResetModal({ open: true, user: user });
  };

  var closeResetModal = function() {
    setResetModal({ open: false, user: null });
    setResetData({ newPassword: '', confirmPassword: '' });
  };

  var handleResetSubmit = async function(e) {
    e.preventDefault();
    if (!resetData.newPassword || resetData.newPassword.length < 6) {
      addNotification({ type: 'error', title: 'Error', message: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    if (resetData.newPassword !== resetData.confirmPassword) {
      addNotification({ type: 'error', title: 'Error', message: 'Las contraseñas no coinciden.' });
      return;
    }
    setResetting(true);
    try {
      await userService.resetPassword(resetModal.user.id, { newPassword: resetData.newPassword });
      addNotification({ type: 'success', title: 'Contraseña restablecida', message: 'La contraseña se restableció correctamente.' });
      closeResetModal();
    } catch (err) {
      var msg = (err.response && err.response.data && err.response.data.message) || 'Error al restablecer la contraseña.';
      addNotification({ type: 'error', title: 'Error', message: msg });
    } finally {
      setResetting(false);
    }
  };

  // ========================================
  // HANDLERS - DELETE (soft)
  // ========================================
  var handleDeactivate = async function(user) {
    if (!window.confirm('¿Estás seguro de desactivar al usuario "' + user.name + '"?')) return;
    try {
      await userService.delete(user.id);
      addNotification({ type: 'success', title: 'Usuario desactivado', message: 'El usuario fue desactivado correctamente.' });
      fetchUsers();
    } catch (err) {
      var msg = (err.response && err.response.data && err.response.data.message) || 'Error al desactivar el usuario.';
      addNotification({ type: 'error', title: 'Error', message: msg });
    }
  };

  // ========================================
  // HANDLERS - PERMISSIONS
  // ========================================
  var handlePermChange = function(index, field, value) {
    setPermissions(function(prev) {
      var updated = prev.map(function(p, i) {
        if (i !== index) return p;
        var copy = Object.assign({}, p);
        copy[field] = value;
        return copy;
      });
      return updated;
    });
  };

  var handlePermSave = async function() {
    setPermSaving(true);
    try {
      var payload = permissions.map(function(p) {
        return {
          module: p.module,
          canView: p.canView,
          canCreate: p.canCreate,
          canEdit: p.canEdit,
          canDelete: p.canDelete,
        };
      });
      await userService.updatePermissions(permRole, { permissions: payload });
      addNotification({ type: 'success', title: 'Permisos guardados', message: 'Los permisos se actualizaron correctamente.' });
      fetchPermissions();
    } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: 'Error al guardar los permisos.' });
    } finally {
      setPermSaving(false);
    }
  };

  // ========================================
  // TABLE COLUMNS
  // ========================================
  var columns = [
    {
      key: 'name',
      label: 'Nombre',
      render: function(value) {
        return <span className="users-table__name">{value || '—'}</span>;
      },
    },
    {
      key: 'email',
      label: 'Email',
      render: function(value) {
        return <span className="users-table__email">{value || '—'}</span>;
      },
    },
    {
      key: 'role',
      label: 'Rol',
      render: function(value) {
        var cls = value === 'admin' ? 'users-badge users-badge--admin' : 'users-badge users-badge--user';
        var label = value === 'admin' ? 'Administrador' : 'Usuario';
        return <span className={cls}>{label}</span>;
      },
    },
    {
      key: 'company',
      label: 'Empresa',
      render: function(value) {
        return <span className="users-table__company">{value || '—'}</span>;
      },
    },
    {
      key: 'isActive',
      label: 'Estado',
      render: function(value) {
        var cls = value ? 'users-badge users-badge--active' : 'users-badge users-badge--inactive';
        var label = value ? 'Activo' : 'Inactivo';
        return <span className={cls}>{label}</span>;
      },
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: function(_, row) {
        return (
          <div className="users-table__actions">
            <button
              className="users-table__action-btn users-table__action-btn--edit"
              onClick={function(e) { e.stopPropagation(); openEditModal(row); }}
              title="Editar usuario"
            >
              <FiEdit size={16} />
            </button>
            <button
              className="users-table__action-btn users-table__action-btn--password"
              onClick={function(e) { e.stopPropagation(); openResetModal(row); }}
              title="Restablecer contraseña"
            >
              <FiKey size={16} />
            </button>
            {row.isActive && (
              <button
                className="users-table__action-btn users-table__action-btn--delete"
                onClick={function(e) { e.stopPropagation(); handleDeactivate(row); }}
                title="Desactivar usuario"
              >
                <FiUserX size={16} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  // ========================================
  // RENDER: LOADING
  // ========================================
  if (loading && users.length === 0 && activeTab === 'users') {
    return (
      <div className="users-page">
        <div className="users-page__header">
          <div>
            <h2 className="users-page__title">Gestión de Usuarios</h2>
            <p className="users-page__subtitle">Administración de usuarios y permisos del sistema</p>
          </div>
        </div>
        <Loading size="lg" />
      </div>
    );
  }

  // ========================================
  // RENDER
  // ========================================
  return (
    <div className="users-page">
      {/* Header */}
      <div className="users-page__header">
        <div>
          <h2 className="users-page__title">
            <FiUserCheck className="users-page__title-icon" size={28} />
            Gestión de Usuarios
          </h2>
          <p className="users-page__subtitle">Administración de usuarios y permisos del sistema</p>
        </div>
        {activeTab === 'users' && (
          <button className="users-page__btn-new" onClick={openCreateModal}>
            <FiUserPlus size={18} />
            Nuevo Usuario
          </button>
        )}
      </div>

      {/* Error */}
      {error && <Alert type="error" message={error} onClose={function() { setError(null); }} />}

      {/* Tabs */}
      <div className="users-page__tabs">
        <button
          className={'users-page__tab' + (activeTab === 'users' ? ' users-page__tab--active' : '')}
          onClick={function() { setActiveTab('users'); }}
        >
          <FiUsers size={16} />
          Usuarios
        </button>
        <button
          className={'users-page__tab' + (activeTab === 'permissions' ? ' users-page__tab--active' : '')}
          onClick={function() { setActiveTab('permissions'); }}
        >
          <FiShield size={16} />
          Permisos
        </button>
      </div>

      {/* ===== TAB: USERS ===== */}
      {activeTab === 'users' && (
        <>
          {/* Stats */}
          <div className="users-page__stats">
            <StatsCard title="Total Usuarios" value={stats.total} icon={FiUsers} color="#3b82f6" />
            <StatsCard title="Administradores" value={stats.admins} icon={FiShield} color="#7c3aed" />
            <StatsCard title="Usuarios" value={stats.regularUsers} icon={FiUser} color="#0ea5e9" />
            <StatsCard title="Activos" value={stats.active} icon={FiCheckCircle} color="#22c55e" />
          </div>

          {/* Filters */}
          <div className="users-page__filters">
            <div className="users-page__search">
              <SearchBar
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Buscar por nombre o email..."
              />
            </div>
            <select
              className="users-page__select"
              value={filterRole}
              onChange={function(e) { setFilterRole(e.target.value); setCurrentPage(1); }}
            >
              <option value="">Todos los roles</option>
              <option value="admin">Administrador</option>
              <option value="user">Usuario</option>
            </select>
          </div>

          {/* Table */}
          <div className="users-page__table-container">
            <Table
              columns={columns}
              data={users}
              loading={loading}
              emptyMessage="No se encontraron usuarios"
            />
            {totalPages > 1 && (
              <div className="users-page__pagination">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* ===== TAB: PERMISSIONS ===== */}
      {activeTab === 'permissions' && (
        <div className="users-perms">
          <div className="users-perms__header">
            <div className="users-perms__role-select">
              <span className="users-perms__role-label">Rol:</span>
              <select
                className="users-page__select"
                value={permRole}
                onChange={function(e) { setPermRole(e.target.value); }}
              >
                <option value="admin">Administrador</option>
                <option value="user">Usuario</option>
              </select>
            </div>
          </div>

          {permLoading ? (
            <Loading size="md" />
          ) : (
            <>
              <div className="users-perms__table-wrap">
                <table className="users-perms__table">
                  <thead>
                    <tr>
                      <th>Módulo</th>
                      <th>Ver</th>
                      <th>Crear</th>
                      <th>Editar</th>
                      <th>Eliminar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map(function(perm, idx) {
                      return (
                        <tr key={perm.id || perm.module}>
                          <td>
                            <span className="users-perms__module-name">
                              {MODULE_LABELS[perm.module] || perm.module}
                            </span>
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              className="users-perms__checkbox"
                              checked={!!perm.canView}
                              onChange={function(e) { handlePermChange(idx, 'canView', e.target.checked); }}
                            />
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              className="users-perms__checkbox"
                              checked={!!perm.canCreate}
                              onChange={function(e) { handlePermChange(idx, 'canCreate', e.target.checked); }}
                            />
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              className="users-perms__checkbox"
                              checked={!!perm.canEdit}
                              onChange={function(e) { handlePermChange(idx, 'canEdit', e.target.checked); }}
                            />
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              className="users-perms__checkbox"
                              checked={!!perm.canDelete}
                              onChange={function(e) { handlePermChange(idx, 'canDelete', e.target.checked); }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="users-perms__save-row">
                <button
                  className="users-perms__save-btn"
                  onClick={handlePermSave}
                  disabled={permSaving}
                >
                  <FiSave size={16} />
                  {permSaving ? 'Guardando...' : 'Guardar Permisos'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== MODAL: CREATE / EDIT USER ===== */}
      <Modal
        isOpen={formModal.open}
        onClose={closeFormModal}
        title={formModal.user ? 'Editar Usuario' : 'Nuevo Usuario'}
        size="md"
      >
        <form className="users-form" onSubmit={handleFormSubmit}>
          {formErrors.general && (
            <Alert type="error" message={formErrors.general} onClose={function() { setFormErrors(function(prev) { var u = Object.assign({}, prev); delete u.general; return u; }); }} />
          )}

          <div className="users-form__row">
            <div className="users-form__group">
              <label className="users-form__label users-form__label--required">Nombre</label>
              <input
                type="text"
                className={'users-form__input' + (formErrors.name ? ' users-form__input--error' : '')}
                value={formData.name}
                onChange={function(e) { handleFormChange('name', e.target.value); }}
                placeholder="Nombre completo"
              />
              {formErrors.name && <span className="users-form__error">{formErrors.name}</span>}
            </div>
            <div className="users-form__group">
              <label className="users-form__label users-form__label--required">Email</label>
              <input
                type="email"
                className={'users-form__input' + (formErrors.email ? ' users-form__input--error' : '')}
                value={formData.email}
                onChange={function(e) { handleFormChange('email', e.target.value); }}
                placeholder="correo@ejemplo.com"
              />
              {formErrors.email && <span className="users-form__error">{formErrors.email}</span>}
            </div>
          </div>

          {!formModal.user && (
            <div className="users-form__group">
              <label className="users-form__label users-form__label--required">Contraseña</label>
              <input
                type="password"
                className={'users-form__input' + (formErrors.password ? ' users-form__input--error' : '')}
                value={formData.password}
                onChange={function(e) { handleFormChange('password', e.target.value); }}
                placeholder="Mínimo 6 caracteres"
              />
              {formErrors.password && <span className="users-form__error">{formErrors.password}</span>}
            </div>
          )}

          <div className="users-form__row">
            <div className="users-form__group">
              <label className="users-form__label users-form__label--required">Rol</label>
              <select
                className="users-form__select"
                value={formData.role}
                onChange={function(e) { handleFormChange('role', e.target.value); }}
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
              {formErrors.role && <span className="users-form__error">{formErrors.role}</span>}
            </div>
            <div className="users-form__group">
              <label className="users-form__label">Empresa</label>
              <input
                type="text"
                className="users-form__input"
                value={formData.company}
                onChange={function(e) { handleFormChange('company', e.target.value); }}
                placeholder="Nombre de la empresa"
              />
            </div>
          </div>

          {formModal.user && (
            <div className="users-form__group">
              <label className="users-form__label">Estado</label>
              <div className="users-form__toggle-group">
                <input
                  type="checkbox"
                  className="users-form__toggle"
                  checked={formData.isActive}
                  onChange={function(e) { handleFormChange('isActive', e.target.checked); }}
                  id="user-active-toggle"
                />
                <label className="users-form__toggle-label" htmlFor="user-active-toggle">
                  {formData.isActive ? 'Activo' : 'Inactivo'}
                </label>
              </div>
            </div>
          )}

          <div className="users-form__actions">
            <button type="button" className="users-form__btn users-form__btn--cancel" onClick={closeFormModal}>
              Cancelar
            </button>
            <button type="submit" className="users-form__btn users-form__btn--save" disabled={saving}>
              {saving ? 'Guardando...' : (formModal.user ? 'Actualizar' : 'Crear Usuario')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ===== MODAL: RESET PASSWORD ===== */}
      <Modal
        isOpen={resetModal.open}
        onClose={closeResetModal}
        title="Restablecer Contraseña"
        size="sm"
      >
        <form className="users-reset" onSubmit={handleResetSubmit}>
          {resetModal.user && (
            <p className="users-reset__info">
              <FiLock size={14} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Restableciendo contraseña de <strong>{resetModal.user.name}</strong>
            </p>
          )}

          <div className="users-form__group">
            <label className="users-form__label users-form__label--required">Nueva contraseña</label>
            <input
              type="password"
              className="users-form__input"
              value={resetData.newPassword}
              onChange={function(e) { setResetData(function(prev) { return Object.assign({}, prev, { newPassword: e.target.value }); }); }}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="users-form__group">
            <label className="users-form__label users-form__label--required">Confirmar contraseña</label>
            <input
              type="password"
              className="users-form__input"
              value={resetData.confirmPassword}
              onChange={function(e) { setResetData(function(prev) { return Object.assign({}, prev, { confirmPassword: e.target.value }); }); }}
              placeholder="Repite la contraseña"
            />
          </div>

          <div className="users-form__actions">
            <button type="button" className="users-form__btn users-form__btn--cancel" onClick={closeResetModal}>
              Cancelar
            </button>
            <button type="submit" className="users-form__btn users-form__btn--save" disabled={resetting}>
              {resetting ? 'Restableciendo...' : 'Restablecer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersPage;
