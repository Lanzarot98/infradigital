import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPackage,
  FiUsers,
  FiFileText,
  FiDollarSign,
  FiAlertTriangle,
  FiEye,
  FiTrendingUp,
  FiCalendar,
} from 'react-icons/fi';
import {
  AreaChart,
  BarChart,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  Bar,
  Pie,
  Cell,
} from 'recharts';
import { AuthContext } from '../../context/AuthContext';
import { dashboardService, invoiceService } from '../../services/api';
import Card from '../../components/common/Card';
import StatsCard from '../../components/common/StatsCard';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../../utils/formatters';
import './DashboardPage.css';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Estados de datos
  const [summary, setSummary] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [revenueByMethod, setRevenueByMethod] = useState([]);
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);

  // Estados de carga
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /** Formatear la fecha actual */
  const currentDate = useMemo(() => {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formatted = now.toLocaleDateString('es-CO', options);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, []);

  /** Tooltip personalizado para moneda colombiana */
  const CurrencyTooltip = useCallback(({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
      <div className="dashboard-tooltip">
        <p className="dashboard-tooltip__label">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="dashboard-tooltip__value" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }, []);

  /** Tooltip para el PieChart */
  const PieTooltip = useCallback(({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0];
    return (
      <div className="dashboard-tooltip">
        <p className="dashboard-tooltip__label">{data.name}</p>
        <p className="dashboard-tooltip__value" style={{ color: data.payload.fill }}>
          {formatCurrency(data.value)}
        </p>
      </div>
    );
  }, []);

  /** Cargar todos los datos del dashboard */
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Llamadas paralelas a todos los endpoints del dashboard
      const results = await Promise.allSettled([
        dashboardService.getSummary(),
        dashboardService.getSalesTrend(),
        dashboardService.getSalesChart(),
        dashboardService.getTopProducts({ limit: 10 }),
        dashboardService.getRevenueByPaymentMethod(),
        dashboardService.getInventoryAlerts(),
        invoiceService.getAll({ limit: 5 }),
      ]);

      // 0: Resumen general
      if (results[0].status === 'fulfilled') {
        setSummary(results[0].value.data.data);
      }

      // 1: Tendencia de ventas (ultimos 30 dias)
      if (results[1].status === 'fulfilled') {
        const trendData = results[1].value.data.data.salesTrend || [];
        setSalesTrend(
          trendData.map((item) => ({
            fecha: item.date || '',
            ventas: parseFloat(item.dailySales) || 0,
          }))
        );
      }

      // 2: Ingresos mensuales (ultimos 12 meses)
      if (results[2].status === 'fulfilled') {
        const monthlyData = results[2].value.data.data.salesByMonth || [];
        setMonthlyRevenue(
          monthlyData.map((item) => ({
            mes: item.month || '',
            ingresos: parseFloat(item.totalSales) || 0,
          }))
        );
      }

      // 3: Top productos
      if (results[3].status === 'fulfilled') {
        const productsData = results[3].value.data.data.topProducts || [];
        setTopProducts(
          productsData.slice(0, 10).map((item) => ({
            nombre: item.productName || '',
            vendidos: parseInt(item.totalQuantity) || 0,
            ingresos: parseFloat(item.totalRevenue) || 0,
          }))
        );
      }

      // 4: Ingresos por metodo de pago
      if (results[4].status === 'fulfilled') {
        const methodData = results[4].value.data.data.revenueByMethod || [];
        setRevenueByMethod(
          methodData.map((item) => ({
            name: (item.paymentMethod || '').charAt(0).toUpperCase() + (item.paymentMethod || '').slice(1),
            value: parseFloat(item.totalRevenue) || 0,
          }))
        );
      }

      // 5: Alertas de inventario
      if (results[5].status === 'fulfilled') {
        const alertsData = results[5].value.data.data.alerts || [];
        setInventoryAlerts(
          alertsData.map((item) => ({
            id: item.id,
            nombre: item.name || '',
            stock: item.stock || 0,
            stockMinimo: item.minStock || 0,
          }))
        );
      }

      // 6: Facturas recientes
      if (results[6].status === 'fulfilled') {
        const invoicesData = results[6].value.data.data.invoices || [];
        setRecentInvoices(invoicesData.slice(0, 5));
      }
    } catch (err) {
      setError('Error al cargar los datos del dashboard. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Nombre del usuario
  const userName = user ? (user.name || user.email || '') : '';

  // --- Loading ---
  if (loading) {
    return (
      <div className="dashboard-page">
        <Loading fullPage />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Encabezado */}
      <div className="dashboard-page__header">
        <div className="dashboard-page__header-text">
          <h1 className="dashboard-page__title">Dashboard</h1>
          <p className="dashboard-page__welcome">
            Bienvenido, <strong>{userName}</strong>
          </p>
        </div>
        <div className="dashboard-page__header-date">
          <FiCalendar size={16} />
          <span>{currentDate}</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      {/* Stats Cards */}
      <div className="dashboard-page__stats">
        <StatsCard
          title="Total Productos"
          value={summary ? summary.totalProducts : 0}
          icon={FiPackage}
          color="#3b82f6"
        />
        <StatsCard
          title="Total Clientes"
          value={summary ? summary.totalClients : 0}
          icon={FiUsers}
          color="#059669"
        />
        <StatsCard
          title="Facturas Pendientes"
          value={summary ? summary.pendingInvoices : 0}
          icon={FiFileText}
          color="#8b5cf6"
        />
        <StatsCard
          title="Ingresos Totales"
          value={formatCurrency(summary ? summary.totalRevenue : 0)}
          icon={FiDollarSign}
          color="#10b981"
        />
      </div>

      {/* Graficos - Grid 2x2 */}
      <div className="dashboard-page__charts-grid">
        {/* Tendencia de ventas */}
        <Card title="Tendencia de Ventas" subtitle="Ultimos 30 dias" className="dashboard-page__chart-card">
          {salesTrend.length > 0 ? (
            <div className="dashboard-page__chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => {
                      if (val >= 1000000) return '$ ' + (val / 1000000).toFixed(1) + 'M';
                      if (val >= 1000) return '$ ' + (val / 1000).toFixed(0) + 'K';
                      return '$ ' + val;
                    }}
                  />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="ventas"
                    name="Ventas"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#salesGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="dashboard-page__chart-empty">
              <FiTrendingUp size={36} />
              <p>No hay datos de ventas disponibles</p>
            </div>
          )}
        </Card>

        {/* Ingresos mensuales */}
        <Card title="Ingresos Mensuales" subtitle="Ultimos 12 meses" className="dashboard-page__chart-card">
          {monthlyRevenue.length > 0 ? (
            <div className="dashboard-page__chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => {
                      if (val >= 1000000) return '$ ' + (val / 1000000).toFixed(1) + 'M';
                      if (val >= 1000) return '$ ' + (val / 1000).toFixed(0) + 'K';
                      return '$ ' + val;
                    }}
                  />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Bar dataKey="ingresos" name="Ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="dashboard-page__chart-empty">
              <FiTrendingUp size={36} />
              <p>No hay datos de ingresos disponibles</p>
            </div>
          )}
        </Card>

        {/* Top productos */}
        <Card title="Productos Mas Vendidos" subtitle="Top 10" className="dashboard-page__chart-card">
          {topProducts.length > 0 ? (
            <div className="dashboard-page__chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="nombre"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    width={120}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'Ingresos') return formatCurrency(value);
                      return value;
                    }}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                      fontSize: '13px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="vendidos" name="Unidades Vendidas" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="dashboard-page__chart-empty">
              <FiPackage size={36} />
              <p>No hay datos de productos disponibles</p>
            </div>
          )}
        </Card>

        {/* Ingresos por metodo de pago */}
        <Card title="Ingresos por Metodo de Pago" subtitle="Distribucion actual" className="dashboard-page__chart-card">
          {revenueByMethod.length > 0 && revenueByMethod.some((m) => m.value > 0) ? (
            <div className="dashboard-page__chart-container dashboard-page__chart-container--pie">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueByMethod}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    label={(entry) => entry.name}
                    labelLine={{ stroke: '#94a3b8' }}
                  >
                    {revenueByMethod.map((entry, index) => (
                      <Cell key={'cell-' + index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend formatter={(value) => <span style={{ color: '#64748b', fontSize: '13px' }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="dashboard-page__chart-empty">
              <FiDollarSign size={36} />
              <p>No hay datos de metodos de pago disponibles</p>
            </div>
          )}
        </Card>
      </div>

      {/* Seccion inferior: Alertas y Facturas recientes */}
      <div className="dashboard-page__bottom-row">
        {/* Alertas de inventario */}
        <Card
          title="Alertas de Inventario"
          subtitle="Productos con stock bajo"
          className="dashboard-page__alerts-card"
          headerAction={
            <span className="dashboard-page__alerts-count">
              {inventoryAlerts.length} {inventoryAlerts.length === 1 ? 'producto' : 'productos'}
            </span>
          }
        >
          {inventoryAlerts.length > 0 ? (
            <div className="dashboard-page__alerts-list">
              {inventoryAlerts.map((product, index) => {
                const stockPercent = product.stockMinimo > 0
                  ? Math.round((product.stock / product.stockMinimo) * 100)
                  : 0;
                const isCritical = product.stock === 0;
                const isLow = stockPercent <= 50;

                return (
                  <div
                    key={product.id || index}
                    className={'dashboard-page__alert-item' + (isCritical ? ' dashboard-page__alert-item--critical' : '')}
                  >
                    <div className="dashboard-page__alert-info">
                      <div className="dashboard-page__alert-icon-wrapper">
                        <FiAlertTriangle
                          size={16}
                          className={
                            isCritical
                              ? 'dashboard-page__alert-icon--critical'
                              : isLow
                              ? 'dashboard-page__alert-icon--warning'
                              : 'dashboard-page__alert-icon--info'
                          }
                        />
                      </div>
                      <div className="dashboard-page__alert-text">
                        <span className="dashboard-page__alert-name">{product.nombre}</span>
                        <span className="dashboard-page__alert-stock">
                          Stock: <strong>{product.stock}</strong> / Minimo: <strong>{product.stockMinimo}</strong>
                        </span>
                      </div>
                    </div>
                    <div className="dashboard-page__alert-actions">
                      <div className="dashboard-page__alert-bar-wrapper">
                        <div
                          className={
                            'dashboard-page__alert-bar' +
                            (isCritical
                              ? ' dashboard-page__alert-bar--critical'
                              : isLow
                              ? ' dashboard-page__alert-bar--warning'
                              : ' dashboard-page__alert-bar--ok')
                          }
                          style={{ width: Math.min(stockPercent, 100) + '%' }}
                        />
                      </div>
                      <button
                        className="dashboard-page__alert-link"
                        onClick={() => navigate('/inventory/edit/' + product.id)}
                      >
                        <FiEye size={14} />
                        Ver
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="dashboard-page__alerts-empty">
              <FiPackage size={32} />
              <p>No hay alertas de inventario</p>
              <span>Todos los productos tienen stock suficiente</span>
            </div>
          )}
        </Card>

        {/* Facturas recientes */}
        <Card
          title="Facturas Recientes"
          subtitle="Ultimas 5 facturas"
          className="dashboard-page__recent-card"
          headerAction={
            <button className="dashboard-page__view-all-btn" onClick={() => navigate('/invoices')}>
              Ver todas
            </button>
          }
        >
          {recentInvoices.length > 0 ? (
            <div className="dashboard-page__recent-table-wrapper">
              <table className="dashboard-page__recent-table">
                <thead>
                  <tr>
                    <th>Nro. Factura</th>
                    <th>Cliente</th>
                    <th className="dashboard-page__recent-th--right">Total</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((invoice, index) => {
                    const clientName = invoice.client ? invoice.client.name : 'Sin cliente';
                    return (
                      <tr
                        key={invoice.id || index}
                        className="dashboard-page__recent-row"
                        onClick={() => navigate('/invoices/' + invoice.id)}
                      >
                        <td>
                          <span className="dashboard-page__recent-number">{invoice.invoiceNumber || 'N/A'}</span>
                        </td>
                        <td>
                          <span className="dashboard-page__recent-client">{clientName}</span>
                        </td>
                        <td className="dashboard-page__recent-td--right">
                          <strong>{formatCurrency(invoice.total || 0)}</strong>
                        </td>
                        <td>
                          <span className={'dashboard-page__recent-badge ' + getStatusColor(invoice.status)}>
                            {getStatusLabel(invoice.status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dashboard-page__recent-empty">
              <FiFileText size={32} />
              <p>No hay facturas recientes</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
