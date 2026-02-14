import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiUserPlus,
  FiEye,
  FiEdit,
  FiTrash2,
  FiUsers,
  FiUser,
  FiBriefcase,
  FiMail,
  FiPhone,
  FiMapPin,
  FiInbox,
} from 'react-icons/fi';
import { AppContext } from '../../context/AppContext';
import { clientService } from '../../services/api';
import StatsCard from '../../components/common/StatsCard';
import SearchBar from '../../components/common/SearchBar';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Loading from '../../components/common/Loading';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import { formatNIT } from '../../utils/formatters';
import './ClientList.css';

const ITEMS_PER_PAGE = 10;

const ClientList = () => {
  const navigate = useNavigate();
  const { addNotification } = useContext(AppContext);

  // State
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClients, setTotalClients] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    natural: 0,
    juridica: 0,
  });

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    client: null,
    loading: false,
  });

  /**
   * Fetch clients from API
   */
  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (filterType !== 'todos') {
        params.type = filterType;
      }

      const response = await clientService.getAll(params);
      const data = response.data;

      if (data.clients) {
        setClients(data.clients);
        setTotalPages(data.totalPages || 1);
        setTotalClients(data.total || data.clients.length);
      } else if (Array.isArray(data)) {
        setClients(data);
        setTotalPages(1);
        setTotalClients(data.length);
      } else {
        setClients([]);
        setTotalPages(1);
        setTotalClients(0);
      }
    } catch (err) {
      console.error('Error al cargar clientes:', err);
      setError('No se pudieron cargar los clientes. Intenta nuevamente.');
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterType]);

  /**
   * Calculate stats from loaded clients or all clients
   */
  const calculateStats = useCallback(async () => {
    try {
      const response = await clientService.getAll({ limit: 9999 });
      const data = response.data;
      const allClients = data.clients || (Array.isArray(data) ? data : []);

      const natural = allClients.filter(
        (c) => c.tipo === 'natural' || c.tipo === 'Persona Natural'
      ).length;
      const juridica = allClients.filter(
        (c) => c.tipo === 'juridica' || c.tipo === 'Persona Jurídica'
      ).length;

      setStats({
        total: data.total || allClients.length,
        natural,
        juridica,
      });
    } catch (err) {
      // Use current data for stats if full fetch fails
      const natural = clients.filter(
        (c) => c.tipo === 'natural' || c.tipo === 'Persona Natural'
      ).length;
      const juridica = clients.filter(
        (c) => c.tipo === 'juridica' || c.tipo === 'Persona Jurídica'
      ).length;

      setStats({
        total: totalClients,
        natural,
        juridica,
      });
    }
  }, [clients, totalClients]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  /**
   * Reset page when search or filter changes
   */
  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((type) => {
    setFilterType(type);
    setCurrentPage(1);
  }, []);

  /**
   * Navigate to client detail
   */
  const handleRowClick = useCallback(
    (client) => {
      navigate('/clients/' + client._id);
    },
    [navigate]
  );

  /**
   * Open delete confirmation modal
   */
  const handleDeleteClick = useCallback((e, client) => {
    e.stopPropagation();
    setDeleteModal({ open: true, client, loading: false });
  }, []);

  /**
   * Confirm and execute delete
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteModal.client) return;

    setDeleteModal((prev) => ({ ...prev, loading: true }));

    try {
      await clientService.delete(deleteModal.client._id);
      addNotification({
        type: 'success',
        title: 'Cliente eliminado',
        message: 'El cliente "' + deleteModal.client.nombre + '" fue eliminado correctamente.',
      });
      setDeleteModal({ open: false, client: null, loading: false });
      fetchClients();
      calculateStats();
    } catch (err) {
      console.error('Error al eliminar cliente:', err);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar el cliente. Intenta nuevamente.',
      });
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  }, [deleteModal.client, addNotification, fetchClients, calculateStats]);

  /**
   * Close delete modal
   */
  const handleDeleteCancel = useCallback(() => {
    if (!deleteModal.loading) {
      setDeleteModal({ open: false, client: null, loading: false });
    }
  }, [deleteModal.loading]);

  /**
   * Get display label for client type
   */
  const getTypeLabel = (tipo) => {
    if (tipo === 'natural' || tipo === 'Persona Natural') return 'Persona Natural';
    if (tipo === 'juridica' || tipo === 'Persona Jurídica') return 'Persona Jurídica';
    return tipo || 'N/A';
  };

  /**
   * Get badge class for client type
   */
  const getTypeBadgeClass = (tipo) => {
    if (tipo === 'natural' || tipo === 'Persona Natural') return 'client-type-badge--natural';
    if (tipo === 'juridica' || tipo === 'Persona Jurídica') return 'client-type-badge--juridica';
    return '';
  };

  /**
   * Table columns definition
   */
  const columns = [
    {
      key: 'nombre',
      label: 'Nombre',
      render: (value) => (
        <span style={{ fontWeight: 'var(--font-weight-medium)' }}>
          {value || 'Sin nombre'}
        </span>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (value) => value || '—',
    },
    {
      key: 'telefono',
      label: 'Teléfono',
      render: (value) => value || '—',
    },
    {
      key: 'nit',
      label: 'NIT/CC',
      render: (value) => (value ? formatNIT(value) : '—'),
    },
    {
      key: 'ciudad',
      label: 'Ciudad',
      render: (value) => value || '—',
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (value) => (
        <span className={'client-type-badge ' + getTypeBadgeClass(value)}>
          {getTypeLabel(value)}
        </span>
      ),
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_, client) => (
        <div className="client-list__actions">
          <button
            className="client-list__action-btn client-list__action-btn--view"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/clients/' + client._id);
            }}
            title="Ver detalle"
            aria-label="Ver detalle"
          >
            <FiEye size={16} />
          </button>
          <button
            className="client-list__action-btn client-list__action-btn--edit"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/clients/edit/' + client._id);
            }}
            title="Editar"
            aria-label="Editar"
          >
            <FiEdit size={16} />
          </button>
          <button
            className="client-list__action-btn client-list__action-btn--delete"
            onClick={(e) => handleDeleteClick(e, client)}
            title="Eliminar"
            aria-label="Eliminar"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  /**
   * Filter buttons configuration
   */
  const filterOptions = [
    { key: 'todos', label: 'Todos' },
    { key: 'natural', label: 'Persona Natural' },
    { key: 'juridica', label: 'Persona Jurídica' },
  ];

  // Loading state
  if (loading && clients.length === 0) {
    return (
      <div className="client-list">
        <div className="client-list__header">
          <h2>Clientes</h2>
        </div>
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="client-list">
      {/* Header */}
      <div className="client-list__header">
        <h2>Clientes</h2>
        <Link to="/clients/new" className="btn btn-primary">
          <FiUserPlus size={18} />
          Nuevo Cliente
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Stats Row */}
      <div className="client-list__stats">
        <StatsCard
          title="Total Clientes"
          value={stats.total}
          icon={FiUsers}
          color="var(--primary)"
        />
        <StatsCard
          title="Persona Natural"
          value={stats.natural}
          icon={FiUser}
          color="var(--info)"
        />
        <StatsCard
          title="Persona Jurídica"
          value={stats.juridica}
          icon={FiBriefcase}
          color="var(--secondary)"
        />
      </div>

      {/* Toolbar: Search + Filters */}
      <div className="client-list__toolbar">
        <div className="client-list__search">
          <SearchBar
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Buscar por nombre, email o NIT/CC..."
          />
        </div>
        <div className="client-list__filters">
          {filterOptions.map((option) => {
            const isActive = filterType === option.key;
            const btnClass = [
              'client-list__filter-btn',
              isActive ? 'client-list__filter-btn--active' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <button
                key={option.key}
                className={btnClass}
                onClick={() => handleFilterChange(option.key)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="client-list__table-container">
        <Table
          columns={columns}
          data={clients}
          onRowClick={handleRowClick}
          loading={loading}
          emptyMessage="No se encontraron clientes"
        />
        {totalPages > 1 && (
          <div className="client-list__pagination">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Mobile Cards View */}
      <div className="client-list__cards">
        {clients.length === 0 && !loading ? (
          <div className="client-list__empty">
            <FiInbox size={48} className="client-list__empty-icon" />
            <h3 className="client-list__empty-title">No se encontraron clientes</h3>
            <p className="client-list__empty-text">
              {searchTerm || filterType !== 'todos'
                ? 'Intenta ajustar los filtros de búsqueda.'
                : 'Comienza agregando tu primer cliente.'}
            </p>
            {!searchTerm && filterType === 'todos' && (
              <Link to="/clients/new" className="btn btn-primary">
                <FiUserPlus size={18} />
                Nuevo Cliente
              </Link>
            )}
          </div>
        ) : (
          clients.map((client) => (
            <div
              key={client._id}
              className="client-card"
              onClick={() => handleRowClick(client)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRowClick(client);
              }}
            >
              <div className="client-card__header">
                <div>
                  <h4 className="client-card__name">{client.nombre || 'Sin nombre'}</h4>
                  <span className="client-card__nit">
                    {client.nit ? formatNIT(client.nit) : 'Sin NIT/CC'}
                  </span>
                </div>
                <span className={'client-type-badge ' + getTypeBadgeClass(client.tipo)}>
                  {getTypeLabel(client.tipo)}
                </span>
              </div>
              <div className="client-card__body">
                {client.email && (
                  <div className="client-card__row">
                    <FiMail size={14} />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.telefono && (
                  <div className="client-card__row">
                    <FiPhone size={14} />
                    <span>{client.telefono}</span>
                  </div>
                )}
                {client.ciudad && (
                  <div className="client-card__row">
                    <FiMapPin size={14} />
                    <span>{client.ciudad}</span>
                  </div>
                )}
              </div>
              <div className="client-card__footer">
                <button
                  className="client-list__action-btn client-list__action-btn--view"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/clients/' + client._id);
                  }}
                  title="Ver detalle"
                  aria-label="Ver detalle"
                >
                  <FiEye size={16} />
                </button>
                <button
                  className="client-list__action-btn client-list__action-btn--edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/clients/edit/' + client._id);
                  }}
                  title="Editar"
                  aria-label="Editar"
                >
                  <FiEdit size={16} />
                </button>
                <button
                  className="client-list__action-btn client-list__action-btn--delete"
                  onClick={(e) => handleDeleteClick(e, client)}
                  title="Eliminar"
                  aria-label="Eliminar"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
        {totalPages > 1 && clients.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={handleDeleteCancel}
        title="Eliminar Cliente"
        size="sm"
        footer={
          <div className="client-delete-modal__actions">
            <button
              className="btn btn-outline"
              onClick={handleDeleteCancel}
              disabled={deleteModal.loading}
            >
              Cancelar
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDeleteConfirm}
              disabled={deleteModal.loading}
            >
              {deleteModal.loading ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        }
      >
        <p className="client-delete-modal__message">
          ¿Estás seguro de que deseas eliminar al cliente{' '}
          <span className="client-delete-modal__name">
            "{deleteModal.client ? deleteModal.client.nombre : ''}"
          </span>
          ? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
};

export default ClientList;
