import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave, FiArrowLeft, FiPackage, FiPercent } from 'react-icons/fi';
import { AppContext } from '../../context/AppContext';
import { productService } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import Alert from '../../components/common/Alert';
import Loading from '../../components/common/Loading';
import Card from '../../components/common/Card';
import './ProductForm.css';

var CATEGORIES = [
  { value: '', label: 'Seleccionar categoría' },
  { value: 'alimentos', label: 'Alimentos' },
  { value: 'bebidas', label: 'Bebidas' },
  { value: 'limpieza', label: 'Limpieza' },
  { value: 'otros', label: 'Otros' },
];

var UNITS = [
  { value: '', label: 'Seleccionar unidad' },
  { value: 'unidad', label: 'Unidad' },
  { value: 'kilogramo', label: 'Kilogramo' },
  { value: 'litro', label: 'Litro' },
  { value: 'metro', label: 'Metro' },
  { value: 'caja', label: 'Caja' },
];

var ProductForm = function () {
  var navigate = useNavigate();
  var params = useParams();
  var id = params.id;
  var appCtx = useContext(AppContext);
  var addNotification = appCtx.addNotification;

  var isEditing = Boolean(id);

  /* --- Estado del formulario --- */
  var formState = useState({
    nombre: '',
    descripcion: '',
    sku: '',
    precio: '',
    costo: '',
    stock: '',
    stockMinimo: '',
    categoria: '',
    unidadMedida: '',
  });
  var formData = formState[0];
  var setFormData = formState[1];

  var loadingState = useState(false);
  var submitLoading = loadingState[0];
  var setSubmitLoading = loadingState[1];

  var fetchState = useState(false);
  var fetchLoading = fetchState[0];
  var setFetchLoading = fetchState[1];

  var errorState = useState(null);
  var errorMsg = errorState[0];
  var setErrorMsg = errorState[1];

  var validationState = useState({});
  var validationErrors = validationState[0];
  var setValidationErrors = validationState[1];

  /* --- Cargar producto para edición --- */
  var fetchProduct = useCallback(
    async function () {
      if (!id) return;

      setFetchLoading(true);
      setErrorMsg(null);

      try {
        var response = await productService.getById(id);
        var product = response.data.product || response.data;

        setFormData({
          nombre: product.nombre || '',
          descripcion: product.descripcion || '',
          sku: product.sku || '',
          precio: product.precio != null ? String(product.precio) : '',
          costo: product.costo != null ? String(product.costo) : '',
          stock: product.stock != null ? String(product.stock) : '',
          stockMinimo:
            product.stockMinimo != null
              ? String(product.stockMinimo)
              : product.minStock != null
              ? String(product.minStock)
              : '',
          categoria: product.categoria || '',
          unidadMedida: product.unidadMedida || '',
        });
      } catch (err) {
        var message =
          (err.response && err.response.data && err.response.data.message) ||
          'Error al cargar el producto';
        setErrorMsg(message);
      } finally {
        setFetchLoading(false);
      }
    },
    [id]
  );

  useEffect(
    function () {
      if (isEditing) {
        fetchProduct();
      }
    },
    [isEditing, fetchProduct]
  );

  /* --- Manejar cambios en campos --- */
  var handleChange = function (e) {
    var fieldName = e.target.name;
    var fieldValue = e.target.value;

    setFormData(function (prev) {
      return Object.assign({}, prev, { [fieldName]: fieldValue });
    });

    if (validationErrors[fieldName]) {
      setValidationErrors(function (prev) {
        var next = Object.assign({}, prev);
        delete next[fieldName];
        return next;
      });
    }
  };

  /* --- Validación --- */
  var validate = function () {
    var errors = {};

    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es obligatorio';
    }

    if (!formData.sku.trim()) {
      errors.sku = 'El SKU es obligatorio';
    }

    if (!formData.precio || Number(formData.precio) <= 0) {
      errors.precio = 'El precio debe ser mayor a 0';
    }

    if (formData.costo === '' || Number(formData.costo) < 0) {
      errors.costo = 'El costo debe ser un valor válido';
    }

    if (!isEditing && formData.stock !== '' && Number(formData.stock) < 0) {
      errors.stock = 'El stock no puede ser negativo';
    }

    if (formData.stockMinimo !== '' && Number(formData.stockMinimo) < 0) {
      errors.stockMinimo = 'El stock mínimo no puede ser negativo';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* --- Enviar formulario --- */
  var handleSubmit = async function (e) {
    e.preventDefault();
    setErrorMsg(null);

    if (!validate()) return;

    setSubmitLoading(true);

    try {
      var payload = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        sku: formData.sku.trim(),
        precio: Number(formData.precio),
        costo: Number(formData.costo),
        stockMinimo: formData.stockMinimo ? Number(formData.stockMinimo) : 0,
        categoria: formData.categoria,
        unidadMedida: formData.unidadMedida,
      };

      if (!isEditing && formData.stock) {
        payload.stock = Number(formData.stock);
      }

      if (isEditing) {
        await productService.update(id, payload);
        addNotification({
          type: 'success',
          title: 'Producto actualizado',
          message:
            'El producto "' + payload.nombre + '" fue actualizado correctamente.',
        });
      } else {
        await productService.create(payload);
        addNotification({
          type: 'success',
          title: 'Producto creado',
          message:
            'El producto "' + payload.nombre + '" fue creado correctamente.',
        });
      }

      navigate('/inventory');
    } catch (err) {
      var message =
        (err.response && err.response.data && err.response.data.message) ||
        (isEditing
          ? 'Error al actualizar el producto'
          : 'Error al crear el producto');
      setErrorMsg(message);
    } finally {
      setSubmitLoading(false);
    }
  };

  /* --- Cálculo del margen de ganancia --- */
  var profitMargin = (function () {
    var precio = Number(formData.precio);
    var costo = Number(formData.costo);
    if (precio > 0 && costo >= 0) {
      var margin = precio - costo;
      var percentage = ((margin / precio) * 100).toFixed(1);
      return { value: margin, percentage: percentage };
    }
    return null;
  })();

  /* --- Estado de carga inicial --- */
  if (fetchLoading) {
    return <Loading size="lg" fullPage />;
  }

  return (
    <div className="product-form-page">
      {/* Cabecera */}
      <div className="product-form-header">
        <div className="product-form-header__left">
          <h1 className="product-form-title">
            <FiPackage size={24} />
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h1>
          <p className="product-form-description">
            {isEditing
              ? 'Modifica la información del producto'
              : 'Completa la información para crear un nuevo producto'}
          </p>
        </div>
      </div>

      {/* Alerta de error */}
      {errorMsg && (
        <div className="product-form-alert">
          <Alert
            type="error"
            message={errorMsg}
            onClose={function () {
              setErrorMsg(null);
            }}
          />
        </div>
      )}

      <form className="product-form" onSubmit={handleSubmit}>
        {/* Información básica */}
        <Card
          title="Información básica"
          subtitle="Datos principales del producto"
        >
          <div className="pf-grid">
            <div className="pf-field pf-field--full">
              <label className="pf-label" htmlFor="pf-nombre">
                Nombre del producto <span className="pf-required">*</span>
              </label>
              <input
                id="pf-nombre"
                name="nombre"
                type="text"
                className={
                  'pf-input' +
                  (validationErrors.nombre ? ' pf-input--error' : '')
                }
                placeholder="Ej: Café Premium 500g"
                value={formData.nombre}
                onChange={handleChange}
                disabled={submitLoading}
              />
              {validationErrors.nombre && (
                <span className="pf-error">{validationErrors.nombre}</span>
              )}
            </div>

            <div className="pf-field pf-field--full">
              <label className="pf-label" htmlFor="pf-descripcion">
                Descripción
              </label>
              <textarea
                id="pf-descripcion"
                name="descripcion"
                className="pf-textarea"
                rows="3"
                placeholder="Descripción opcional del producto..."
                value={formData.descripcion}
                onChange={handleChange}
                disabled={submitLoading}
              />
            </div>

            <div className="pf-field">
              <label className="pf-label" htmlFor="pf-sku">
                SKU <span className="pf-required">*</span>
              </label>
              <input
                id="pf-sku"
                name="sku"
                type="text"
                className={
                  'pf-input' +
                  (validationErrors.sku ? ' pf-input--error' : '')
                }
                placeholder="Ej: PRD-001"
                value={formData.sku}
                onChange={handleChange}
                disabled={submitLoading}
              />
              {validationErrors.sku && (
                <span className="pf-error">{validationErrors.sku}</span>
              )}
            </div>

            <div className="pf-field">
              <label className="pf-label" htmlFor="pf-categoria">
                Categoría
              </label>
              <select
                id="pf-categoria"
                name="categoria"
                className="pf-select"
                value={formData.categoria}
                onChange={handleChange}
                disabled={submitLoading}
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

            <div className="pf-field">
              <label className="pf-label" htmlFor="pf-unidad">
                Unidad de medida
              </label>
              <select
                id="pf-unidad"
                name="unidadMedida"
                className="pf-select"
                value={formData.unidadMedida}
                onChange={handleChange}
                disabled={submitLoading}
              >
                {UNITS.map(function (unit) {
                  return (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </Card>

        {/* Precios e inventario */}
        <Card
          title="Precios e inventario"
          subtitle="Configura precios y stock del producto"
        >
          <div className="pf-grid">
            <div className="pf-field">
              <label className="pf-label" htmlFor="pf-precio">
                Precio de venta <span className="pf-required">*</span>
              </label>
              <div className="pf-input-prefix-wrapper">
                <span className="pf-input-prefix">$</span>
                <input
                  id="pf-precio"
                  name="precio"
                  type="number"
                  className={
                    'pf-input pf-input--with-prefix' +
                    (validationErrors.precio ? ' pf-input--error' : '')
                  }
                  placeholder="0"
                  min="0"
                  step="any"
                  value={formData.precio}
                  onChange={handleChange}
                  disabled={submitLoading}
                />
              </div>
              {validationErrors.precio && (
                <span className="pf-error">{validationErrors.precio}</span>
              )}
            </div>

            <div className="pf-field">
              <label className="pf-label" htmlFor="pf-costo">
                Costo <span className="pf-required">*</span>
              </label>
              <div className="pf-input-prefix-wrapper">
                <span className="pf-input-prefix">$</span>
                <input
                  id="pf-costo"
                  name="costo"
                  type="number"
                  className={
                    'pf-input pf-input--with-prefix' +
                    (validationErrors.costo ? ' pf-input--error' : '')
                  }
                  placeholder="0"
                  min="0"
                  step="any"
                  value={formData.costo}
                  onChange={handleChange}
                  disabled={submitLoading}
                />
              </div>
              {validationErrors.costo && (
                <span className="pf-error">{validationErrors.costo}</span>
              )}
            </div>

            {/* Margen de ganancia */}
            {profitMargin && (
              <div className="pf-field">
                <label className="pf-label">Margen de ganancia</label>
                <div className="pf-margin-display">
                  <div className="pf-margin-icon">
                    <FiPercent size={16} />
                  </div>
                  <div className="pf-margin-info">
                    <span
                      className={
                        'pf-margin-value' +
                        (profitMargin.value >= 0
                          ? ' pf-margin-value--positive'
                          : ' pf-margin-value--negative')
                      }
                    >
                      {formatCurrency(profitMargin.value)}
                    </span>
                    <span className="pf-margin-percentage">
                      {profitMargin.percentage}% de margen
                    </span>
                  </div>
                </div>
              </div>
            )}

            {!isEditing && (
              <div className="pf-field">
                <label className="pf-label" htmlFor="pf-stock">
                  Stock inicial
                </label>
                <input
                  id="pf-stock"
                  name="stock"
                  type="number"
                  className={
                    'pf-input' +
                    (validationErrors.stock ? ' pf-input--error' : '')
                  }
                  placeholder="0"
                  min="0"
                  step="1"
                  value={formData.stock}
                  onChange={handleChange}
                  disabled={submitLoading}
                />
                {validationErrors.stock && (
                  <span className="pf-error">{validationErrors.stock}</span>
                )}
              </div>
            )}

            <div className="pf-field">
              <label className="pf-label" htmlFor="pf-stockMinimo">
                Stock mínimo
              </label>
              <input
                id="pf-stockMinimo"
                name="stockMinimo"
                type="number"
                className={
                  'pf-input' +
                  (validationErrors.stockMinimo ? ' pf-input--error' : '')
                }
                placeholder="0"
                min="0"
                step="1"
                value={formData.stockMinimo}
                onChange={handleChange}
                disabled={submitLoading}
              />
              {validationErrors.stockMinimo && (
                <span className="pf-error">
                  {validationErrors.stockMinimo}
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Botones de acción */}
        <div className="product-form-actions">
          <button
            type="button"
            className="pf-btn pf-btn--cancel"
            onClick={function () {
              navigate('/inventory');
            }}
            disabled={submitLoading}
          >
            <FiArrowLeft size={18} />
            Cancelar
          </button>
          <button
            type="submit"
            className="pf-btn pf-btn--save"
            disabled={submitLoading}
          >
            {submitLoading ? (
              <span className="pf-btn-loading">
                <span className="pf-spinner" />
                {isEditing ? 'Actualizando...' : 'Guardando...'}
              </span>
            ) : (
              <span className="pf-btn-content">
                <FiSave size={18} />
                {isEditing ? 'Actualizar Producto' : 'Guardar Producto'}
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
