import jsPDF from 'jspdf';
import { CartItem } from '@/app/page';

interface DatosCliente {
  nombre: string;
  empresa: string;
  correo: string;
  telefono: string;
}

export async function generarPDF(
  cart: CartItem[],
  datosCliente: DatosCliente,
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

  // ==================== ENCABEZADO ====================
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Cotización', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(datosCliente.nombre, pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;

  // ==================== DATOS DEL CLIENTE ====================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('CLIENTE', margin, yPos);
  yPos += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${datosCliente.empresa || datosCliente.nombre}`, margin, yPos);
  yPos += 4;
  doc.text(`${datosCliente.nombre}`, margin, yPos);
  yPos += 4;

  if (datosCliente.correo) {
    doc.text(`${datosCliente.correo}`, margin, yPos);
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

  // ==================== INTRODUCCIÓN ====================
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const introduccion = doc.splitTextToSize(
    `Estimado cliente,\n\nTe presentamos esta cotización con los productos y servicios seleccionados para tu proyecto. Hemos cuidado cada detalle para asegurar la mejor relación calidad-precio.`,
    pageWidth - 2 * margin
  );
  doc.text(introduccion, margin, yPos);
  yPos += introduccion.length * 4 + 3;

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

  // Encabezados de tabla
  doc.setFillColor(240, 240, 240);
  doc.rect(startX, headerY - 4, pageWidth - 2 * margin, 6, 'F');

  doc.setTextColor(0, 0, 0);
  doc.text('CANT.', startX + 2, headerY);
  doc.text('DESCRIPCIÓN', startX + colWidths.cant + 5, headerY);
  doc.text('P. UNITARIO', startX + colWidths.cant + colWidths.desc + 5, headerY);
  doc.text('SUBTOTAL', startX + colWidths.cant + colWidths.desc + colWidths.unitario + 5, headerY);

  yPos += 8;

  // Filas de productos
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
    const descripcion = doc.splitTextToSize(`${nombre}${codigo}`, colWidths.desc - 5);

    const precioUnitario = `$${item.product.precio.toLocaleString('es-MX')}`;
    const montoSubtotal = `$${(item.product.precio * item.cantidad).toLocaleString('es-MX')}`;

    // Dibuja las filas con altura variable según descripción
    const rowHeight = Math.max(5, descripcion.length * 3.5);

    doc.text(cantidad, startX + 5, yPos);
    doc.text(descripcion, startX + colWidths.cant + 5, yPos);
    doc.text(precioUnitario, startX + colWidths.cant + colWidths.desc + 5, yPos, { align: 'right' });
    doc.text(montoSubtotal, startX + colWidths.cant + colWidths.desc + colWidths.unitario + 10, yPos, { align: 'right' });

    yPos += rowHeight + 2;
  });

  // Línea separadora
  yPos += 2;
  doc.setDrawColor(150, 150, 150);
  doc.line(startX, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // ==================== TOTALES ====================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);

  const totalsX = pageWidth - margin - 40;

  doc.text('Subtotal:', totalsX - 30, yPos, { align: 'right' });
  doc.text(`$${subtotal.toLocaleString('es-MX')} MXN`, pageWidth - margin - 5, yPos, { align: 'right' });
  yPos += 5;

  doc.text('IVA (16%):', totalsX - 30, yPos, { align: 'right' });
  doc.text(`$${iva.toLocaleString('es-MX')} MXN`, pageWidth - margin - 5, yPos, { align: 'right' });
  yPos += 5;

  // Total con fondo
  doc.setFillColor(30, 58, 138);
  doc.setTextColor(255, 255, 255);
  doc.rect(totalsX - 35, yPos - 3, 75, 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', totalsX - 30, yPos, { align: 'right' });
  doc.text(`$${total.toLocaleString('es-MX')} MXN`, pageWidth - margin - 5, yPos, { align: 'right' });
  yPos += 10;

  // ==================== MÉTODO DE PAGO Y TÉRMINOS ====================
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('MÉTODO DE PAGO', margin, yPos);
  yPos += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Transferencia Bancaria', margin, yPos);
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

  // Descargar PDF
  const nombreArchivo = `Cotizacion_${datosCliente.nombre.replace(/\s+/g, '_')}_${fecha.replace(/\//g, '-')}.pdf`;
  doc.save(nombreArchivo);
}