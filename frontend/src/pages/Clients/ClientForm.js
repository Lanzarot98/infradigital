import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiX, FiAlertCircle } from 'react-icons/fi';
import { AppContext } from '../../context/AppContext';
import { clientService } from '../../services/api';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import './ClientForm.css';

const INITIAL_FORM = {
  name: '',
  type: '',
  nit_cc: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  notes: '',
};

const ClientForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addNotification } = useContext(AppContext);
  const isEditing = Boolean(id);

  // Form state
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditing);
  const [submitError, setSubmitError] = useState(null);

  /**
   * Load client data when editing
   */
  useEffect(() => {
    if (!isEditing) return;

    const fetchClient = async () => {
      setPageLoading(true);
      try {
        const response = await clientService.getById(id);
        var responseData = response.data;
        var innerData = responseData.data || responseData;
        const client = innerData.client || innerData;

        setFormData({
          name: client.name || '',
          type: client.type || '',
          nit_cc: client.nit_cc || '',
          email: client.email || '',
          phone: client.phone || '',
          address: client.address || '',
          city: client.city || '',
          notes: client.notes || '',
        });
      } catch (err) {
        console.error('Error al cargar cliente:', err);
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'No se pudo cargar la información del cliente.',
        });
        navigate('/clients');
      } finally {
        setPageLoading(false);
      }
    };

    fetchClient();
  }, [id, isEditing, navigate, addNotification]);

  /**
   * Handle input changes
   */
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));

      if (errors[name]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
    },
    [errors]
  );

  /**
   * Validate form fields
   */
  const validate = useCallback(() => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.type) {
      newErrors.type = 'Selecciona un tipo de persona';
    }

    if (!formData.nit_cc.trim()) {
      newErrors.nit_cc = 'El NIT o cédula es obligatorio';
    } else if (formData.nit_cc.replace(/[^0-9]/g, '').length < 5) {
      newErrors.nit_cc = 'Ingresa un NIT o cédula válido (mínimo 5 dígitos)';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingresa un correo electrónico válido';
    }

    if (
      formData.phone &&
      formData.phone.replace(/[^0-9]/g, '').length > 0 &&
      formData.phone.replace(/[^0-9]/g, '').length < 7
    ) {
      newErrors.phone = 'Ingresa un número de teléfono válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setSubmitError(null);

      if (!validate()) return;

      setLoading(true);

      try {
        const payload = {
          name: formData.name.trim(),
          type: formData.type,
          nit_cc: formData.nit_cc.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          notes: formData.notes.trim(),
        };

        if (isEditing) {
          await clientService.update(id, payload);
          addNotification({
            type: 'success',
            title: 'Cliente actualizado',
            message: 'Los datos del cliente "' + payload.name + '" fueron actualizados.',
          });
        } else {
          await clientService.create(payload);
          addNotification({
            type: 'success',
            title: 'Cliente creado',
            message: 'El cliente "' + payload.name + '" fue creado exitosamente.',
          });
        }

        navigate('/clients');
      } catch (err) {
        console.error('Error al guardar cliente:', err);
        const message =
          (err.response && err.response.data && err.response.data.message) ||
          'No se pudo guardar el cliente. Intenta nuevamente.';
        setSubmitError(message);
      } finally {
        setLoading(false);
      }
    },
    [formData, isEditing, id, validate, navigate, addNotification]
  );

  /**
   * Handle cancel
   */
  const handleCancel = useCallback(() => {
    navigate('/clients');
  }, [navigate]);

  // Page loading state (editing mode)
  if (pageLoading) {
    return (
      <div className="client-form">
        <div className="client-form__header">
          <button
            className="client-form__back-btn"
            onClick={handleCancel}
            title="Volver"
            aria-label="Volver a clientes"
          >
            <FiArrowLeft size={20} />
          </button>
          <div className="client-form__header-text">
            <h2>Cargando cliente...</h2>
          </div>
        </div>
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="client-form">
      {/* Header */}
      <div className="client-form__header">
        <button
          className="client-form__back-btn"
          onClick={handleCancel}
          title="Volver"
          aria-label="Volver a clientes"
        >
          <FiArrowLeft size={20} />
        </button>
        <div className="client-form__header-text">
          <h2>{isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
          <p>
            {isEditing
              ? 'Modifica los datos del cliente y guarda los cambios.'
              : 'Completa los datos para registrar un nuevo cliente.'}
          </p>
        </div>
      </div>

      {/* Submit Error */}
      {submitError && (
        <Alert
          type="error"
          message={submitError}
          onClose={() => setSubmitError(null)}
        />
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div className={'client-form__card' + (loading ? ' client-form__card--loading' : '')}>
          <div className="client-form__grid">
            {/* Section: Información básica */}
            <h4 className="client-form__section-title">Información básica</h4>

            {/* Nombre */}
            <div>
              <label className="client-form__label" htmlFor="name">
                Nombre completo / Razón social
                <span className="client-form__required">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className={
                  'client-form__input' + (errors.name ? ' client-form__input--error' : '')
                }
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Juan Pérez o Empresa S.A.S."
                autoFocus
                disabled={loading}
              />
              {errors.name && (
                <span className="client-form__error">
                  <FiAlertCircle size={12} />
                  {errors.name}
                </span>
              )}
            </div>

            {/* Tipo de persona */}
            <div>
              <label className="client-form__label" htmlFor="type">
                Tipo de persona
                <span className="client-form__required">*</span>
              </label>
              <select
                id="type"
                name="type"
                className={
                  'client-form__select' + (errors.type ? ' client-form__select--error' : '')
                }
                value={formData.type}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Seleccionar tipo...</option>
                <option value="persona_natural">Persona Natural</option>
                <option value="persona_juridica">Persona Jurídica</option>
              </select>
              {errors.type && (
                <span className="client-form__error">
                  <FiAlertCircle size={12} />
                  {errors.type}
                </span>
              )}
            </div>

            {/* NIT/CC */}
            <div>
              <label className="client-form__label" htmlFor="nit_cc">
                NIT / Cédula
                <span className="client-form__required">*</span>
              </label>
              <input
                id="nit_cc"
                name="nit_cc"
                type="text"
                className={
                  'client-form__input' + (errors.nit_cc ? ' client-form__input--error' : '')
                }
                value={formData.nit_cc}
                onChange={handleChange}
                placeholder="Ej: 900123456-7 o 1234567890"
                disabled={loading}
              />
              {errors.nit_cc && (
                <span className="client-form__error">
                  <FiAlertCircle size={12} />
                  {errors.nit_cc}
                </span>
              )}
              <span className="client-form__hint">
                Ingresa el número sin puntos ni guiones
              </span>
            </div>

            {/* Email */}
            <div>
              <label className="client-form__label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={
                  'client-form__input' + (errors.email ? ' client-form__input--error' : '')
                }
                value={formData.email}
                onChange={handleChange}
                placeholder="Ej: cliente@correo.com"
                disabled={loading}
              />
              {errors.email && (
                <span className="client-form__error">
                  <FiAlertCircle size={12} />
                  {errors.email}
                </span>
              )}
            </div>

            {/* Divider */}
            <hr className="client-form__divider" />
            <h4 className="client-form__section-title">Información de contacto</h4>

            {/* Teléfono */}
            <div>
              <label className="client-form__label" htmlFor="phone">
                Teléfono
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className={
                  'client-form__input' + (errors.phone ? ' client-form__input--error' : '')
                }
                value={formData.phone}
                onChange={handleChange}
                placeholder="Ej: 3101234567"
                disabled={loading}
              />
              {errors.phone && (
                <span className="client-form__error">
                  <FiAlertCircle size={12} />
                  {errors.phone}
                </span>
              )}
            </div>

            {/* Ciudad */}
            <div>
              <label className="client-form__label" htmlFor="city">
                Ciudad
              </label>
              <input
                id="city"
                name="city"
                type="text"
                className="client-form__input"
                value={formData.city}
                onChange={handleChange}
                placeholder="Ej: Bogotá"
                disabled={loading}
              />
            </div>

            {/* Dirección */}
            <div className="client-form__field--full">
              <label className="client-form__label" htmlFor="address">
                Dirección
              </label>
              <input
                id="address"
                name="address"
                type="text"
                className="client-form__input"
                value={formData.address}
                onChange={handleChange}
                placeholder="Ej: Calle 123 #45-67, Barrio Centro"
                disabled={loading}
              />
            </div>

            {/* Notas */}
            <div className="client-form__field--full">
              <label className="client-form__label" htmlFor="notes">
                Notas
              </label>
              <textarea
                id="notes"
                name="notes"
                className="client-form__textarea"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Notas adicionales sobre el cliente..."
                rows={3}
                disabled={loading}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="client-form__actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleCancel}
              disabled={loading}
            >
              <FiX size={16} />
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary client-form__submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>Guardando...</>
              ) : (
                <>
                  <FiSave size={16} />
                  {isEditing ? 'Guardar Cambios' : 'Guardar Cliente'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;
