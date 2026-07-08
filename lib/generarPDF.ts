import jsPDF from 'jspdf';
import { CartItem, DatosCliente, MetodoPago, Proyecto } from './types';

const METODO_PAGO_LABELS: Record<MetodoPago, string> = {
  tarjeta_credito: 'Tarjeta de Crédito',
  tarjeta_debito: 'Tarjeta de Débito',
  contado: 'Contado',
  cheque: 'Cheque',
  transferencia: 'Transferencia',
  credito: 'Crédito',
};

export async function generarPDF(
  cart: CartItem[],
  datosCliente: DatosCliente,
  proyecto: Proyecto,
  metodoPago: MetodoPago,
  moneda: 'USD' | 'MXN',
  ocultarDescuento: boolean,
  subtotal: number,
  iva: number,
  total: number
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;
  const simbolo = moneda === 'USD' ? 'USD' : 'MXN';

  // ==================== ENCABEZADO ====================
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(proyecto.titulo || 'Cotización', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(datosCliente.nombreCompleto, pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;

  // ==================== DATOS DEL CLIENTE ====================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('CLIENTE', margin, yPos);
  yPos += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${datosCliente.empresa || datosCliente.nombreCompleto}`, margin, yPos);
  yPos += 4;
  doc.text(`${datosCliente.nombreCompleto}`, margin, yPos);
  yPos += 4;

  if (datosCliente.rfc) {
    doc.text(`RFC: ${datosCliente.rfc}`, margin, yPos);
    yPos += 4;
  }

  if (datosCliente.correos.length > 0) {
    doc.text(`${datosCliente.correos.join(', ')}`, margin, yPos);
    yPos += 4;
  }

  if (datosCliente.telefono) {
    doc.text(`Tel: ${datosCliente.telefono}`, margin, yPos);
    yPos += 4;
  }

  yPos += 3;

  // ==================== FECHA Y VIGENCIA ====================
  const fecha = new Date().toLocaleDateString('es-MX');
  const fechaVencimiento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-MX');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Fecha: ${fecha}`, margin, yPos);
  yPos += 4;
  doc.text(`Vigencia: 30 días (${fecha} al ${fechaVencimiento})`, margin, yPos);
  yPos += 8;

  // ==================== DESCRIPCIÓN DEL PROYECTO ====================
  if (proyecto.descripcion) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const descripcion = doc.splitTextToSize(proyecto.descripcion, pageWidth - 2 * margin);
    doc.text(descripcion, margin, yPos);
    yPos += descripcion.length * 4 + 3;
  }

  // ==================== TABLA DE PRODUCTOS ====================
  yPos += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);

  const colWidths = {
    cant: 15,
    desc: 75,
    unitario: 30,
    subtotal: 30,
  };

  const startX = margin;
  const headerY = yPos;

  doc.setFillColor(0, 85, 165);
  doc.setTextColor(255, 255, 255);
  doc.rect(startX, headerY - 4, pageWidth - 2 * margin, 6, 'F');

  doc.text('CANT.', startX + 2, headerY);
  doc.text('DESCRIPCIÓN', startX + colWidths.cant + 5, headerY);
  doc.text('P. UNITARIO', startX + colWidths.cant + colWidths.desc + 5, headerY);
  doc.text('SUBTOTAL', startX + colWidths.cant + colWidths.desc + colWidths.unitario + 5, headerY);

  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  cart.forEach((item) => {
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = margin;
    }

    const cantidad = item.cantidad.toString();
    const nombre = item.product.nombre;
    const codigo = item.product.codigo ? ` (${item.product.codigo})` : '';
    const notaTexto = item.notas ? `\nNota: ${item.notas}` : '';
    const precioUnitarioFinal = item.product.precio * (1 - item.descuento / 100);
    const importeLinea = precioUnitarioFinal * item.cantidad;

    const descuentoTexto = !ocultarDescuento && item.descuento !== 0 ? ` [Desc: ${item.descuento}%]` : '';
    const descripcion = doc.splitTextToSize(
      `${nombre}${codigo}${descuentoTexto}${notaTexto}`,
      colWidths.desc - 5
    );

    const precioUnitarioTexto = `$${precioUnitarioFinal.toLocaleString('es-MX', { maximumFractionDigits: 2 })}`;
    const montoSubtotal = `$${importeLinea.toLocaleString('es-MX', { maximumFractionDigits: 2 })}`;

    const rowHeight = Math.max(5, descripcion.length * 3.5);

    doc.text(cantidad, startX + 5, yPos);
    doc.text(descripcion, startX + colWidths.cant + 5, yPos);
    doc.text(precioUnitarioTexto, startX + colWidths.cant + colWidths.desc + 5, yPos, { align: 'right' });
    doc.text(montoSubtotal, startX + colWidths.cant + colWidths.desc + colWidths.unitario + 10, yPos, { align: 'right' });

    yPos += rowHeight + 2;
  });

  yPos += 2;
  doc.setDrawColor(150, 150, 150);
  doc.line(startX, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // ==================== TOTALES ====================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);

  const totalsX = pageWidth - margin - 40;

  doc.text('Subtotal:', totalsX - 30, yPos, { align: 'right' });
  doc.text(`$${subtotal.toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${simbolo}`, pageWidth - margin - 5, yPos, { align: 'right' });
  yPos += 5;

  doc.text('IVA (16%):', totalsX - 30, yPos, { align: 'right' });
  doc.text(`$${iva.toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${simbolo}`, pageWidth - margin - 5, yPos, { align: 'right' });
  yPos += 5;

  doc.setFillColor(0, 85, 165);
  doc.setTextColor(255, 255, 255);
  doc.rect(totalsX - 35, yPos - 3, 75, 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', totalsX - 30, yPos, { align: 'right' });
  doc.text(`$${total.toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${simbolo}`, pageWidth - margin - 5, yPos, { align: 'right' });
  yPos += 10;

  // ==================== MÉTODO DE PAGO Y TÉRMINOS ====================
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('MÉTODO DE PAGO', margin, yPos);
  yPos += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(METODO_PAGO_LABELS[metodoPago], margin, yPos);
  yPos += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TÉRMINOS Y CONDICIONES', margin, yPos);
  yPos += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const terminos = [
    '• Vigencia: 30 días naturales. Después los precios pueden variar.',
    '• Forma de pago: 80% de anticipo para iniciar, 20% contra entrega.',
    '• Tiempo de entrega: 5-7 días hábiles desde aceptación y confirmación de pago.',
    '• Cancelación: Penalización del 20% sobre monto total si se cancela después de aceptada.',
    '• Incluye instalación profesional y configuración del sistema.',
    '• No incluye obra civil ni readecuaciones especiales (se cotizarán por separado).',
  ];

  terminos.forEach((termino) => {
    const linea = doc.splitTextToSize(termino, pageWidth - 2 * margin - 5);
    doc.text(linea, margin + 2, yPos);
    yPos += linea.length * 3 + 1;
  });

  yPos += 3;

  // ==================== PIE DE PÁGINA ====================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CONFIRMACIÓN DE PAGO', margin, yPos);
  yPos += 3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const piePagina = doc.splitTextToSize(
    'Para agilizar la aplicación a su cuenta, envíe el comprobante de pago por correo o WhatsApp.',
    pageWidth - 2 * margin
  );
  doc.text(piePagina, margin, yPos);
  yPos += piePagina.length * 3 + 3;

  // ==================== NOTA FINAL ====================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Los precios en esta cotización pueden variar según disponibilidad y tipo de cambio.', margin, pageHeight - 12);

  const nombreArchivo = `Cotizacion_${datosCliente.nombreCompleto.replace(/\s+/g, '_')}_${fecha.replace(/\//g, '-')}.pdf`;
  doc.save(nombreArchivo);
}