import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus,
  FiPackage,
  FiAlertTriangle,
  FiDollarSign,
  FiEdit2,
  FiTrash2,
  FiSliders,
  FiFilter,
} from 'react-icons/fi';
import { AppContext } from '../../context/AppContext';
import { productService } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import StatsCard from '../../components/common/StatsCard';
import SearchBar from '../../components/common/SearchBar';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import './InventoryList.css';

var CATEGORIES = [
  { value: '', label: 'Todas las categorías' },
  { value: 'alimentos', label: 'Alimentos' },
  { value: 'bebidas', label: 'Bebidas' },
  { value: 'limpieza', label: 'Limpieza' },
  { value: 'otros', label: 'Otros' },
];

var STOCK_TYPES = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'salida', label: 'Salida' },
  { value: 'ajuste', label: 'Ajuste' },
];

var InventoryList = function () {
  var navigate = useNavigate();
  var appCtx = useContext(AppContext);
  var addNotification = appCtx.addNotification;

  /* --- Estado de datos --- */
  var productsState = useState([]);
  var products = productsState[0];
  var setProducts = productsState[1];

  var loadingState = useState(true);
  var pageLoading = loadingState[0];
  var setPageLoading = loadingState[1];

  var errorState = useState(null);
  var errorMsg = errorState[0];
  var setErrorMsg = errorState[1];

  /* --- Estadísticas --- */
  var statsState = useState({ total: 0, lowStock: 0, totalValue: 0 });
  var stats = statsState[0];
  var setStats = statsState[1];

  /* --- Filtros --- */
  var searchState = useState('');
  var search = searchState[0];
  var setSearch = searchState[1];

  var categoryState = useState('');
  var category = categoryState[0];
  var setCategory = categoryState[1];

  var lowStockState = useState(false);
  var showLowStock = lowStockState[0];
  var setShowLowStock = lowStockState[1];

  /* --- Paginación --- */
  var pageState = useState(1);
  var currentPage = pageState[0];
  var setCurrentPage = pageState[1];

  var totalPagesState = useState(1);
  var totalPages = totalPagesState[0];
  var setTotalPages = totalPagesState[1];

  /* --- Modales --- */
  var deleteModalState = useState({ open: false, product: null });
  var deleteModal = deleteModalState[0];
  var setDeleteModal = deleteModalState[1];

  var stockModalState = useState({ open: false, product: null });
  var stockModal = stockModalState[0];
  var setStockModal = stockModalState[1];

  var stockFormState = useState({ tipo: 'entrada', cantidad: '', motivo: '' });
  var stockForm = stockFormState[0];
  var setStockForm = stockFormState[1];

  var actionLoadingState = useState(false);
  var actionLoading = actionLoadingState[0];
  var setActionLoading = actionLoadingState[1];

  /* --- Cargar productos --- */
  var fetchProducts = useCallback(
    async function () {
      setPageLoading(true);
      setErrorMsg(null);

      try {
        var response;

        if (showLowStock) {
          response = await productService.getLowStock();
        } else {
          var params = {
            page: currentPage,
            limit: 10,
          };
          if (search) params.search = search;
          if (category) params.category = category;
          response = await productService.getAll(params);
        }

        var data = response.data;
        var productList = data.products || data.data || [];
        var pagination = data.pagination || {};

        setProducts(productList);
        setTotalPages(pagination.totalPages || 1);

        /* Calcular estadísticas */
        var lowStockCount = productList.filter(function (p) {
          var minStock = p.minStock || p.stockMinimo || 0;
          return p.stock <= minStock;
        }).length;

        var totalValue = productList.reduce(function (sum, p) {
          var precio = p.precio || p.price || 0;
          var stock = p.stock || 0;
          return sum + precio * stock;
        }, 0);

        setStats({
          total: pagination.total || productList.length,
          lowStock: lowStockCount,
          totalValue: totalValue,
        });
      } catch (err) {
        var message =
          (err.response && err.response.data && err.response.data.message) ||
          'Error al cargar los productos';
        setErrorMsg(message);
      } finally {
        setPageLoading(false);
      }
    },
    [currentPage, search, category, showLowStock]
  );

  useEffect(
    function () {
      fetchProducts();
    },
    [fetchProducts]
  );

  /* Reiniciar página al cambiar filtros */
  useEffect(
    function () {
      setCurrentPage(1);
    },
    [search, category, showLowStock]
  );

  /* --- Eliminar producto --- */
  var handleDelete = async function () {
    if (!deleteModal.product) return;
    setActionLoading(true);

    try {
      var productId = deleteModal.product._id || deleteModal.product.id;
      await productService.delete(productId);

      addNotification({
        type: 'success',
        title: 'Producto eliminado',
        message:
          'El producto "' +
          deleteModal.product.nombre +
          '" fue eliminado correctamente.',
      });

      setDeleteModal({ open: false, product: null });
      fetchProducts();
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar el producto. Intenta nuevamente.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  /* --- Ajustar stock --- */
  var handleStockAdjust = async function () {
    if (
      !stockModal.product ||
      !stockForm.cantidad ||
      Number(stockForm.cantidad) <= 0
    ) {
      return;
    }

    setActionLoading(true);

    try {
      var productId = stockModal.product._id || stockModal.product.id;
      await productService.updateStock(productId, {
        cantidad: Number(stockForm.cantidad),
        tipo: stockForm.tipo,
        motivo: stockForm.motivo,
      });

      addNotification({
        type: 'success',
        title: 'Stock actualizado',
        message:
          'El stock de "' +
          stockModal.product.nombre +
          '" fue actualizado correctamente.',
      });

      setStockModal({ open: false, product: null });
      fetchProducts();
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo ajustar el stock. Intenta nuevamente.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  /* --- Abrir modales --- */
  var openStockModal = function (e, product) {
    e.stopPropagation();
    setStockModal({ open: true, product: product });
    setStockForm({ tipo: 'entrada', cantidad: '', motivo: '' });
  };

  var openDeleteModal = function (e, product) {
    e.stopPropagation();
    setDeleteModal({ open: true, product: product });
  };

  /* --- Navegar a edición --- */
  var handleRowClick = function (row) {
    var rowId = row._id || row.id;
    navigate('/inventory/edit/' + rowId);
  };

  /* --- Columnas de la tabla --- */
  var columns = [
    {
      key: 'sku',
      label: 'SKU',
      render: function (val) {
        return <span className="inv-sku">{val || '—'}</span>;
      },
    },
    {
      key: 'nombre',
      label: 'Nombre',
      render: function (val) {
        return <span className="inv-product-name">{val}</span>;
      },
    },
    {
      key: 'categoria',
      label: 'Categoría',
      render: function (val) {
        return (
          <span className="inv-category-badge">
            {val || 'Sin categoría'}
          </span>
        );
      },
    },
    {
      key: 'stock',
      label: 'Stock',
      render: function (val, row) {
        var minStock = row.minStock || row.stockMinimo || 0;
        var isLow = val <= minStock;
        var badgeClass =
          'inv-stock-badge' +
          (isLow ? ' inv-stock-badge--low' : ' inv-stock-badge--ok');
        return <span className={badgeClass}>{val}</span>;
      },
    },
    {
      key: 'stockMinimo',
      label: 'Stock Mín.',
      render: function (val, row) {
        return val || row.minStock || 0;
      },
    },
    {
      key: 'precio',
      label: 'Precio',
      render: function (val) {
        return formatCurrency(val);
      },
    },
    {
      key: 'costo',
      label: 'Costo',
      render: function (val) {
        return formatCurrency(val);
      },
    },
    {
      key: 'estado',
      label: 'Estado',
      render: function (val, row) {
        var stock = row.stock || 0;
        var minStock = row.minStock || row.stockMinimo || 0;

        if (stock === 0) {
          return (
            <span className="inv-status inv-status--danger">Sin stock</span>
          );
        }
        if (stock <= minStock) {
          return (
            <span className="inv-status inv-status--warning">Bajo stock</span>
          );
        }
        return (
          <span className="inv-status inv-status--success">Disponible</span>
        );
      },
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: function (val, row) {
        return (
          <div className="inv-actions">
            <button
              className="inv-action-btn inv-action-btn--stock"
              onClick={function (e) {
                openStockModal(e, row);
              }}
              title="Ajustar stock"
            >
              <FiSliders size={15} />
            </button>
            <button
              className="inv-action-btn inv-action-btn--edit"
              onClick={function (e) {
                e.stopPropagation();
                var rowId = row._id || row.id;
                navigate('/inventory/edit/' + rowId);
              }}
              title="Editar"
            >
              <FiEdit2 size={15} />
            </button>
            <button
              className="inv-action-btn inv-action-btn--delete"
              onClick={function (e) {
                openDeleteModal(e, row);
              }}
              title="Eliminar"
            >
              <FiTrash2 size={15} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="inventory-page">
      {/* Cabecera */}
      <div className="inventory-header">
        <div className="inventory-header__left">
          <h1 className="inventory-title">Inventario</h1>
          <p className="inventory-description">
            Gestiona tus productos y controla el stock
          </p>
        </div>
        <button
          className="inventory-new-btn"
          onClick={function () {
            navigate('/inventory/new');
          }}
        >
          <FiPlus size={18} />
          Nuevo Producto
        </button>
      </div>

      {/* Fila de estadísticas */}
      <div className="inventory-stats">
        <StatsCard
          title="Total Productos"
          value={stats.total}
          icon={FiPackage}
          color="var(--primary)"
        />
        <StatsCard
          title="Bajo Stock"
          value={stats.lowStock}
          icon={FiAlertTriangle}
          color="var(--danger)"
        />
        <StatsCard
          title="Valor Inventario"
          value={formatCurrency(stats.totalValue)}
          icon={FiDollarSign}
          color="var(--secondary)"
        />
      </div>

      {/* Filtros */}
      <div className="inventory-filters">
        <div className="inventory-filters__search">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, SKU..."
          />
        </div>
        <div className="inventory-filters__controls">
          <div className="inventory-filter-select-wrapper">
            <FiFilter size={16} className="inventory-filter-icon" />
            <select
              className="inventory-filter-select"
              value={category}
              onChange={function (e) {
                setCategory(e.target.value);
              }}
            >
              {CATEGORIES.map(function (cat) {
                return (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                );
              })}
            </select>
          </div>

          <label className="inventory-toggle">
            <input
              type="checkbox"
              checked={showLowStock}
              onChange={function (e) {
                setShowLowStock(e.target.checked);
              }}
            />
            <span className="inventory-toggle__slider" />
            <span className="inventory-toggle__label">Solo bajo stock</span>
          </label>
        </div>
      </div>

      {/* Alerta de error */}
      {errorMsg && (
        <div className="inventory-error">
          <Alert
            type="error"
            message={errorMsg}
            onClose={function () {
              setErrorMsg(null);
            }}
          />
        </div>
      )}

      {/* Contenido principal */}
      {pageLoading ? (
        <div className="inventory-loading">
          <Loading size="lg" />
        </div>
      ) : (
        <>
          <div className="inventory-table-container">
            <Table
              columns={columns}
              data={products}
              onRowClick={handleRowClick}
              emptyMessage="No se encontraron productos. Intenta ajustar los filtros o crea un nuevo producto."
              loading={false}
            />
          </div>

          {!showLowStock && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={deleteModal.open}
        onClose={function () {
          setDeleteModal({ open: false, product: null });
        }}
        title="Eliminar Producto"
        size="sm"
        footer={
          <div className="inv-modal-footer">
            <button
              className="inv-modal-btn inv-modal-btn--cancel"
              onClick={function () {
                setDeleteModal({ open: false, product: null });
              }}
              disabled={actionLoading}
            >
              Cancelar
            </button>
            <button
              className="inv-modal-btn inv-modal-btn--danger"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        }
      >
        <div className="inv-delete-content">
          <div className="inv-delete-icon">
            <FiTrash2 size={32} />
          </div>
          <p>
            ¿Estás seguro de que deseas eliminar el producto
            <strong>
              {' '}
              &quot;{deleteModal.product ? deleteModal.product.nombre : ''}&quot;
            </strong>
            ?
          </p>
          <p className="inv-delete-warning">
            Esta acción no se puede deshacer.
          </p>
        </div>
      </Modal>

      {/* Modal de ajuste de stock */}
      <Modal
        isOpen={stockModal.open}
        onClose={function () {
          setStockModal({ open: false, product: null });
        }}
        title="Ajustar Stock"
        size="sm"
        footer={
          <div className="inv-modal-footer">
            <button
              className="inv-modal-btn inv-modal-btn--cancel"
              onClick={function () {
                setStockModal({ open: false, product: null });
              }}
              disabled={actionLoading}
            >
              Cancelar
            </button>
            <button
              className="inv-modal-btn inv-modal-btn--primary"
              onClick={handleStockAdjust}
              disabled={
                actionLoading ||
                !stockForm.cantidad ||
                Number(stockForm.cantidad) <= 0
              }
            >
              {actionLoading ? 'Guardando...' : 'Guardar Ajuste'}
            </button>
          </div>
        }
      >
        <div className="inv-stock-form">
          {stockModal.product && (
            <div className="inv-stock-product-info">
              <span className="inv-stock-product-name">
                Producto: <strong>{stockModal.product.nombre}</strong>
              </span>
              <span className="inv-stock-current">
                Stock actual: {stockModal.product.stock}
              </span>
            </div>
          )}

          <div className="inv-stock-field">
            <label className="inv-stock-label">Tipo de movimiento</label>
            <div className="inv-stock-type-group">
              {STOCK_TYPES.map(function (opt) {
                var isActive = stockForm.tipo === opt.value;
                var btnClass =
                  'inv-stock-type-btn' +
                  (isActive ? ' inv-stock-type-btn--active' : '');
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={btnClass}
                    onClick={function () {
                      setStockForm(function (prev) {
                        return Object.assign({}, prev, { tipo: opt.value });
                      });
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="inv-stock-field">
            <label className="inv-stock-label" htmlFor="stock-cantidad">
              Cantidad
            </label>
            <input
              id="stock-cantidad"
              type="number"
              className="inv-stock-input"
              min="1"
              step="1"
              placeholder="0"
              value={stockForm.cantidad}
              onChange={function (e) {
                setStockForm(function (prev) {
                  return Object.assign({}, prev, { cantidad: e.target.value });
                });
              }}
            />
          </div>

          <div className="inv-stock-field">
            <label className="inv-stock-label" htmlFor="stock-motivo">
              Motivo
            </label>
            <textarea
              id="stock-motivo"
              className="inv-stock-textarea"
              rows="3"
              placeholder="Describe el motivo del ajuste..."
              value={stockForm.motivo}
              onChange={function (e) {
                setStockForm(function (prev) {
                  return Object.assign({}, prev, { motivo: e.target.value });
                });
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InventoryList;
