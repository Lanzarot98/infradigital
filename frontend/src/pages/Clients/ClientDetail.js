import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiEdit,
  FiTrash2,
  FiShoppingCart,
  FiDollarSign,
  FiCalendar,
  FiFileText,
  FiInbox,
} from 'react-icons/fi';
import { AppContext } from '../../context/AppContext';
import { clientService, invoiceService } from '../../services/api';
import StatsCard from '../../components/common/StatsCard';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Loading from '../../components/common/Loading';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNIT,
  formatPhone,
  getStatusLabel,
  getStatusConfig,
} from '../../utils/formatters';
import './ClientDetail.css';

const INVOICES_PER_PAGE = 5;

const ClientDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addNotification } = useContext(AppContext);

  // Client state
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Invoices state
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoiceTotalPages, setInvoiceTotalPages] = useState(1);

  // Purchase summary
  const [purchaseSummary, setPurchaseSummary] = useState({
    totalCompras: 0,
    valorTotal: 0,
    ultimaCompra: null,
  });

  // Delete modal
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    loading: false,
  });

  /**
   * Fetch client data
   */
  const fetchClient = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await clientService.getById(id);
      const data = response.data.client || response.data;
      setClient(data);
    } catch (err) {
      console.error('Error al cargar cliente:', err);
      setError('No se pudo cargar la información del cliente.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  /**
   * Fetch client invoices/purchases
   */
  const fetchInvoices = useCallback(async () => {
    setInvoicesLoading(true);

    try {
      // Try using getPurchaseHistory from clientService
      const response = await clientService.getPurchaseHistory(id);
      const data = response.data;

      let allInvoices = [];
      if (data.invoices) {
        allInvoices = data.invoices;
      } else if (data.purchases) {
        allInvoices = data.purchases;
      } else if (Array.isArray(data)) {
        allInvoices = data;
      }

      // Calculate summary
      const total = allInvoices.length;
      const valorTotal = allInvoices.reduce((sum, inv) => {
        return sum + (Number(inv.total) || 0);
      }, 0);

      // Find most recent invoice
      let ultimaCompra = null;
      if (allInvoices.length > 0) {
        const sorted = [...allInvoices].sort((a, b) => {
          return new Date(b.fecha || b.createdAt) - new Date(a.fecha || a.createdAt);
        });
        ultimaCompra = sorted[0].fecha || sorted[0].createdAt;
      }

      setPurchaseSummary({
        totalCompras: total,
        valorTotal,
        ultimaCompra,
      });

      // Paginate locally
      const totalPgs = Math.max(1, Math.ceil(allInvoices.length / INVOICES_PER_PAGE));
      setInvoiceTotalPages(totalPgs);

      const startIndex = (invoicePage - 1) * INVOICES_PER_PAGE;
      const paginatedInvoices = allInvoices.slice(
        startIndex,
        startIndex + INVOICES_PER_PAGE
      );
      setInvoices(paginatedInvoices);
    } catch (err) {
      console.error('Error al cargar historial de compras:', err);
      setInvoices([]);
      setPurchaseSummary({
        totalCompras: 0,
        valorTotal: 0,
        ultimaCompra: null,
      });
    } finally {
      setInvoicesLoading(false);
    }
  }, [id, invoicePage]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  useEffect(() => {
    if (client) {
      fetchInvoices();
    }
  }, [client, fetchInvoices]);

  /**
   * Handle delete client
   */
  const handleDeleteClick = useCallback(() => {
    setDeleteModal({ open: true, loading: false });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    setDeleteModal((prev) => ({ ...prev, loading: true }));

    try {
      await clientService.delete(id);
      addNotification({
        type: 'success',
        title: 'Cliente eliminado',
        message: 'El cliente "' + (client ? client.nombre : '') + '" fue eliminado correctamente.',
      });
      navigate('/clients');
    } catch (err) {
      console.error('Error al eliminar cliente:', err);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar el cliente. Intenta nuevamente.',
      });
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  }, [id, client, navigate, addNotification]);

  const handleDeleteCancel = useCallback(() => {
    if (!deleteModal.loading) {
      setDeleteModal({ open: false, loading: false });
    }
  }, [deleteModal.loading]);

  /**
   * Navigate to invoice detail
   */
  const handleInvoiceClick = useCallback(
    (invoice) => {
      navigate('/invoices/' + (invoice._id || invoice.id));
    },
    [navigate]
  );

  /**
   * Get type badge classes
   */
  const getTypeLabel = (tipo) => {
    if (tipo === 'natural' || tipo === 'Persona Natural') return 'Persona Natural';
    if (tipo === 'juridica' || tipo === 'Persona Jurídica') return 'Persona Jurídica';
    return tipo || 'N/A';
  };

  const getTypeBadgeClass = (tipo) => {
    if (tipo === 'natural' || tipo === 'Persona Natural')
      return 'client-detail__type-badge--natural';
    if (tipo === 'juridica' || tipo === 'Persona Jurídica')
      return 'client-detail__type-badge--juridica';
    return '';
  };

  /**
   * Invoice table columns
   */
  const invoiceColumns = [
    {
      key: 'numero',
      label: 'Nro. Factura',
      render: (value, row) => (
        <Link
          to={'/invoices/' + (row._id || row.id)}
          style={{
            color: 'var(--primary-light)',
            fontWeight: 'var(--font-weight-medium)',
            textDecoration: 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {value || row.numeroFactura || 'N/A'}
        </Link>
      ),
    },
    {
      key: 'fecha',
      label: 'Fecha',
      render: (value, row) => formatDate(value || row.createdAt) || '—',
    },
    {
      key: 'total',
      label: 'Total',
      render: (value) => (
        <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (value, row) => {
        const status = value || row.status || 'pendiente';
        const config = getStatusConfig(status);
        return (
          <span
            className="client-detail__invoice-status"
            style={{
              backgroundColor: config.bgColor,
              color: config.textColor,
              border: '1px solid ' + config.textColor + '20',
            }}
          >
            {getStatusLabel(status)}
          </span>
        );
      },
    },
  ];

  // Page loading
  if (loading) {
    return (
      <div className="client-detail">
        <div className="client-detail__header">
          <div className="client-detail__header-left">
            <button
              className="client-detail__back-btn"
              onClick={() => navigate('/clients')}
              title="Volver a clientes"
              aria-label="Volver a clientes"
            >
              <FiArrowLeft size={20} />
            </button>
            <div className="client-detail__title-area">
              <h2>Cargando cliente...</h2>
            </div>
          </div>
        </div>
        <Loading size="lg" />
      </div>
    );
  }

  // Error state
  if (error && !client) {
    return (
      <div className="client-detail">
        <div className="client-detail__header">
          <div className="client-detail__header-left">
            <button
              className="client-detail__back-btn"
              onClick={() => navigate('/clients')}
              title="Volver a clientes"
              aria-label="Volver a clientes"
            >
              <FiArrowLeft size={20} />
            </button>
            <div className="client-detail__title-area">
              <h2>Error</h2>
            </div>
          </div>
        </div>
        <Alert
          type="error"
          message={error}
        />
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="client-detail">
      {/* Header */}
      <div className="client-detail__header">
        <div className="client-detail__header-left">
          <button
            className="client-detail__back-btn"
            onClick={() => navigate('/clients')}
            title="Volver a clientes"
            aria-label="Volver a clientes"
          >
            <FiArrowLeft size={20} />
          </button>
          <div className="client-detail__title-area">
            <h2>
              {client.nombre || 'Sin nombre'}
              <span
                className={
                  'client-detail__type-badge ' + getTypeBadgeClass(client.tipo)
                }
              >
                {getTypeLabel(client.tipo)}
              </span>
            </h2>
            <p className="client-detail__nit-label">
              NIT/CC: {client.nit ? formatNIT(client.nit) : 'No registrado'}
            </p>
          </div>
        </div>

        <div className="client-detail__header-actions">
          <Link
            to={'/clients/edit/' + client._id}
            className="btn btn-outline"
          >
            <FiEdit size={16} />
            Editar
          </Link>
          <button
            className="btn btn-danger"
            onClick={handleDeleteClick}
          >
            <FiTrash2 size={16} />
            Eliminar
          </button>
        </div>
      </div>

      {/* Client Info Card */}
      <div className="client-detail__info-card">
        <h3 className="client-detail__info-card-title">Información del Cliente</h3>
        <div className="client-detail__info-grid">
          {/* Left Column */}
          <div className="client-detail__info-item">
            <span className="client-detail__info-label">Email</span>
            <span className="client-detail__info-value">
              {client.email ? (
                <a href={'mailto:' + client.email}>{client.email}</a>
              ) : (
                <span className="client-detail__info-value--empty">No registrado</span>
              )}
            </span>
          </div>

          <div className="client-detail__info-item">
            <span className="client-detail__info-label">Dirección</span>
            <span className="client-detail__info-value">
              {client.direccion || (
                <span className="client-detail__info-value--empty">No registrada</span>
              )}
            </span>
          </div>

          <div className="client-detail__info-item">
            <span className="client-detail__info-label">Teléfono</span>
            <span className="client-detail__info-value">
              {client.telefono ? (
                <a href={'tel:' + client.telefono}>{formatPhone(client.telefono)}</a>
              ) : (
                <span className="client-detail__info-value--empty">No registrado</span>
              )}
            </span>
          </div>

          <div className="client-detail__info-item">
            <span className="client-detail__info-label">Ciudad</span>
            <span className="client-detail__info-value">
              {client.ciudad || (
                <span className="client-detail__info-value--empty">No registrada</span>
              )}
            </span>
          </div>

          <div className="client-detail__info-item">
            <span className="client-detail__info-label">NIT / Cédula</span>
            <span className="client-detail__info-value">
              {client.nit ? formatNIT(client.nit) : (
                <span className="client-detail__info-value--empty">No registrado</span>
              )}
            </span>
          </div>

          <div className="client-detail__info-item">
            <span className="client-detail__info-label">Fecha de Registro</span>
            <span className="client-detail__info-value">
              {formatDateTime(client.createdAt || client.fechaCreacion) || (
                <span className="client-detail__info-value--empty">No disponible</span>
              )}
            </span>
          </div>

          <div className="client-detail__info-item">
            <span className="client-detail__info-label">Tipo de Persona</span>
            <span className="client-detail__info-value">
              {getTypeLabel(client.tipo)}
            </span>
          </div>

          <div className="client-detail__info-item">
            <span className="client-detail__info-label">Notas</span>
            <span className="client-detail__info-value">
              {client.notas ? (
                <span className="client-detail__info-value--notes">{client.notas}</span>
              ) : (
                <span className="client-detail__info-value--empty">Sin notas</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Purchase Summary */}
      <div className="client-detail__purchase-summary">
        <h3 className="client-detail__purchase-summary-title">Resumen de Compras</h3>
        <div className="client-detail__purchase-stats">
          <StatsCard
            title="Total Compras"
            value={purchaseSummary.totalCompras}
            icon={FiShoppingCart}
            color="var(--primary)"
          />
          <StatsCard
            title="Valor Total"
            value={formatCurrency(purchaseSummary.valorTotal)}
            icon={FiDollarSign}
            color="var(--secondary)"
          />
          <StatsCard
            title="Última Compra"
            value={
              purchaseSummary.ultimaCompra
                ? formatDate(purchaseSummary.ultimaCompra)
                : 'N/A'
            }
            icon={FiCalendar}
            color="var(--accent-dark)"
          />
        </div>
      </div>

      {/* Purchase History */}
      <div className="client-detail__history">
        <div className="client-detail__history-header">
          <h3 className="client-detail__history-title">Historial de Compras</h3>
        </div>

        {invoicesLoading ? (
          <div style={{ padding: 'var(--space-8)' }}>
            <Loading size="md" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="client-detail__empty-purchases">
            <FiInbox size={48} className="client-detail__empty-purchases-icon" />
            <h4 className="client-detail__empty-purchases-title">
              Sin compras registradas
            </h4>
            <p className="client-detail__empty-purchases-text">
              Este cliente aún no tiene compras registradas.
            </p>
          </div>
        ) : (
          <>
            <Table
              columns={invoiceColumns}
              data={invoices}
              onRowClick={handleInvoiceClick}
              emptyMessage="No se encontraron facturas"
            />
            {invoiceTotalPages > 1 && (
              <div className="client-detail__history-pagination">
                <Pagination
                  currentPage={invoicePage}
                  totalPages={invoiceTotalPages}
                  onPageChange={setInvoicePage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={handleDeleteCancel}
        title="Eliminar Cliente"
        size="sm"
        footer={
          <div className="client-detail__delete-actions">
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
        <p className="client-detail__delete-message">
          ¿Estás seguro de que deseas eliminar al cliente{' '}
          <span className="client-detail__delete-name">
            "{client.nombre}"
          </span>
          ? Esta acción no se puede deshacer y se perderá todo su historial.
        </p>
      </Modal>
    </div>
  );
};

export default ClientDetail;
