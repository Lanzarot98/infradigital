import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus,
  FiTrash2,
  FiSearch,
  FiUser,
  FiShoppingCart,
  FiFileText,
  FiArrowLeft,
  FiSave,
  FiX,
} from 'react-icons/fi';
import { AuthContext } from '../../context/AuthContext';
import { AppContext } from '../../context/AppContext';
import { invoiceService, productService, clientService } from '../../services/api';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import Loading from '../../components/common/Loading';
import { formatCurrency } from '../../utils/formatters';
import './InvoiceCreate.css';

const IVA_RATE = 0.19;

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
];

const InvoiceCreate = () => {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const { addNotification } = useContext(AppContext);

  // Estado del formulario
  const [selectedClient, setSelectedClient] = useState(null);
  const [items, setItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [notes, setNotes] = useState('');

  // Busqueda de clientes
  const [clientSearch, setClientSearch] = useState('');
  const [allClients, setAllClients] = useState([]);
  const [clientResults, setClientResults] = useState([]);
  const [clientSearchLoading, setClientSearchLoading] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientDropdownRef = useRef(null);
  const clientSearchTimeout = useRef(null);

  // Busqueda de productos (por fila)
  const [productSearch, setProductSearch] = useState({});
  const [productResults, setProductResults] = useState({});
  const [productSearchLoading, setProductSearchLoading] = useState({});
  const [showProductDropdown, setShowProductDropdown] = useState({});
  const productSearchTimeout = useRef({});

  // Estados de carga y errores
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  /**
   * Cargar todos los clientes al montar
   */
  useEffect(function () {
    var cancelled = false;
    setClientSearchLoading(true);
    (async function () {
      try {
        var response = await clientService.getAll({ limit: 500 });
        if (cancelled) return;
        var responseData = response.data;
        var innerData = responseData.data || responseData;
        var clients = innerData.clients || [];
        if (!Array.isArray(clients)) clients = [];
        setAllClients(clients);
        setClientResults(clients);
      } catch (err) {
        if (!cancelled) {
          setAllClients([]);
          setClientResults([]);
        }
      } finally {
        if (!cancelled) setClientSearchLoading(false);
      }
    })();
    return function () { cancelled = true; };
  }, []);

  /**
   * Cerrar dropdowns al hacer clic fuera
   */
  useEffect(function () {
    function handleClickOutside(e) {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target)) {
        setShowClientDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return function () {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /**
   * Filtrar clientes localmente
   */
  const searchClients = useCallback(
    function (query) {
      if (!query || query.trim() === '') {
        setClientResults(allClients);
        setShowClientDropdown(true);
        return;
      }

      var q = query.toLowerCase();
      var filtered = allClients.filter(function (c) {
        var name = (c.name || c.nombre || '').toLowerCase();
        var nit = (c.nit_cc || '').toLowerCase();
        var email = (c.email || '').toLowerCase();
        return name.indexOf(q) !== -1 || nit.indexOf(q) !== -1 || email.indexOf(q) !== -1;
      });
      setClientResults(filtered);
      setShowClientDropdown(true);
    },
    [allClients]
  );

  /**
   * Seleccionar cliente
   */
  const handleSelectClient = useCallback(function (client) {
    setSelectedClient(client);
    setClientSearch(client.name || client.nombre || '');
    setShowClientDropdown(false);
    setErrors(function (prev) {
      var next = { ...prev };
      delete next.client;
      return next;
    });
  }, []);

  /**
   * Limpiar cliente seleccionado
   */
  const handleClearClient = useCallback(function () {
    setSelectedClient(null);
    setClientSearch('');
    setClientResults([]);
  }, []);

  /**
   * Buscar productos para una fila
   */
  const searchProducts = useCallback(
    function (rowIndex, query) {
      var key = 'row_' + rowIndex;

      if (productSearchTimeout.current[key]) {
        clearTimeout(productSearchTimeout.current[key]);
      }

      if (!query || query.length < 2) {
        setProductResults(function (prev) {
          var next = { ...prev };
          delete next[key];
          return next;
        });
        setShowProductDropdown(function (prev) {
          var next = { ...prev };
          next[key] = false;
          return next;
        });
        return;
      }

      setProductSearchLoading(function (prev) {
        return { ...prev, [key]: true };
      });

      productSearchTimeout.current[key] = setTimeout(async function () {
        try {
          var response = await productService.getAll({ search: query, limit: 10 });
          var responseData = response.data;
          var innerData = responseData.data || responseData;
          var products = innerData.products || [];
          if (!Array.isArray(products)) products = [];
          setProductResults(function (prev) {
            return { ...prev, [key]: products };
          });
          setShowProductDropdown(function (prev) {
            return { ...prev, [key]: true };
          });
        } catch (err) {
          setProductResults(function (prev) {
            var next = { ...prev };
            delete next[key];
            return next;
          });
        } finally {
          setProductSearchLoading(function (prev) {
            return { ...prev, [key]: false };
          });
        }
      }, 300);
    },
    [token]
  );

  /**
   * Agregar fila de producto
   */
  const handleAddItem = useCallback(function () {
    setItems(function (prev) {
      return [
        ...prev,
        {
          id: Date.now(),
          producto: null,
          productSearch: '',
          cantidad: 1,
          precioUnitario: 0,
          subtotal: 0,
        },
      ];
    });
  }, []);

  /**
   * Eliminar fila de producto
   */
  const handleRemoveItem = useCallback(function (index) {
    setItems(function (prev) {
      return prev.filter(function (_, i) {
        return i !== index;
      });
    });
    setErrors(function (prev) {
      var next = { ...prev };
      delete next['item_' + index];
      return next;
    });
  }, []);

  /**
   * Seleccionar producto para una fila
   */
  const handleSelectProduct = useCallback(function (index, product) {
    var key = 'row_' + index;

    setItems(function (prev) {
      var updated = [...prev];
      var cantidad = updated[index].cantidad || 1;
      var precio = product.price || product.precio || 0;
      updated[index] = {
        ...updated[index],
        producto: product,
        productSearch: product.name || product.nombre || '',
        precioUnitario: precio,
        subtotal: cantidad * precio,
      };
      return updated;
    });

    setShowProductDropdown(function (prev) {
      return { ...prev, [key]: false };
    });

    setErrors(function (prev) {
      var next = { ...prev };
      delete next['item_' + index];
      return next;
    });
  }, []);

  /**
   * Cambiar cantidad de un item
   */
  const handleQuantityChange = useCallback(function (index, value) {
    var qty = parseInt(value, 10);
    if (isNaN(qty) || qty < 0) qty = 0;

    setItems(function (prev) {
      var updated = [...prev];
      updated[index] = {
        ...updated[index],
        cantidad: qty,
        subtotal: qty * updated[index].precioUnitario,
      };
      return updated;
    });
  }, []);

  /**
   * Cambiar precio unitario de un item
   */
  const handlePriceChange = useCallback(function (index, value) {
    var price = parseFloat(value);
    if (isNaN(price) || price < 0) price = 0;

    setItems(function (prev) {
      var updated = [...prev];
      updated[index] = {
        ...updated[index],
        precioUnitario: price,
        subtotal: updated[index].cantidad * price,
      };
      return updated;
    });
  }, []);

  /**
   * Calculos de totales
   */
  const totals = useMemo(
    function () {
      var subtotal = items.reduce(function (sum, item) {
        return sum + (item.subtotal || 0);
      }, 0);
      var iva = Math.round(subtotal * IVA_RATE);
      var total = subtotal + iva;
      return { subtotal: subtotal, iva: iva, total: total };
    },
    [items]
  );

  /**
   * Validar formulario
   */
  const validateForm = useCallback(
    function () {
      var newErrors = {};

      if (!selectedClient) {
        newErrors.client = 'Debe seleccionar un cliente';
      }

      if (items.length === 0) {
        newErrors.items = 'Debe agregar al menos un producto';
      }

      items.forEach(function (item, index) {
        if (!item.producto) {
          newErrors['item_' + index] = 'Seleccione un producto';
        } else if (item.cantidad <= 0) {
          newErrors['item_' + index] = 'La cantidad debe ser mayor a 0';
        } else if (item.precioUnitario <= 0) {
          newErrors['item_' + index] = 'El precio debe ser mayor a 0';
        }
      });

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [selectedClient, items]
  );

  /**
   * Crear factura
   */
  const handleSubmit = useCallback(
    async function (e) {
      e.preventDefault();

      if (!validateForm()) {
        addNotification({
          type: 'warning',
          title: 'Formulario incompleto',
          message: 'Por favor corrija los errores antes de continuar.',
        });
        return;
      }

      setSubmitting(true);

      try {
        var invoiceData = {
          clientId: String(selectedClient.id || selectedClient._id),
          items: items.map(function (item) {
            return {
              productId: String(item.producto.id || item.producto._id),
              quantity: parseInt(item.cantidad, 10) || 1,
              unitPrice: parseFloat(item.precioUnitario) || 0,
            };
          }),
          paymentMethod: paymentMethod,
          notes: notes || '',
        };

        var response = await invoiceService.create(invoiceData);
        var responseData = response.data;
        var innerData = responseData.data || responseData;
        var created = innerData.invoice || innerData;

        addNotification({
          type: 'success',
          title: 'Factura creada',
          message: 'La factura ha sido creada exitosamente.',
        });

        navigate('/invoices/' + (created.id || created._id));
      } catch (err) {
        var message =
          (err.response && err.response.data && err.response.data.message) ||
          'Error al crear la factura. Intente nuevamente.';
        addNotification({
          type: 'error',
          title: 'Error',
          message: message,
        });
      } finally {
        setSubmitting(false);
      }
    },
    [validateForm, selectedClient, items, totals, paymentMethod, notes, addNotification, navigate]
  );

  return (
    <div className="invoice-create-page">
      {/* Encabezado */}
      <div className="invoice-create-page__header">
        <button
          className="invoice-create-page__back-btn"
          onClick={function () {
            navigate('/invoices');
          }}
        >
          <FiArrowLeft size={18} />
          Volver
        </button>
        <div className="invoice-create-page__header-text">
          <h1 className="invoice-create-page__title">
            <FiFileText size={24} />
            Nueva Factura
          </h1>
          <p className="invoice-create-page__subtitle">
            Complete los datos para crear una nueva factura
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="invoice-create-page__form">
        {/* Seleccion de cliente */}
        <Card title="Información del Cliente" className="invoice-create-page__section">
          <div className="invoice-create-page__client-section">
            {selectedClient ? (
              <div className="invoice-create-page__client-selected">
                <div className="invoice-create-page__client-info">
                  <div className="invoice-create-page__client-avatar">
                    <FiUser size={20} />
                  </div>
                  <div className="invoice-create-page__client-details">
                    <h4 className="invoice-create-page__client-name">
                      {selectedClient.name || selectedClient.nombre}
                    </h4>
                    <p className="invoice-create-page__client-meta">
                      {selectedClient.nit_cc && <span>NIT: {selectedClient.nit_cc}</span>}
                      {selectedClient.email && <span>{selectedClient.email}</span>}
                      {selectedClient.phone && <span>Tel: {selectedClient.phone}</span>}
                    </p>
                    {selectedClient.address && (
                      <p className="invoice-create-page__client-address">
                        {selectedClient.address}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="invoice-create-page__client-clear"
                  onClick={handleClearClient}
                >
                  <FiX size={16} />
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="invoice-create-page__client-search" ref={clientDropdownRef}>
                <div className="invoice-create-page__search-input-wrapper">
                  <FiSearch size={16} className="invoice-create-page__search-icon" />
                  <input
                    type="text"
                    className={
                      'invoice-create-page__search-input' +
                      (errors.client ? ' invoice-create-page__search-input--error' : '')
                    }
                    placeholder="Buscar cliente por nombre, NIT o email..."
                    value={clientSearch}
                    onChange={function (e) {
                      setClientSearch(e.target.value);
                      searchClients(e.target.value);
                    }}
                    onFocus={function () {
                      if (clientSearch.trim() === '') {
                        setClientResults(allClients);
                      }
                      setShowClientDropdown(true);
                    }}
                  />
                  {clientSearchLoading && (
                    <div className="invoice-create-page__search-loading">
                      <Loading size="sm" />
                    </div>
                  )}
                </div>
                {errors.client && (
                  <span className="invoice-create-page__field-error">{errors.client}</span>
                )}

                {showClientDropdown && clientResults.length > 0 && (
                  <ul className="invoice-create-page__dropdown">
                    {clientResults.map(function (client) {
                      return (
                        <li
                          key={client.id || client._id}
                          className="invoice-create-page__dropdown-item"
                          onClick={function () {
                            handleSelectClient(client);
                          }}
                        >
                          <div className="invoice-create-page__dropdown-item-main">
                            <FiUser size={14} />
                            <span>{client.name || client.nombre}</span>
                          </div>
                          <span className="invoice-create-page__dropdown-item-sub">
                            {client.nit_cc || client.email || ''}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {showClientDropdown &&
                  clientResults.length === 0 &&
                  !clientSearchLoading && (
                    <div className="invoice-create-page__dropdown invoice-create-page__dropdown--empty">
                      <p>No se encontraron clientes</p>
                    </div>
                  )}
              </div>
            )}
          </div>
        </Card>

        {/* Productos */}
        <Card
          title="Productos"
          className="invoice-create-page__section"
          headerAction={
            <button
              type="button"
              className="invoice-create-page__add-product-btn"
              onClick={handleAddItem}
            >
              <FiPlus size={16} />
              Agregar Producto
            </button>
          }
        >
          {errors.items && (
            <Alert
              type="warning"
              message={errors.items}
              onClose={function () {
                setErrors(function (prev) {
                  var next = { ...prev };
                  delete next.items;
                  return next;
                });
              }}
            />
          )}

          {items.length === 0 ? (
            <div className="invoice-create-page__empty-items">
              <FiShoppingCart size={40} />
              <p>No hay productos agregados</p>
              <button
                type="button"
                className="invoice-create-page__add-first-btn"
                onClick={handleAddItem}
              >
                <FiPlus size={16} />
                Agregar primer producto
              </button>
            </div>
          ) : (
            <div className="invoice-create-page__items-table-wrapper">
              <table className="invoice-create-page__items-table">
                <thead>
                  <tr>
                    <th className="invoice-create-page__items-th" style={{ minWidth: '250px' }}>
                      Producto
                    </th>
                    <th className="invoice-create-page__items-th" style={{ width: '100px' }}>
                      Cantidad
                    </th>
                    <th className="invoice-create-page__items-th" style={{ width: '150px' }}>
                      Precio Unitario
                    </th>
                    <th className="invoice-create-page__items-th" style={{ width: '130px' }}>
                      Subtotal
                    </th>
                    <th className="invoice-create-page__items-th" style={{ width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(function (item, index) {
                    var rowKey = 'row_' + index;
                    var hasError = errors['item_' + index];

                    return (
                      <tr key={item.id} className={hasError ? 'invoice-create-page__item-row--error' : ''}>
                        <td className="invoice-create-page__items-td">
                          <div className="invoice-create-page__product-search-cell">
                            {item.producto ? (
                              <div className="invoice-create-page__product-selected-cell">
                                <span className="invoice-create-page__product-name-cell">
                                  {item.producto.name || item.producto.nombre}
                                </span>
                                <button
                                  type="button"
                                  className="invoice-create-page__product-clear-cell"
                                  onClick={function () {
                                    setItems(function (prev) {
                                      var updated = [...prev];
                                      updated[index] = {
                                        ...updated[index],
                                        producto: null,
                                        productSearch: '',
                                        precioUnitario: 0,
                                        subtotal: 0,
                                      };
                                      return updated;
                                    });
                                  }}
                                >
                                  <FiX size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="invoice-create-page__product-search-wrapper">
                                <input
                                  type="text"
                                  className="invoice-create-page__product-search-input"
                                  placeholder="Buscar producto..."
                                  value={productSearch[rowKey] || ''}
                                  onChange={function (e) {
                                    var val = e.target.value;
                                    setProductSearch(function (prev) {
                                      return { ...prev, [rowKey]: val };
                                    });
                                    searchProducts(index, val);
                                  }}
                                  onFocus={function () {
                                    if (
                                      productResults[rowKey] &&
                                      productResults[rowKey].length > 0
                                    ) {
                                      setShowProductDropdown(function (prev) {
                                        return { ...prev, [rowKey]: true };
                                      });
                                    }
                                  }}
                                />
                                {productSearchLoading[rowKey] && (
                                  <div className="invoice-create-page__product-search-spinner">
                                    <Loading size="sm" />
                                  </div>
                                )}

                                {showProductDropdown[rowKey] &&
                                  productResults[rowKey] &&
                                  productResults[rowKey].length > 0 && (
                                    <ul className="invoice-create-page__product-dropdown">
                                      {productResults[rowKey].map(function (product) {
                                        return (
                                          <li
                                            key={product.id || product._id}
                                            className="invoice-create-page__product-dropdown-item"
                                            onClick={function () {
                                              handleSelectProduct(index, product);
                                              setProductSearch(function (prev) {
                                                var next = { ...prev };
                                                delete next[rowKey];
                                                return next;
                                              });
                                            }}
                                          >
                                            <span className="invoice-create-page__product-dropdown-name">
                                              {product.name || product.nombre}
                                            </span>
                                            <span className="invoice-create-page__product-dropdown-price">
                                              {formatCurrency(product.price || product.precio || 0)}
                                            </span>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  )}
                              </div>
                            )}
                            {hasError && (
                              <span className="invoice-create-page__cell-error">{hasError}</span>
                            )}
                          </div>
                        </td>
                        <td className="invoice-create-page__items-td">
                          <input
                            type="number"
                            className="invoice-create-page__qty-input"
                            value={item.cantidad}
                            min="1"
                            onChange={function (e) {
                              handleQuantityChange(index, e.target.value);
                            }}
                          />
                        </td>
                        <td className="invoice-create-page__items-td">
                          <input
                            type="number"
                            className="invoice-create-page__price-input"
                            value={item.precioUnitario}
                            min="0"
                            onChange={function (e) {
                              handlePriceChange(index, e.target.value);
                            }}
                          />
                        </td>
                        <td className="invoice-create-page__items-td">
                          <span className="invoice-create-page__subtotal-cell">
                            {formatCurrency(item.subtotal)}
                          </span>
                        </td>
                        <td className="invoice-create-page__items-td">
                          <button
                            type="button"
                            className="invoice-create-page__remove-btn"
                            onClick={function () {
                              handleRemoveItem(index);
                            }}
                            title="Eliminar producto"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Resumen y opciones */}
        <div className="invoice-create-page__bottom-row">
          {/* Opciones de pago y notas */}
          <Card title="Opciones" className="invoice-create-page__options-card">
            <div className="invoice-create-page__options">
              <div className="invoice-create-page__field">
                <label className="invoice-create-page__label">Método de Pago</label>
                <select
                  className="invoice-create-page__select"
                  value={paymentMethod}
                  onChange={function (e) {
                    setPaymentMethod(e.target.value);
                  }}
                >
                  {PAYMENT_METHODS.map(function (method) {
                    return (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="invoice-create-page__field">
                <label className="invoice-create-page__label">Notas</label>
                <textarea
                  className="invoice-create-page__textarea"
                  value={notes}
                  onChange={function (e) {
                    setNotes(e.target.value);
                  }}
                  placeholder="Notas adicionales para la factura..."
                  rows={4}
                />
              </div>
            </div>
          </Card>

          {/* Resumen de totales */}
          <Card title="Resumen" className="invoice-create-page__summary-card">
            <div className="invoice-create-page__summary">
              <div className="invoice-create-page__summary-row">
                <span>Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="invoice-create-page__summary-row">
                <span>IVA (19%)</span>
                <span>{formatCurrency(totals.iva)}</span>
              </div>
              <div className="invoice-create-page__summary-divider"></div>
              <div className="invoice-create-page__summary-row invoice-create-page__summary-row--total">
                <span>Total</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>

            <div className="invoice-create-page__form-actions">
              <button
                type="button"
                className="invoice-create-page__cancel-btn"
                onClick={function () {
                  navigate('/invoices');
                }}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="invoice-create-page__submit-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loading size="sm" />
                    Creando...
                  </>
                ) : (
                  <>
                    <FiSave size={16} />
                    Crear Factura
                  </>
                )}
              </button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default InvoiceCreate;
