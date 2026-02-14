import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiFileText,
  FiPlus,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiEye,
  FiCheck,
  FiXCircle,
  FiFilter,
  FiCalendar,
} from 'react-icons/fi';
import { AuthContext } from '../../context/AuthContext';
import { AppContext } from '../../context/AppContext';
import { invoiceService } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import Loading from '../../components/common/Loading';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import StatsCard from '../../components/common/StatsCard';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../../utils/formatters';
import './InvoiceList.css';

const InvoiceList = () => {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const { addNotification } = useContext(AppContext);

  // Estado principal
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Paginacion
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  // Modal de confirmacion
  const [confirmModal, setConfirmModal] = useState({ open: false, type: '', invoice: null });
  const [actionLoading, setActionLoading] = useState(false);

  // Estadisticas
  const [stats, setStats] = useState({
    total: 0,
    pagadas: 0,
    pendientes: 0,
    ingresos: 0,
  });

  /**
   * Cargar facturas con filtros
   */
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        limit,
      };

      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const response = await invoiceService.getAll(params);
      const data = response.data;

      setInvoices(data.invoices || data.data || []);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / limit) || 1);
      setTotalItems(data.total || data.totalItems || 0);

      // Calcular estadisticas desde la respuesta
      if (data.stats) {
        setStats({
          total: data.stats.total || 0,
          pagadas: data.stats.pagadas || 0,
          pendientes: data.stats.pendientes || 0,
          ingresos: data.stats.ingresos || 0,
        });
      } else {
        const allInvoices = data.invoices || data.data || [];
        const pagadas = allInvoices.filter(function (inv) {
          return inv.estado === 'pagada';
        });
        const pendientes = allInvoices.filter(function (inv) {
          return inv.estado === 'pendiente';
        });
        const totalIngresos = pagadas.reduce(function (sum, inv) {
          return sum + (inv.total || 0);
        }, 0);

        setStats({
          total: data.total || allInvoices.length,
          pagadas: data.totalPagadas || pagadas.length,
          pendientes: data.totalPendientes || pendientes.length,
          ingresos: data.totalIngresos || totalIngresos,
        });
      }
    } catch (err) {
      var message =
        (err.response && err.response.data && err.response.data.message) ||
        'Error al cargar las facturas';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter, dateFrom, dateTo, token]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  /**
   * Cambiar pagina reseteando a pagina 1 cuando cambian los filtros
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dateFrom, dateTo]);

  /**
   * Manejar cambio de estado de factura
   */
  const handleStatusChange = useCallback(
    async (invoiceId, newStatus) => {
      setActionLoading(true);
      try {
        await invoiceService.updateStatus(invoiceId, newStatus);
        addNotification({
          type: 'success',
          title: 'Estado actualizado',
          message:
            'La factura ha sido marcada como ' + getStatusLabel(newStatus).toLowerCase() + '.',
        });
        fetchInvoices();
      } catch (err) {
        var message =
          (err.response && err.response.data && err.response.data.message) ||
          'Error al actualizar el estado';
        addNotification({
          type: 'error',
          title: 'Error',
          message: message,
        });
      } finally {
        setActionLoading(false);
        setConfirmModal({ open: false, type: '', invoice: null });
      }
    },
    [addNotification, fetchInvoices]
  );

  /**
   * Abrir modal de confirmacion
   */
  const openConfirmModal = useCallback(function (type, invoice) {
    setConfirmModal({ open: true, type: type, invoice: invoice });
  }, []);

  /**
   * Confirmar accion del modal
   */
  const handleConfirm = useCallback(
    function () {
      if (!confirmModal.invoice) return;

      if (confirmModal.type === 'pagar') {
        handleStatusChange(confirmModal.invoice._id, 'pagada');
      } else if (confirmModal.type === 'anular') {
        handleStatusChange(confirmModal.invoice._id, 'anulada');
      }
    },
    [confirmModal, handleStatusChange]
  );

  /**
   * Limpiar filtros
   */
  const handleClearFilters = useCallback(function () {
    setSearch('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  }, []);

  /**
   * Columnas de la tabla
   */
  const columns = useMemo(
    function () {
      return [
        {
          key: 'numero',
          label: 'Nro. Factura',
          render: function (value, row) {
            return (
              <span className="invoice-number">
                <FiFileText size={14} />
                {value || row.numero || 'N/A'}
              </span>
            );
          },
        },
        {
          key: 'cliente',
          label: 'Cliente',
          render: function (value) {
            if (!value) return 'Sin cliente';
            return typeof value === 'object' ? value.nombre || value.name || 'Sin nombre' : value;
          },
        },
        {
          key: 'fecha',
          label: 'Fecha',
          render: function (value, row) {
            return formatDate(value || row.createdAt);
          },
        },
        {
          key: 'subtotal',
          label: 'Subtotal',
          render: function (value) {
            return formatCurrency(value || 0);
          },
        },
        {
          key: 'iva',
          label: 'IVA',
          render: function (value) {
            return formatCurrency(value || 0);
          },
        },
        {
          key: 'total',
          label: 'Total',
          render: function (value) {
            return <strong>{formatCurrency(value || 0)}</strong>;
          },
        },
        {
          key: 'estado',
          label: 'Estado',
          render: function (value) {
            var colorClass = getStatusColor(value);
            var label = getStatusLabel(value);
            return <span className={'invoice-badge ' + colorClass}>{label}</span>;
          },
        },
        {
          key: 'acciones',
          label: 'Acciones',
          render: function (_value, row) {
            return (
              <div className="invoice-actions" onClick={function (e) { e.stopPropagation(); }}>
                <button
                  className="invoice-action-btn invoice-action-btn--view"
                  title="Ver detalle"
                  onClick={function (e) {
                    e.stopPropagation();
                    navigate('/invoices/' + row._id);
                  }}
                >
                  <FiEye size={15} />
                </button>
                {row.estado === 'pendiente' && (
                  <button
                    className="invoice-action-btn invoice-action-btn--pay"
                    title="Marcar como pagada"
                    onClick={function (e) {
                      e.stopPropagation();
                      openConfirmModal('pagar', row);
                    }}
                  >
                    <FiCheck size={15} />
                  </button>
                )}
                {row.estado !== 'anulada' && row.estado !== 'pagada' && (
                  <button
                    className="invoice-action-btn invoice-action-btn--cancel"
                    title="Anular factura"
                    onClick={function (e) {
                      e.stopPropagation();
                      openConfirmModal('anular', row);
                    }}
                  >
                    <FiXCircle size={15} />
                  </button>
                )}
              </div>
            );
          },
        },
      ];
    },
    [navigate, openConfirmModal]
  );

  /**
   * Titulo del modal de confirmacion
   */
  var modalTitle =
    confirmModal.type === 'pagar' ? 'Confirmar Pago' : 'Confirmar Anulacion';

  var modalMessage =
    confirmModal.type === 'pagar'
      ? 'Esta seguro de marcar la factura ' +
        (confirmModal.invoice ? confirmModal.invoice.numero : '') +
        ' como pagada?'
      : 'Esta seguro de anular la factura ' +
        (confirmModal.invoice ? confirmModal.invoice.numero : '') +
        '? Esta accion no se puede deshacer.';

  var hasFilters = search || statusFilter || dateFrom || dateTo;

  return (
    <div className="invoice-list-page">
      {/* Encabezado */}
      <div className="invoice-list-page__header">
        <div className="invoice-list-page__header-text">
          <h1 className="invoice-list-page__title">Facturacion</h1>
          <p className="invoice-list-page__subtitle">
            Gestiona tus facturas y controla tus ingresos
          </p>
        </div>
        <button
          className="invoice-list-page__new-btn"
          onClick={function () {
            navigate('/invoices/create');
          }}
        >
          <FiPlus size={18} />
          Nueva Factura
        </button>
      </div>

      {/* Tarjetas de estadisticas */}
      <div className="invoice-list-page__stats">
        <StatsCard
          title="Total Facturas"
          value={stats.total}
          icon={FiFileText}
          color="#3b82f6"
        />
        <StatsCard
          title="Pagadas"
          value={stats.pagadas}
          icon={FiCheckCircle}
          color="#059669"
        />
        <StatsCard
          title="Pendientes"
          value={stats.pendientes}
          icon={FiClock}
          color="#f59e0b"
        />
        <StatsCard
          title="Ingresos Totales"
          value={formatCurrency(stats.ingresos)}
          icon={FiDollarSign}
          color="#10b981"
        />
      </div>

      {/* Filtros */}
      <Card className="invoice-list-page__filters-card">
        <div className="invoice-list-page__filters">
          <div className="invoice-list-page__search">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Buscar por numero de factura o cliente..."
            />
          </div>

          <div className="invoice-list-page__filter-group">
            <div className="invoice-list-page__filter-item">
              <label className="invoice-list-page__filter-label">
                <FiFilter size={14} />
                Estado
              </label>
              <select
                className="invoice-list-page__select"
                value={statusFilter}
                onChange={function (e) {
                  setStatusFilter(e.target.value);
                }}
              >
                <option value="">Todas</option>
                <option value="pendiente">Pendiente</option>
                <option value="pagada">Pagada</option>
                <option value="anulada">Anulada</option>
                <option value="vencida">Vencida</option>
              </select>
            </div>

            <div className="invoice-list-page__filter-item">
              <label className="invoice-list-page__filter-label">
                <FiCalendar size={14} />
                Desde
              </label>
              <input
                type="date"
                className="invoice-list-page__date-input"
                value={dateFrom}
                onChange={function (e) {
                  setDateFrom(e.target.value);
                }}
              />
            </div>

            <div className="invoice-list-page__filter-item">
              <label className="invoice-list-page__filter-label">
                <FiCalendar size={14} />
                Hasta
              </label>
              <input
                type="date"
                className="invoice-list-page__date-input"
                value={dateTo}
                onChange={function (e) {
                  setDateTo(e.target.value);
                }}
              />
            </div>
          </div>

          {hasFilters && (
            <button className="invoice-list-page__clear-filters" onClick={handleClearFilters}>
              Limpiar filtros
            </button>
          )}
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={function () {
            setError(null);
          }}
        />
      )}

      {/* Tabla de facturas */}
      <Card className="invoice-list-page__table-card">
        <Table
          columns={columns}
          data={invoices}
          loading={loading}
          emptyMessage="No se encontraron facturas con los filtros seleccionados"
          onRowClick={function (row) {
            navigate('/invoices/' + row._id);
          }}
        />

        {!loading && invoices.length > 0 && (
          <div className="invoice-list-page__pagination">
            <p className="invoice-list-page__pagination-info">
              Mostrando {(currentPage - 1) * limit + 1} -{' '}
              {Math.min(currentPage * limit, totalItems)} de {totalItems} facturas
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>

      {/* Modal de confirmacion */}
      <Modal
        isOpen={confirmModal.open}
        onClose={function () {
          if (!actionLoading) {
            setConfirmModal({ open: false, type: '', invoice: null });
          }
        }}
        title={modalTitle}
        size="sm"
        footer={
          <div className="invoice-confirm-modal__footer">
            <button
              className="invoice-confirm-modal__btn invoice-confirm-modal__btn--cancel"
              onClick={function () {
                setConfirmModal({ open: false, type: '', invoice: null });
              }}
              disabled={actionLoading}
            >
              Cancelar
            </button>
            <button
              className={
                'invoice-confirm-modal__btn ' +
                (confirmModal.type === 'anular'
                  ? 'invoice-confirm-modal__btn--danger'
                  : 'invoice-confirm-modal__btn--primary')
              }
              onClick={handleConfirm}
              disabled={actionLoading}
            >
              {actionLoading ? 'Procesando...' : 'Confirmar'}
            </button>
          </div>
        }
      >
        <p className="invoice-confirm-modal__message">{modalMessage}</p>
        {confirmModal.invoice && (
          <div className="invoice-confirm-modal__detail">
            <p>
              <strong>Factura:</strong> {confirmModal.invoice.numero}
            </p>
            <p>
              <strong>Cliente:</strong>{' '}
              {confirmModal.invoice.cliente
                ? typeof confirmModal.invoice.cliente === 'object'
                  ? confirmModal.invoice.cliente.nombre
                  : confirmModal.invoice.cliente
                : 'N/A'}
            </p>
            <p>
              <strong>Total:</strong> {formatCurrency(confirmModal.invoice.total)}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InvoiceList;
