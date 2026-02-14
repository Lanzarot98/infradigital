import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiX, FiAlertCircle } from 'react-icons/fi';
import { AppContext } from '../../context/AppContext';
import { clientService } from '../../services/api';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import './ClientForm.css';

const INITIAL_FORM = {
  nombre: '',
  tipo: '',
  nit: '',
  email: '',
  telefono: '',
  direccion: '',
  ciudad: '',
  notas: '',
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
        const client = response.data.client || response.data;

        setFormData({
          nombre: client.nombre || '',
          tipo: client.tipo || '',
          nit: client.nit || '',
          email: client.email || '',
          telefono: client.telefono || '',
          direccion: client.direccion || '',
          ciudad: client.ciudad || '',
          notas: client.notas || '',
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

      // Clear error for this field when user types
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

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.tipo) {
      newErrors.tipo = 'Selecciona un tipo de persona';
    }

    if (!formData.nit.trim()) {
      newErrors.nit = 'El NIT o cédula es obligatorio';
    } else if (formData.nit.replace(/[^0-9]/g, '').length < 5) {
      newErrors.nit = 'Ingresa un NIT o cédula válido (mínimo 5 dígitos)';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingresa un correo electrónico válido';
    }

    if (
      formData.telefono &&
      formData.telefono.replace(/[^0-9]/g, '').length > 0 &&
      formData.telefono.replace(/[^0-9]/g, '').length < 7
    ) {
      newErrors.telefono = 'Ingresa un número de teléfono válido';
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
          nombre: formData.nombre.trim(),
          tipo: formData.tipo,
          nit: formData.nit.trim(),
          email: formData.email.trim(),
          telefono: formData.telefono.trim(),
          direccion: formData.direccion.trim(),
          ciudad: formData.ciudad.trim(),
          notas: formData.notas.trim(),
        };

        if (isEditing) {
          await clientService.update(id, payload);
          addNotification({
            type: 'success',
            title: 'Cliente actualizado',
            message: 'Los datos del cliente "' + payload.nombre + '" fueron actualizados.',
          });
        } else {
          await clientService.create(payload);
          addNotification({
            type: 'success',
            title: 'Cliente creado',
            message: 'El cliente "' + payload.nombre + '" fue creado exitosamente.',
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
              <label className="client-form__label" htmlFor="nombre">
                Nombre completo / Razón social
                <span className="client-form__required">*</span>
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                className={
                  'client-form__input' + (errors.nombre ? ' client-form__input--error' : '')
                }
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Juan Pérez o Empresa S.A.S."
                autoFocus
                disabled={loading}
              />
              {errors.nombre && (
                <span className="client-form__error">
                  <FiAlertCircle size={12} />
                  {errors.nombre}
                </span>
              )}
            </div>

            {/* Tipo de persona */}
            <div>
              <label className="client-form__label" htmlFor="tipo">
                Tipo de persona
                <span className="client-form__required">*</span>
              </label>
              <select
                id="tipo"
                name="tipo"
                className={
                  'client-form__select' + (errors.tipo ? ' client-form__select--error' : '')
                }
                value={formData.tipo}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Seleccionar tipo...</option>
                <option value="natural">Persona Natural</option>
                <option value="juridica">Persona Jurídica</option>
              </select>
              {errors.tipo && (
                <span className="client-form__error">
                  <FiAlertCircle size={12} />
                  {errors.tipo}
                </span>
              )}
            </div>

            {/* NIT/CC */}
            <div>
              <label className="client-form__label" htmlFor="nit">
                NIT / Cédula
                <span className="client-form__required">*</span>
              </label>
              <input
                id="nit"
                name="nit"
                type="text"
                className={
                  'client-form__input' + (errors.nit ? ' client-form__input--error' : '')
                }
                value={formData.nit}
                onChange={handleChange}
                placeholder="Ej: 900123456-7 o 1234567890"
                disabled={loading}
              />
              {errors.nit && (
                <span className="client-form__error">
                  <FiAlertCircle size={12} />
                  {errors.nit}
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
              <label className="client-form__label" htmlFor="telefono">
                Teléfono
              </label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                className={
                  'client-form__input' + (errors.telefono ? ' client-form__input--error' : '')
                }
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Ej: 3101234567"
                disabled={loading}
              />
              {errors.telefono && (
                <span className="client-form__error">
                  <FiAlertCircle size={12} />
                  {errors.telefono}
                </span>
              )}
            </div>

            {/* Ciudad */}
            <div>
              <label className="client-form__label" htmlFor="ciudad">
                Ciudad
              </label>
              <input
                id="ciudad"
                name="ciudad"
                type="text"
                className="client-form__input"
                value={formData.ciudad}
                onChange={handleChange}
                placeholder="Ej: Bogotá"
                disabled={loading}
              />
            </div>

            {/* Dirección */}
            <div className="client-form__field--full">
              <label className="client-form__label" htmlFor="direccion">
                Dirección
              </label>
              <input
                id="direccion"
                name="direccion"
                type="text"
                className="client-form__input"
                value={formData.direccion}
                onChange={handleChange}
                placeholder="Ej: Calle 123 #45-67, Barrio Centro"
                disabled={loading}
              />
            </div>

            {/* Notas */}
            <div className="client-form__field--full">
              <label className="client-form__label" htmlFor="notas">
                Notas
              </label>
              <textarea
                id="notas"
                name="notas"
                className="client-form__textarea"
                value={formData.notas}
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
