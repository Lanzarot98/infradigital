import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiFileText,
  FiDownload,
  FiRefreshCw,
  FiUser,
  FiMapPin,
  FiPhone,
  FiMail,
  FiCalendar,
  FiCreditCard,
} from 'react-icons/fi';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { AuthContext } from '../../context/AuthContext';
import { AppContext } from '../../context/AppContext';
import { invoiceService } from '../../services/api';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import Loading from '../../components/common/Loading';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusColor,
  getStatusLabel,
  getStatusConfig,
  formatNIT,
} from '../../utils/formatters';
import './InvoiceDetail.css';

const STATUS_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'pagada', label: 'Pagada' },
  { value: 'anulada', label: 'Anulada' },
  { value: 'vencida', label: 'Vencida' },
];

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { addNotification } = useContext(AppContext);

  // Estados
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal de cambio de estado
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  /**
   * Cargar factura por ID
   */
  const fetchInvoice = useCallback(
    async function () {
      setLoading(true);
      setError(null);

      try {
        var response = await invoiceService.getById(id);
        var responseData = response.data;
        var innerData = responseData.data || responseData;
        var data = innerData.invoice || innerData;
        setInvoice(data);
        setNewStatus(data.status || 'pendiente');
      } catch (err) {
        var message =
          (err.response && err.response.data && err.response.data.message) ||
          'Error al cargar la factura';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(
    function () {
      if (id) {
        fetchInvoice();
      }
    },
    [id, fetchInvoice]
  );

  /**
   * Cambiar estado de factura
   */
  const handleStatusChange = useCallback(
    async function () {
      if (!newStatus || newStatus === invoice.status) {
        setStatusModal(false);
        return;
      }

      setStatusLoading(true);

      try {
        await invoiceService.updateStatus(id, newStatus);
        addNotification({
          type: 'success',
          title: 'Estado actualizado',
          message: 'La factura ha sido marcada como ' + getStatusLabel(newStatus).toLowerCase() + '.',
        });
        fetchInvoice();
        setStatusModal(false);
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
        setStatusLoading(false);
      }
    },
    [id, newStatus, invoice, addNotification, fetchInvoice]
  );

  /**
   * Generar y descargar PDF de la factura
   */
  const handleDownloadPDF = useCallback(
    function () {
      if (!invoice) return;

      var doc = new jsPDF();
      var pageWidth = doc.internal.pageSize.getWidth();

      // --- Encabezado de la empresa ---
      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, pageWidth, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('InfraDigital', 20, 18);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema de Gestión Empresarial', 20, 26);
      doc.text('NIT: 900.000.000-0 | info@infradigital.com', 20, 33);

      // --- Titulo de factura ---
      doc.setTextColor(30, 64, 175);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('FACTURA DE VENTA', pageWidth - 20, 55, { align: 'right' });

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('No. ' + (invoice.invoiceNumber || 'N/A'), pageWidth - 20, 63, { align: 'right' });

      // --- Informacion de la factura ---
      var infoY = 55;
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Fecha de emisión:', 20, infoY);
      doc.setFont('helvetica', 'normal');
      doc.text(formatDate(invoice.issueDate || invoice.createdAt), 75, infoY);

      infoY += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Estado:', 20, infoY);
      doc.setFont('helvetica', 'normal');
      doc.text(getStatusLabel(invoice.status), 75, infoY);

      if (invoice.paymentMethod) {
        infoY += 8;
        doc.setFont('helvetica', 'bold');
        doc.text('Método de pago:', 20, infoY);
        doc.setFont('helvetica', 'normal');
        var metodoLabel = invoice.paymentMethod.charAt(0).toUpperCase() + invoice.paymentMethod.slice(1);
        doc.text(metodoLabel, 75, infoY);
      }

      // --- Linea divisora ---
      infoY += 12;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(20, infoY, pageWidth - 20, infoY);

      // --- Datos del cliente ---
      infoY += 10;
      doc.setFillColor(241, 245, 249);
      doc.rect(20, infoY - 5, pageWidth - 40, 35, 'F');

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Datos del Cliente', 25, infoY + 2);

      var clienteNombre = '';
      var clienteNit = '';
      var clienteDireccion = '';
      var clienteTelefono = '';
      var clienteEmail = '';

      if (invoice.client) {
        var cli = typeof invoice.client === 'object' ? invoice.client : {};
        clienteNombre = cli.name || cli.nombre || '';
        clienteNit = cli.nit_cc || '';
        clienteDireccion = cli.address || cli.direccion || '';
        clienteTelefono = cli.phone || cli.telefono || '';
        clienteEmail = cli.email || '';
      }

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);

      var clientY = infoY + 10;
      if (clienteNombre) {
        doc.setFont('helvetica', 'bold');
        doc.text('Nombre: ', 25, clientY);
        doc.setFont('helvetica', 'normal');
        doc.text(clienteNombre, 55, clientY);
        clientY += 6;
      }
      if (clienteNit) {
        doc.setFont('helvetica', 'bold');
        doc.text('NIT/CC: ', 25, clientY);
        doc.setFont('helvetica', 'normal');
        doc.text(String(clienteNit), 55, clientY);
        clientY += 6;
      }

      if (clienteDireccion) {
        doc.setFont('helvetica', 'bold');
        doc.text('Dirección: ', pageWidth / 2, infoY + 10);
        doc.setFont('helvetica', 'normal');
        doc.text(clienteDireccion, pageWidth / 2 + 30, infoY + 10);
      }
      if (clienteTelefono) {
        doc.setFont('helvetica', 'bold');
        doc.text('Teléfono: ', pageWidth / 2, infoY + 16);
        doc.setFont('helvetica', 'normal');
        doc.text(String(clienteTelefono), pageWidth / 2 + 30, infoY + 16);
      }
      if (clienteEmail) {
        doc.setFont('helvetica', 'bold');
        doc.text('Email: ', pageWidth / 2, infoY + 22);
        doc.setFont('helvetica', 'normal');
        doc.text(clienteEmail, pageWidth / 2 + 30, infoY + 22);
      }

      // --- Tabla de productos ---
      var tableStartY = infoY + 42;

      var items = invoice.items || [];
      var tableBody = items.map(function (item, idx) {
        var nombre = '';
        if (item.productName) {
          nombre = item.productName;
        } else {
          nombre = item.productName || item.name || '';
        }

        return [
          (idx + 1).toString(),
          nombre,
          (item.quantity || 0).toString(),
          formatCurrency(item.unitPrice || 0),
          formatCurrency(item.subtotal || (item.quantity || 0) * (item.unitPrice || 0)),
        ];
      });

      doc.autoTable({
        startY: tableStartY,
        head: [['#', 'Producto', 'Cantidad', 'Precio Unitario', 'Subtotal']],
        body: tableBody,
        margin: { left: 20, right: 20 },
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center',
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [51, 65, 85],
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 15 },
          1: { halign: 'left' },
          2: { halign: 'center', cellWidth: 25 },
          3: { halign: 'right', cellWidth: 40 },
          4: { halign: 'right', cellWidth: 40 },
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        theme: 'grid',
        styles: {
          lineColor: [226, 232, 240],
          lineWidth: 0.3,
        },
      });

      // --- Totales ---
      var finalY = doc.lastAutoTable.finalY + 10;
      var totalsX = pageWidth - 80;

      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.rect(totalsX - 10, finalY - 5, 70, 42, 'FD');

      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal:', totalsX - 5, finalY + 3);
      doc.text(formatCurrency(invoice.subtotal || 0), pageWidth - 25, finalY + 3, {
        align: 'right',
      });

      finalY += 10;
      doc.text('IVA (19%):', totalsX - 5, finalY + 3);
      doc.text(formatCurrency(invoice.taxAmount || 0), pageWidth - 25, finalY + 3, {
        align: 'right',
      });

      finalY += 10;
      doc.setDrawColor(30, 64, 175);
      doc.setLineWidth(0.5);
      doc.line(totalsX - 5, finalY, pageWidth - 20, finalY);

      finalY += 8;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text('TOTAL:', totalsX - 5, finalY + 3);
      doc.text(formatCurrency(invoice.total || 0), pageWidth - 25, finalY + 3, {
        align: 'right',
      });

      // --- Notas ---
      if (invoice.notes) {
        finalY += 20;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 65, 85);
        doc.text('Notas:', 20, finalY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        var splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 40);
        doc.text(splitNotes, 20, finalY + 7);
      }

      // --- Pie de pagina ---
      var footerY = doc.internal.pageSize.getHeight() - 20;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'Factura generada por InfraDigital - Sistema de Gestión Empresarial para MiPyMEs',
        pageWidth / 2,
        footerY,
        { align: 'center' }
      );
      doc.text(
        'Este documento es una representación impresa de la factura electrónica.',
        pageWidth / 2,
        footerY + 5,
        { align: 'center' }
      );

      // --- Descargar ---
      var filename = 'Factura_' + (invoice.invoiceNumber || 'sin-numero').replace(/\s/g, '_') + '.pdf';
      doc.save(filename);

      addNotification({
        type: 'success',
        title: 'PDF generado',
        message: 'La factura ha sido descargada como PDF.',
      });
    },
    [invoice, addNotification]
  );

  // --- Loading ---
  if (loading) {
    return (
      <div className="invoice-detail-page">
        <Loading fullPage />
      </div>
    );
  }

  // --- Error ---
  if (error) {
    return (
      <div className="invoice-detail-page">
        <div className="invoice-detail-page__header">
          <button
            className="invoice-detail-page__back-btn"
            onClick={function () {
              navigate('/invoices');
            }}
          >
            <FiArrowLeft size={18} />
            Volver a Facturas
          </button>
        </div>
        <Alert type="error" message={error} />
      </div>
    );
  }

  if (!invoice) return null;

  var cliente = invoice.client || {};
  if (typeof cliente === 'string') {
    cliente = { name: cliente };
  }

  var statusConfig = getStatusConfig(invoice.status);
  var items = invoice.items || [];

  return (
    <div className="invoice-detail-page">
      {/* Encabezado */}
      <div className="invoice-detail-page__header">
        <button
          className="invoice-detail-page__back-btn"
          onClick={function () {
            navigate('/invoices');
          }}
        >
          <FiArrowLeft size={18} />
          Volver a Facturas
        </button>

        <div className="invoice-detail-page__header-row">
          <div className="invoice-detail-page__header-info">
            <h1 className="invoice-detail-page__title">
              <FiFileText size={24} />
              Factura {invoice.invoiceNumber || 'N/A'}
            </h1>
            <div className="invoice-detail-page__meta">
              <span className="invoice-detail-page__date">
                <FiCalendar size={14} />
                {formatDateTime(invoice.issueDate || invoice.createdAt)}
              </span>
              <span
                className="invoice-detail-page__status-badge"
                style={{
                  backgroundColor: statusConfig.bgColor,
                  color: statusConfig.textColor,
                }}
              >
                {statusConfig.label}
              </span>
            </div>
          </div>

          <div className="invoice-detail-page__header-actions">
            <button
              className="invoice-detail-page__action-btn invoice-detail-page__action-btn--secondary"
              onClick={function () {
                setStatusModal(true);
              }}
            >
              <FiRefreshCw size={16} />
              Cambiar Estado
            </button>
            <button
              className="invoice-detail-page__action-btn invoice-detail-page__action-btn--primary"
              onClick={handleDownloadPDF}
            >
              <FiDownload size={16} />
              Descargar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="invoice-detail-page__content">
        {/* Informacion del cliente */}
        <Card title="Información del Cliente" className="invoice-detail-page__client-card">
          <div className="invoice-detail-page__client">
            <div className="invoice-detail-page__client-avatar">
              <FiUser size={24} />
            </div>
            <div className="invoice-detail-page__client-data">
              <h3 className="invoice-detail-page__client-name">
                {cliente.name || 'Sin cliente'}
              </h3>
              <div className="invoice-detail-page__client-fields">
                {(cliente.nit_cc) && (
                  <div className="invoice-detail-page__client-field">
                    <FiFileText size={14} />
                    <span>NIT/CC: {formatNIT(cliente.nit_cc) || cliente.nit_cc}</span>
                  </div>
                )}
                {cliente.email && (
                  <div className="invoice-detail-page__client-field">
                    <FiMail size={14} />
                    <span>{cliente.email}</span>
                  </div>
                )}
                {(cliente.phone) && (
                  <div className="invoice-detail-page__client-field">
                    <FiPhone size={14} />
                    <span>{cliente.phone}</span>
                  </div>
                )}
                {(cliente.address) && (
                  <div className="invoice-detail-page__client-field">
                    <FiMapPin size={14} />
                    <span>{cliente.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Tabla de items */}
        <Card title="Detalle de Productos" className="invoice-detail-page__items-card">
          <div className="invoice-detail-page__items-wrapper">
            <table className="invoice-detail-page__items-table">
              <thead>
                <tr>
                  <th className="invoice-detail-page__th">#</th>
                  <th className="invoice-detail-page__th">Producto</th>
                  <th className="invoice-detail-page__th invoice-detail-page__th--right">
                    Cantidad
                  </th>
                  <th className="invoice-detail-page__th invoice-detail-page__th--right">
                    Precio Unitario
                  </th>
                  <th className="invoice-detail-page__th invoice-detail-page__th--right">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map(function (item, idx) {
                  var nombre = '';
                  if (item.productName) {
                    nombre = item.productName;
                  } else if (item.producto && typeof item.producto === 'object') {
                    nombre = item.producto.name || '';
                  } else {
                    nombre = item.name || '';
                  }

                  var precio = item.unitPrice || 0;
                  var cantidad = item.quantity || 0;
                  var sub = item.subtotal || precio * cantidad;

                  return (
                    <tr key={idx}>
                      <td className="invoice-detail-page__td invoice-detail-page__td--center">
                        {idx + 1}
                      </td>
                      <td className="invoice-detail-page__td">
                        <span className="invoice-detail-page__product-name">{nombre}</span>
                      </td>
                      <td className="invoice-detail-page__td invoice-detail-page__td--right">
                        {cantidad}
                      </td>
                      <td className="invoice-detail-page__td invoice-detail-page__td--right">
                        {formatCurrency(precio)}
                      </td>
                      <td className="invoice-detail-page__td invoice-detail-page__td--right">
                        <strong>{formatCurrency(sub)}</strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="invoice-detail-page__totals">
            <div className="invoice-detail-page__totals-row">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.subtotal || 0)}</span>
            </div>
            <div className="invoice-detail-page__totals-row">
              <span>IVA (19%)</span>
              <span>{formatCurrency(invoice.taxAmount || 0)}</span>
            </div>
            <div className="invoice-detail-page__totals-divider"></div>
            <div className="invoice-detail-page__totals-row invoice-detail-page__totals-row--total">
              <span>Total</span>
              <span>{formatCurrency(invoice.total || 0)}</span>
            </div>
          </div>
        </Card>

        {/* Informacion adicional */}
        {(invoice.paymentMethod || invoice.notes) && (
          <Card title="Información Adicional" className="invoice-detail-page__extra-card">
            <div className="invoice-detail-page__extra">
              {invoice.paymentMethod && (
                <div className="invoice-detail-page__extra-item">
                  <FiCreditCard size={16} />
                  <div>
                    <strong>Método de Pago</strong>
                    <p>
                      {invoice.paymentMethod.charAt(0).toUpperCase() + invoice.paymentMethod.slice(1)}
                    </p>
                  </div>
                </div>
              )}
              {invoice.notes && (
                <div className="invoice-detail-page__extra-item">
                  <FiFileText size={16} />
                  <div>
                    <strong>Notas</strong>
                    <p>{invoice.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Modal cambio de estado */}
      <Modal
        isOpen={statusModal}
        onClose={function () {
          if (!statusLoading) {
            setStatusModal(false);
          }
        }}
        title="Cambiar Estado de Factura"
        size="sm"
        footer={
          <div className="invoice-detail-page__modal-footer">
            <button
              className="invoice-detail-page__modal-btn invoice-detail-page__modal-btn--cancel"
              onClick={function () {
                setStatusModal(false);
              }}
              disabled={statusLoading}
            >
              Cancelar
            </button>
            <button
              className="invoice-detail-page__modal-btn invoice-detail-page__modal-btn--primary"
              onClick={handleStatusChange}
              disabled={statusLoading || newStatus === invoice.status}
            >
              {statusLoading ? 'Actualizando...' : 'Actualizar Estado'}
            </button>
          </div>
        }
      >
        <div className="invoice-detail-page__status-form">
          <p className="invoice-detail-page__status-current">
            Estado actual:{' '}
            <span
              className="invoice-detail-page__status-badge-inline"
              style={{
                backgroundColor: statusConfig.bgColor,
                color: statusConfig.textColor,
              }}
            >
              {statusConfig.label}
            </span>
          </p>

          <label className="invoice-detail-page__status-label">Nuevo estado:</label>
          <select
            className="invoice-detail-page__status-select"
            value={newStatus}
            onChange={function (e) {
              setNewStatus(e.target.value);
            }}
          >
            {STATUS_OPTIONS.map(function (opt) {
              return (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              );
            })}
          </select>
        </div>
      </Modal>
    </div>
  );
};

export default InvoiceDetail;
