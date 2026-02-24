import React, { useState, useEffect, useCallback } from 'react';
import {
  FiShield,
  FiActivity,
  FiUsers,
  FiDatabase,
  FiEye,
  FiFilter,
  FiX,
} from 'react-icons/fi';
import { auditService } from '../../services/api';
import StatsCard from '../../components/common/StatsCard';
import SearchBar from '../../components/common/SearchBar';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Loading from '../../components/common/Loading';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import { formatDateTime } from '../../utils/formatters';
import './AuditPage.css';

const ITEMS_PER_PAGE = 15;

const ACTION_TYPES = [
  { value: '', label: 'Todas' },
  { value: 'crear', label: 'Crear' },
  { value: 'actualizar', label: 'Actualizar' },
  { value: 'eliminar', label: 'Eliminar' },
  { value: 'ajustar_stock', label: 'Ajustar Stock' },
  { value: 'cambiar_estado', label: 'Cambiar Estado' },
  { value: 'iniciar_sesion', label: 'Iniciar Sesión' },
];

const TABLE_NAMES = [
  { value: '', label: 'Todas' },
  { value: 'products', label: 'Productos' },
  { value: 'clients', label: 'Clientes' },
  { value: 'invoices', label: 'Facturas' },
  { value: 'users', label: 'Usuarios' },
  { value: 'inventory_movements', label: 'Movimientos' },
];

const ACTION_BADGE_MAP = {
  crear: { label: 'Crear', className: 'audit-badge--crear' },
  actualizar: { label: 'Actualizar', className: 'audit-badge--actualizar' },
  eliminar: { label: 'Eliminar', className: 'audit-badge--eliminar' },
  ajustar_stock: { label: 'Ajustar Stock', className: 'audit-badge--ajustar' },
  cambiar_estado: { label: 'Cambiar Estado', className: 'audit-badge--estado' },
  iniciar_sesion: { label: 'Iniciar Sesión', className: 'audit-badge--sesion' },
};

const TABLE_LABEL_MAP = {
  products: 'Productos',
  clients: 'Clientes',
  invoices: 'Facturas',
  users: 'Usuarios',
  inventory_movements: 'Movimientos',
};

const AuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Stats
  const [stats, setStats] = useState({
    totalActions: 0,
    todayActions: 0,
    activeUsers: 0,
    topTable: '—',
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterTable, setFilterTable] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [uniqueUsers, setUniqueUsers] = useState([]);

  // Detail modal
  const [detailModal, setDetailModal] = useState({ open: false, log: null });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      var params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      };

      if (searchTerm) params.search = searchTerm;
      if (filterAction) params.action = filterAction;
      if (filterTable) params.tableName = filterTable;
      if (filterUser) params.userId = filterUser;
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;

      var response = await auditService.getAll(params);
      var responseData = response.data;
      var innerData = responseData.data || responseData;

      var logList = innerData.logs || innerData.audits || innerData.records || [];
      if (!Array.isArray(logList)) {
        logList = Array.isArray(innerData) ? innerData : [];
      }

      var pagination = innerData.pagination || responseData.pagination || {};

      setLogs(logList);
      setTotalPages(pagination.totalPages || Math.ceil((pagination.total || logList.length) / ITEMS_PER_PAGE) || 1);

      // Extract unique users for the filter dropdown
      var usersMap = {};
      logList.forEach(function(log) {
        var u = log.user || log.User || {};
        var uid = u.id || u._id;
        if (uid && !usersMap[uid]) {
          usersMap[uid] = u.name || u.nombre || ('Usuario ' + uid);
        }
      });
      setUniqueUsers(function(prev) {
        var merged = {};
        prev.forEach(function(u) { merged[u.id] = u.name; });
        Object.keys(usersMap).forEach(function(id) { merged[id] = usersMap[id]; });
        return Object.keys(merged).map(function(id) { return { id: id, name: merged[id] }; });
      });
    } catch (err) {
      console.error('Error al cargar registros de auditoría:', err);
      const status = err?.response?.status;
      if (status === 403) {
        setError('No tienes permisos para ver esta sección.');
      } else {
        setError('No se pudieron cargar los registros de auditoría. Intenta nuevamente.');
      }
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterAction, filterTable, filterUser, dateFrom, dateTo]);

  const fetchStats = useCallback(async () => {
    try {
      var response = await auditService.getStats();
      var responseData = response.data;
      var innerData = responseData.data || responseData;

      setStats({
        totalActions: innerData.totalActions || innerData.total || 0,
        todayActions: innerData.todayActions || innerData.today || 0,
        activeUsers: innerData.activeUsers || innerData.users || 0,
        topTable: TABLE_LABEL_MAP[innerData.topTable || innerData.mostModifiedTable] || innerData.topTable || '—',
      });
    } catch (err) {
      console.error('Error al cargar estadísticas de auditoría:', err);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterAction('');
    setFilterTable('');
    setFilterUser('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = searchTerm || filterAction || filterTable || filterUser || dateFrom || dateTo;

  const getActionBadge = (action) => {
    var config = ACTION_BADGE_MAP[action] || { label: action || '—', className: 'audit-badge--default' };
    return (
      <span className={'audit-badge ' + config.className}>
        {config.label}
      </span>
    );
  };

  const getTableLabel = (tableName) => {
    return TABLE_LABEL_MAP[tableName] || tableName || '—';
  };

  const getUserName = (log) => {
    var u = log.user || log.User || {};
    return u.name || u.nombre || '—';
  };

  const handleViewDetail = (log) => {
    setDetailModal({ open: true, log: log });
  };

  const handleCloseDetail = () => {
    setDetailModal({ open: false, log: null });
  };

  const renderJsonTable = (data) => {
    if (!data || typeof data !== 'object') return <span className="audit-detail__empty">Sin datos</span>;

    var keys = Object.keys(data);
    if (keys.length === 0) return <span className="audit-detail__empty">Sin datos</span>;

    return (
      <table className="audit-detail__json-table">
        <thead>
          <tr>
            <th>Campo</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          {keys.map(function(key) {
            var val = data[key];
            var displayVal = val;
            if (val === null || val === undefined) {
              displayVal = '—';
            } else if (typeof val === 'object') {
              displayVal = JSON.stringify(val, null, 2);
            } else {
              displayVal = String(val);
            }
            return (
              <tr key={key}>
                <td className="audit-detail__field-name">{key}</td>
                <td className="audit-detail__field-value">{displayVal}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  const columns = [
    {
      key: 'createdAt',
      label: 'Fecha/Hora',
      render: (value) => (
        <span className="audit-table__date">
          {formatDateTime(value || '') || '—'}
        </span>
      ),
    },
    {
      key: 'user',
      label: 'Usuario',
      render: (_, log) => (
        <span className="audit-table__user">{getUserName(log)}</span>
      ),
    },
    {
      key: 'action',
      label: 'Acción',
      render: (value) => getActionBadge(value),
    },
    {
      key: 'tableName',
      label: 'Tabla',
      render: (value) => (
        <span className="audit-table__table-name">{getTableLabel(value)}</span>
      ),
    },
    {
      key: 'description',
      label: 'Descripción',
      render: (value) => (
        <span className="audit-table__description">
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'detail',
      label: 'Detalle',
      render: (_, log) => (
        <button
          className="audit-table__detail-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetail(log);
          }}
          title="Ver detalle"
          aria-label="Ver detalle"
        >
          <FiEye size={16} />
          <span>Ver</span>
        </button>
      ),
    },
  ];

  var selectedLog = detailModal.log;

  if (loading && logs.length === 0) {
    return (
      <div className="audit-page">
        <div className="audit-page__header">
          <div>
            <h2 className="audit-page__title">Auditoría</h2>
            <p className="audit-page__subtitle">Control y seguimiento de acciones del sistema</p>
          </div>
        </div>
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="audit-page">
      {/* Header */}
      <div className="audit-page__header">
        <div>
          <h2 className="audit-page__title">
            <FiShield className="audit-page__title-icon" size={28} />
            Auditoría
          </h2>
          <p className="audit-page__subtitle">Control y seguimiento de acciones del sistema</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Stats */}
      <div className="audit-page__stats">
        <StatsCard
          title="Total Acciones"
          value={stats.totalActions}
          icon={FiActivity}
          color="var(--primary)"
        />
        <StatsCard
          title="Acciones Hoy"
          value={stats.todayActions}
          icon={FiShield}
          color="var(--success)"
        />
        <StatsCard
          title="Usuarios Activos"
          value={stats.activeUsers}
          icon={FiUsers}
          color="var(--info)"
        />
        <StatsCard
          title="Tabla Más Modificada"
          value={stats.topTable}
          icon={FiDatabase}
          color="var(--warning)"
        />
      </div>

      {/* Filters */}
      <div className="audit-page__filters">
        <div className="audit-page__search">
          <SearchBar
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Buscar por descripción..."
          />
        </div>

        <div className="audit-page__filter-group">
          <div className="audit-page__filter-item">
            <FiFilter size={14} className="audit-page__filter-icon" />
            <select
              className="audit-page__select"
              value={filterAction}
              onChange={(e) => { setFilterAction(e.target.value); setCurrentPage(1); }}
            >
              {ACTION_TYPES.map(function(opt) {
                return <option key={opt.value} value={opt.value}>{opt.label}</option>;
              })}
            </select>
          </div>

          <div className="audit-page__filter-item">
            <select
              className="audit-page__select"
              value={filterTable}
              onChange={(e) => { setFilterTable(e.target.value); setCurrentPage(1); }}
            >
              {TABLE_NAMES.map(function(opt) {
                return <option key={opt.value} value={opt.value}>{opt.label}</option>;
              })}
            </select>
          </div>

          <div className="audit-page__filter-item">
            <select
              className="audit-page__select"
              value={filterUser}
              onChange={(e) => { setFilterUser(e.target.value); setCurrentPage(1); }}
            >
              <option value="">Todos los usuarios</option>
              {uniqueUsers.map(function(u) {
                return <option key={u.id} value={u.id}>{u.name}</option>;
              })}
            </select>
          </div>

          <div className="audit-page__filter-item audit-page__filter-date">
            <label className="audit-page__date-label">Desde</label>
            <input
              type="date"
              className="audit-page__date-input"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="audit-page__filter-item audit-page__filter-date">
            <label className="audit-page__date-label">Hasta</label>
            <input
              type="date"
              className="audit-page__date-input"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {hasActiveFilters && (
            <button
              className="audit-page__clear-btn"
              onClick={handleClearFilters}
              title="Limpiar filtros"
            >
              <FiX size={14} />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="audit-page__table-container">
        {!loading && !error && logs.length === 0 ? (
          <div className="audit-page__empty-state">
            <FiShield size={48} className="audit-page__empty-icon" />
            <p className="audit-page__empty-text">No hay registros de auditoría</p>
            {hasActiveFilters && (
              <p className="audit-page__empty-hint">
                Intenta ajustar los filtros para ver más resultados.
              </p>
            )}
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={logs}
              loading={loading}
              emptyMessage="No hay registros de auditoría"
              onRowClick={handleViewDetail}
            />
            {totalPages > 1 && (
              <div className="audit-page__pagination">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModal.open}
        onClose={handleCloseDetail}
        title="Detalle de Auditoría"
        size="lg"
      >
        {selectedLog && (
          <div className="audit-detail">
            <div className="audit-detail__header-info">
              <div className="audit-detail__row">
                <span className="audit-detail__label">Usuario:</span>
                <span className="audit-detail__value">{getUserName(selectedLog)}</span>
              </div>
              <div className="audit-detail__row">
                <span className="audit-detail__label">Fecha:</span>
                <span className="audit-detail__value">{formatDateTime(selectedLog.createdAt) || '—'}</span>
              </div>
              <div className="audit-detail__row">
                <span className="audit-detail__label">Acción:</span>
                <span className="audit-detail__value">{getActionBadge(selectedLog.action)}</span>
              </div>
              <div className="audit-detail__row">
                <span className="audit-detail__label">Tabla:</span>
                <span className="audit-detail__value">{getTableLabel(selectedLog.tableName)}</span>
              </div>
              {selectedLog.description && (
                <div className="audit-detail__row">
                  <span className="audit-detail__label">Descripción:</span>
                  <span className="audit-detail__value">{selectedLog.description}</span>
                </div>
              )}
            </div>

            {selectedLog.previousValues && Object.keys(selectedLog.previousValues).length > 0 && (
              <div className="audit-detail__section">
                <h4 className="audit-detail__section-title">Valores Anteriores</h4>
                {renderJsonTable(selectedLog.previousValues)}
              </div>
            )}

            {selectedLog.newValues && Object.keys(selectedLog.newValues).length > 0 && (
              <div className="audit-detail__section">
                <h4 className="audit-detail__section-title">Valores Nuevos</h4>
                {renderJsonTable(selectedLog.newValues)}
              </div>
            )}

            {!selectedLog.previousValues && !selectedLog.newValues && (
              <div className="audit-detail__no-changes">
                <p>No hay datos de cambios registrados para esta acción.</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditPage;
