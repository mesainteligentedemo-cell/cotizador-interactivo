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

function addHeaderAndFooter(
  doc: jsPDF,
  pageNum: number,
  totalPages: number,
  fecha: string,
  companiaName: string = 'MI SUCURSAL'
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`${fecha}`, margin, 10);
  doc.text(`Cotización — ${companiaName}`, pageWidth / 2, 10, { align: 'center' });

  doc.text(`${pageNum}/${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
}

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
  const margin = 15;
  const simbolo = moneda === 'USD' ? 'USD' : 'MXN';
  const fecha = new Date().toLocaleDateString('es-MX');
  const fechaVencimiento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-MX');
  const companiaName = datosCliente.empresa || 'MI EMPRESA';

  // ==================== PÁGINA 1: PORTADA ====================
  addHeaderAndFooter(doc, 1, 4, fecha, companiaName);

  let yPos = 30;

  // Logo placeholder (rectángulo con iniciales)
  doc.setFillColor(0, 85, 165);
  doc.rect(margin, yPos, 15, 15, 'F');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('MI', margin + 7.5, yPos + 10, { align: 'center' });
  yPos += 20;

  // Título principal
  doc.setFontSize(14);
  doc.setTextColor(0, 85, 165);
  doc.setFont('helvetica', 'bold');
  doc.text((companiaName || 'MI EMPRESA').toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;

  // Contacto
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  if (datosCliente.correos.length > 0) {
    doc.text(datosCliente.correos.join(', '), pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
  }
  if (datosCliente.telefono) {
    doc.text(`Tel: ${datosCliente.telefono}`, pageWidth / 2, yPos, { align: 'center' });
  }
  yPos += 10;

  // Bloque azul con fecha
  doc.setFillColor(0, 85, 165);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('---', margin + 5, yPos + 5);
  doc.text(`Fecha: ${fecha}`, pageWidth - margin - 5, yPos + 5, { align: 'right' });
  yPos += 12;

  // Sección Cliente
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', margin, yPos);
  yPos += 4;

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text((datosCliente.nombreComercial || datosCliente.empresa || datosCliente.nombreCompleto).toUpperCase(), margin, yPos);
  yPos += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (datosCliente.telefono) {
    doc.text(`Tel: ${datosCliente.telefono}`, margin, yPos);
    yPos += 4;
  }
  yPos += 3;

  // Narrativa del proyecto
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const narrativa = `Estimada ${datosCliente.nombreCompleto},\nEs un gusto saludarle en nombre de ${companiaName}. Hemos preparado con especial atención esta propuesta para ${proyecto.titulo}, pensando en un sistema que combine tecnología de punta, confiabilidad y la tranquilidad que su proyecto merece.`;
  const narrativaLines = doc.splitTextToSize(narrativa, pageWidth - 2 * margin);
  doc.text(narrativaLines, margin, yPos);
  yPos += narrativaLines.length * 4 + 5;

  // Título proyecto
  doc.setFontSize(14);
  doc.setTextColor(0, 85, 165);
  doc.setFont('helvetica', 'bold');
  doc.text((proyecto.titulo || 'PROYECTO').toUpperCase(), margin, yPos);
  yPos += 6;

  // Descripción del proyecto
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  if (proyecto.descripcion) {
    const descripcionLines = doc.splitTextToSize(proyecto.descripcion, pageWidth - 2 * margin);
    doc.text(descripcionLines, margin, yPos);
    yPos += descripcionLines.length * 4 + 5;
  }

  // Beneficios Clave
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 85, 165);
  doc.text('Beneficios Clave', margin, yPos);
  yPos += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  const beneficios = [
    'Vigilancia continua con visión nocturna IR',
    'Transmisión estable y protegida',
    'Cableado certificado para exterior',
    'Instalación profesional especializada',
  ];

  beneficios.forEach((beneficio) => {
    doc.text('✓ ' + beneficio, margin + 2, yPos);
    yPos += 4;
  });

  // ==================== PÁGINA 2: PRODUCTOS ====================
  doc.addPage();
  addHeaderAndFooter(doc, 2, 4, fecha, companiaName);

  yPos = 30;

  // Tabla header
  const colWidths = {
    producto: 90,
    cant: 18,
    unitario: 28,
    desc: 18,
    subtotal: 35,
  };

  const startX = margin;
  const tableHeaderY = yPos;

  doc.setFillColor(0, 85, 165);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);

  doc.rect(startX, tableHeaderY - 4, pageWidth - 2 * margin, 6, 'F');
  doc.text('PRODUCTO', startX + 2, tableHeaderY);
  doc.text('CANT.', startX + colWidths.producto + 2, tableHeaderY);
  doc.text('P. UNITARIO', startX + colWidths.producto + colWidths.cant + 2, tableHeaderY);
  doc.text('DESC.', startX + colWidths.producto + colWidths.cant + colWidths.unitario + 2, tableHeaderY);
  doc.text('SUBTOTAL', startX + colWidths.producto + colWidths.cant + colWidths.unitario + colWidths.desc + 2, tableHeaderY);

  yPos += 8;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  cart.forEach((item) => {
    if (yPos > pageHeight - 50) {
      doc.addPage();
      addHeaderAndFooter(doc, 2, 4, fecha, companiaName);
      yPos = 30;
    }

    const precioUnitarioFinal = item.product.precio * (1 - item.descuento / 100);
    const importeLinea = precioUnitarioFinal * item.cantidad;
    const descuentoDisplay = item.descuento > 0 && !ocultarDescuento ? `${item.descuento}%` : '—';

    const nombreProducto = `${item.product.nombre}${item.product.codigo ? ` (${item.product.codigo})` : ''}`;
    const productoLines = doc.splitTextToSize(nombreProducto, colWidths.producto - 5);

    const rowHeight = Math.max(5, productoLines.length * 3.5);

    doc.text(productoLines, startX + 2, yPos);
    doc.text(item.cantidad.toString(), startX + colWidths.producto + 2, yPos, { align: 'center' });
    doc.text(`$${precioUnitarioFinal.toLocaleString('es-MX', { maximumFractionDigits: 2 })}`, startX + colWidths.producto + colWidths.cant + 2, yPos, { align: 'right' });
    doc.text(descuentoDisplay, startX + colWidths.producto + colWidths.cant + colWidths.unitario + 2, yPos, { align: 'center' });
    doc.text(`$${importeLinea.toLocaleString('es-MX', { maximumFractionDigits: 2 })}`, startX + colWidths.producto + colWidths.cant + colWidths.unitario + colWidths.desc + 2, yPos, { align: 'right' });

    if (item.notas) {
      yPos += rowHeight;
      doc.setFontSize(8);
      doc.text(`Nota: ${item.notas}`, startX + 5, yPos);
      doc.setFontSize(9);
    }

    yPos += rowHeight + 2;
  });

  yPos += 3;
  doc.setDrawColor(180, 180, 180);
  doc.line(startX, yPos, pageWidth - margin, yPos);
  yPos += 6;

  // Totales
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const totalsStartX = pageWidth - margin - 80;

  doc.text('Subtotal:', totalsStartX, yPos, { align: 'left' });
  doc.setFont('helvetica', 'normal');
  doc.text(`$${subtotal.toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${simbolo}`, pageWidth - margin - 5, yPos, { align: 'right' });
  yPos += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('IVA (16%):', totalsStartX, yPos, { align: 'left' });
  doc.setFont('helvetica', 'normal');
  doc.text(`$${iva.toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${simbolo}`, pageWidth - margin - 5, yPos, { align: 'right' });
  yPos += 7;

  // Total box
  doc.setFillColor(0, 85, 165);
  doc.setTextColor(255, 255, 255);
  doc.rect(totalsStartX - 5, yPos - 3, 85, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL:', totalsStartX, yPos, { align: 'left' });
  doc.text(`$${total.toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${simbolo}`, pageWidth - margin - 5, yPos, { align: 'right' });
  yPos += 10;

  // Aviso vigencia
  doc.setFillColor(255, 240, 220);
  doc.setTextColor(220, 100, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const avisoLines = doc.splitTextToSize(
    `Esta cotización tiene una vigencia de 30 días naturales; después de este período los precios y disponibilidad están sujetos a cambio.`,
    pageWidth - 2 * margin - 4
  );
  doc.rect(margin, yPos - 2, pageWidth - 2 * margin, avisoLines.length * 3 + 2, 'F');
  doc.text(avisoLines, margin + 2, yPos);
  yPos += avisoLines.length * 3 + 5;

  // Vigencia y Método de Pago
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'bold');
  doc.text('VIGENCIA', margin, yPos);
  doc.text('MÉTODO DE PAGO', pageWidth / 2, yPos);
  yPos += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('30 días', margin, yPos);
  doc.text(METODO_PAGO_LABELS[metodoPago], pageWidth / 2, yPos);
  yPos += 3;

  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(`Del ${fecha} al ${fechaVencimiento}`, margin, yPos);

  // ==================== PÁGINA 3: TÉRMINOS Y CONDICIONES ====================
  doc.addPage();
  addHeaderAndFooter(doc, 3, 4, fecha, companiaName);

  yPos = 30;

  // Términos y Condiciones
  const leftBorderX = margin + 3;
  doc.setDrawColor(0, 85, 165);
  doc.setLineWidth(1.5);

  doc.setFontSize(12);
  doc.setTextColor(0, 85, 165);
  doc.setFont('helvetica', 'bold');
  doc.text('Términos y Condiciones', margin + 8, yPos);
  doc.line(leftBorderX, yPos - 3, leftBorderX, yPos + 3);
  yPos += 7;

  const terminos = [
    { titulo: 'Forma de pago:', texto: '80 % de anticipo para iniciar el proyecto y 20 % contra entrega del equipo instalado y funcionando.' },
    { titulo: 'Alcance de la instalación:', texto: 'La propuesta contempla la instalación estándar del sistema de videovigilancia. No incluye readecuaciones, obra civil ni acabados especiales; cualquier modificación adicional será cotizada y negociada por separado.' },
    { titulo: 'Vigencia y precios:', texto: 'Los precios aquí presentados pueden variar sin previo aviso una vez transcurrida la vigencia de esta cotización.' },
    { titulo: 'Facturación:', texto: 'Si requiere factura, favor de enviar su constancia de situación fiscal actualizada para tramitarla correctamente.' },
    { titulo: 'Tiempo de entrega:', texto: 'La instalación se ejecutará en un período de 5 a 7 días hábiles, contados a partir de la aceptación de la propuesta y la confirmación del pago correspondiente.' },
    { titulo: 'Cancelación:', texto: 'En caso de cancelación de la propuesta ya aceptada y pagada, se aplicará una penalización del 20 % sobre el monto total.' },
    { titulo: 'Confirmación de pagos:', texto: 'Para agilizar la aplicación a su cuenta, le solicitamos amablemente enviar el comprobante de pago vía correo electrónico o WhatsApp; de lo contrario, el pago seguirá registrado como pendiente.' },
  ];

  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  doc.setLineWidth(0.5);

  terminos.forEach((item, index) => {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      addHeaderAndFooter(doc, 3, 4, fecha, companiaName);
      yPos = 30;
    }

    doc.setFont('helvetica', 'bold');
    doc.text(item.titulo, margin + 8, yPos);
    yPos += 4;

    doc.setFont('helvetica', 'normal');
    const lineas = doc.splitTextToSize(item.texto, pageWidth - 2 * margin - 8);
    doc.text(lineas, margin + 8, yPos);
    yPos += lineas.length * 3.5 + 3;

    doc.line(leftBorderX, yPos - 2, leftBorderX, yPos + 2);
  });

  yPos += 5;

  // Sobre Nosotros
  doc.setFontSize(12);
  doc.setTextColor(0, 85, 165);
  doc.setFont('helvetica', 'bold');
  doc.text('Sobre Nosotros', margin + 8, yPos);
  doc.line(leftBorderX, yPos - 3, leftBorderX, yPos + 3);
  yPos += 7;

  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(`En ${companiaName} nos respaldan años de experiencia brindando soluciones de seguridad electrónica confiables. Para su comodidad, estos son nuestros datos bancarios:`, margin + 8, yPos);
  yPos += 7;

  const datosBancarios = [
    { titulo: 'Titular:', valor: 'Su Nombre' },
    { titulo: 'Banco:', valor: 'Santander' },
    { titulo: 'Cuenta:', valor: '60556305657' },
    { titulo: 'CLABE:', valor: '014691605563056579' },
    { titulo: 'No. Tarjeta:', valor: '5579 0780 0293 3345' },
  ];

  doc.setFontSize(9);
  datosBancarios.forEach((dato) => {
    doc.setFont('helvetica', 'bold');
    doc.text(dato.titulo, margin + 8, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(dato.valor, margin + 40, yPos);
    yPos += 4;
  });

  yPos += 3;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('Por favor referencie el comprobante de pago con el nombre del proyecto o del cliente para una identificación ágil.', margin + 8, yPos);

  // ==================== PÁGINA 4: CONTACTO FINAL ====================
  doc.addPage();
  addHeaderAndFooter(doc, 4, 4, fecha, companiaName);

  yPos = 60;

  // Bloque azul contacto
  doc.setFillColor(0, 85, 165);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 50, 'F');

  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  const contactoIntro = `WhatsApp y con gusto le brindará asesoría personalizada para que tome la mejor decisión.`;
  const contactoLines = doc.splitTextToSize(contactoIntro, pageWidth - 2 * margin - 8);
  doc.text(contactoLines, margin + 4, yPos);
  yPos += contactoLines.length * 3 + 4;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Nombre del Contacto', margin + 4, yPos);
  yPos += 4;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(companiaName, margin + 4, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(companiaName.toUpperCase(), margin + 4, yPos);
  yPos += 4;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (datosCliente.correos.length > 0) {
    doc.text(datosCliente.correos.join(', '), margin + 4, yPos);
    yPos += 4;
  }
  if (datosCliente.telefono) {
    doc.text(datosCliente.telefono, pageWidth - margin - 5, yPos - 4, { align: 'right' });
  }

  yPos = pageHeight - 50;

  // Footer info
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  const footerLines = [
    datosCliente.rfc ? `${datosCliente.nombreCompleto} • RFC: ${datosCliente.rfc} • ${datosCliente.telefono}` : `${datosCliente.nombreCompleto} • ${datosCliente.telefono}`,
    `${datosCliente.empresa || 'Su Empresa'}`,
  ];
  footerLines.forEach((line, i) => {
    doc.text(line, pageWidth / 2, yPos + i * 3, { align: 'center' });
  });

  const nombreArchivo = `Cotizacion_${datosCliente.nombreCompleto.replace(/\s+/g, '_')}_${fecha.replace(/\//g, '-')}.pdf`;
  doc.save(nombreArchivo);
}