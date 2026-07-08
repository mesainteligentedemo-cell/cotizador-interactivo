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

// Placeholder que jsPDF sustituye al final por el total real de páginas (Page X/Y correcto)
const TOTAL_PAGES_EXP = '{total_pages_count_string}';

const COLOR_BRAND: [number, number, number] = [0, 85, 165];
const COLOR_BRAND_LIGHT: [number, number, number] = [230, 238, 250];
const COLOR_GRAY_BG: [number, number, number] = [245, 246, 248];
const COLOR_GRAY_LABEL: [number, number, number] = [140, 140, 140];
const COLOR_TEXT: [number, number, number] = [30, 30, 30];
const COLOR_TEXT_SOFT: [number, number, number] = [70, 70, 70];

function addHeaderAndFooter(
  doc: jsPDF,
  pageNum: number,
  fecha: string,
  companiaName: string = 'MI SUCURSAL'
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text(`${fecha}`, margin, 10);
  doc.text(`Cotización — ${companiaName}`, pageWidth / 2, 10, { align: 'center' });

  doc.text(`${pageNum}/${TOTAL_PAGES_EXP}`, pageWidth - margin, pageHeight - 8, { align: 'right' });

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

  let paginaActual = 1;

  // ==================== PÁGINA 1: PORTADA ====================
  addHeaderAndFooter(doc, paginaActual, fecha, companiaName);

  let yPos = 30;

  // Logo placeholder (rectángulo con iniciales de la empresa)
  const iniciales = (companiaName || 'MI')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  doc.setFillColor(...COLOR_BRAND);
  doc.rect(margin, yPos, 15, 15, 'F');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(iniciales || 'MI', margin + 7.5, yPos + 10, { align: 'center' });
  yPos += 20;

  // Título principal (nombre de la compañía) — oscuro, no azul, como en la referencia
  doc.setFontSize(14);
  doc.setTextColor(...COLOR_TEXT);
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
    yPos += 4;
  }
  if (datosCliente.rfc) {
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_GRAY_LABEL);
    doc.text(`RFC: ${datosCliente.rfc}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
  }
  yPos += 6;

  // Bloque azul con fecha
  doc.setFillColor(...COLOR_BRAND);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 8, 1.5, 1.5, 'F');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('---', margin + 5, yPos + 5);
  doc.text(`Fecha: ${fecha}`, pageWidth - margin - 5, yPos + 5, { align: 'right' });
  yPos += 14;

  // Sección Cliente — con fondo gris (caja), como en la referencia
  const nombreClienteMostrar = (
    datosCliente.nombreComercial ||
    datosCliente.empresa ||
    datosCliente.nombreCompleto
  ).toUpperCase();

  const clienteBoxY = yPos - 5;
  const clienteBoxHeight = 6 + 5 + (datosCliente.telefono ? 5 : 0) + 5;

  doc.setFillColor(...COLOR_GRAY_BG);
  doc.roundedRect(margin, clienteBoxY, pageWidth - 2 * margin, clienteBoxHeight, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setTextColor(...COLOR_GRAY_LABEL);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', margin + 5, yPos);
  yPos += 6;

  doc.setFontSize(12);
  doc.setTextColor(...COLOR_TEXT);
  doc.setFont('helvetica', 'bold');
  doc.text(nombreClienteMostrar, margin + 5, yPos);
  yPos += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  if (datosCliente.telefono) {
    doc.text(`Tel: ${datosCliente.telefono}`, margin + 5, yPos);
    yPos += 5;
  }

  yPos = clienteBoxY + clienteBoxHeight + 8;

  // Narrativa del proyecto
  doc.setFontSize(10);
  doc.setTextColor(...COLOR_TEXT_SOFT);
  doc.setFont('helvetica', 'normal');
  const narrativa = `Estimada ${datosCliente.nombreCompleto},\nEs un gusto saludarle en nombre de ${companiaName}. Hemos preparado con especial atención esta propuesta para ${proyecto.titulo || 'su proyecto'}, pensando en un sistema que combine tecnología de punta, confiabilidad y la tranquilidad que su proyecto merece.`;
  const narrativaLines = doc.splitTextToSize(narrativa, pageWidth - 2 * margin);
  doc.text(narrativaLines, margin, yPos);
  yPos += narrativaLines.length * 4 + 6;

  // Título proyecto
  doc.setFontSize(14);
  doc.setTextColor(...COLOR_BRAND);
  doc.setFont('helvetica', 'bold');
  doc.text((proyecto.titulo || 'PROYECTO').toUpperCase(), margin, yPos);
  yPos += 6;

  // Descripción del proyecto
  doc.setFontSize(10);
  doc.setTextColor(...COLOR_TEXT_SOFT);
  doc.setFont('helvetica', 'normal');
  if (proyecto.descripcion) {
    const descripcionLines = doc.splitTextToSize(proyecto.descripcion, pageWidth - 2 * margin);
    doc.text(descripcionLines, margin, yPos);
    yPos += descripcionLines.length * 4 + 6;
  }

  // Beneficios Clave — dentro de una caja azul claro, como en la referencia
  const beneficios = [
    'Vigilancia continua con visión nocturna IR',
    'Transmisión estable y protegida',
    'Cableado certificado para exterior',
    'Instalación profesional especializada',
  ];
  const beneficiosBoxY = yPos - 5;
  const beneficiosBoxHeight = 8 + beneficios.length * 4.5 + 4;

  doc.setFillColor(...COLOR_BRAND_LIGHT);
  doc.roundedRect(margin, beneficiosBoxY, pageWidth - 2 * margin, beneficiosBoxHeight, 2, 2, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_BRAND);
  doc.text('Beneficios Clave', margin + 5, yPos);
  yPos += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  beneficios.forEach((beneficio) => {
    // Dibujado como vector en vez de usar el carácter '✓': la fuente base "helvetica" de
    // jsPDF no soporta ese glifo Unicode y lo renderizaba como un apóstrofe corrupto.
    doc.setDrawColor(...COLOR_BRAND);
    doc.setLineWidth(0.5);
    doc.line(margin + 4, yPos - 1.3, margin + 5.2, yPos + 0.2);
    doc.line(margin + 5.2, yPos + 0.2, margin + 7.5, yPos - 3);
    doc.setTextColor(...COLOR_TEXT_SOFT);
    doc.text(beneficio, margin + 10, yPos);
    yPos += 4.5;
  });

  // ==================== PÁGINA 2: PRODUCTOS ====================
  doc.addPage();
  paginaActual++;
  addHeaderAndFooter(doc, paginaActual, fecha, companiaName);

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

  doc.setFillColor(...COLOR_BRAND);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);

  doc.rect(startX, tableHeaderY - 4, pageWidth - 2 * margin, 6, 'F');
  doc.text('PRODUCTO', startX + 2, tableHeaderY);
  doc.text('CANT.', startX + colWidths.producto + 2, tableHeaderY);
  doc.text('P. UNITARIO', startX + colWidths.producto + colWidths.cant + 2, tableHeaderY);
  doc.text('DESC.', startX + colWidths.producto + colWidths.cant + colWidths.unitario + 2, tableHeaderY);
  doc.text(
    'SUBTOTAL',
    startX + colWidths.producto + colWidths.cant + colWidths.unitario + colWidths.desc + 2,
    tableHeaderY
  );

  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  cart.forEach((item, index) => {
    if (yPos > pageHeight - 50) {
      doc.addPage();
      paginaActual++;
      addHeaderAndFooter(doc, paginaActual, fecha, companiaName);
      yPos = 30;
    }

    const precioUnitarioFinal = item.product.precio * (1 - item.descuento / 100);
    const importeLinea = precioUnitarioFinal * item.cantidad;
    const descuentoDisplay = item.descuento > 0 && !ocultarDescuento ? `${item.descuento}%` : '—';

    const nombreProducto = `${item.product.nombre}${item.product.codigo ? ` (${item.product.codigo})` : ''}`;
    const productoLines = doc.splitTextToSize(nombreProducto, colWidths.producto - 5);

    let rowHeight = Math.max(5, productoLines.length * 3.5);
    let notaLines: string[] = [];
    if (item.notas) {
      notaLines = doc.splitTextToSize(`Nota: ${item.notas}`, colWidths.producto - 5);
      rowHeight += notaLines.length * 3;
    }

    // Zebra striping — coincide con el look de la referencia
    if (index % 2 === 1) {
      doc.setFillColor(245, 247, 250);
      doc.rect(startX, yPos - 3.5, pageWidth - 2 * margin, rowHeight + 2, 'F');
    }

    doc.setTextColor(0, 0, 0);
    doc.text(productoLines, startX + 2, yPos);
    doc.text(item.cantidad.toString(), startX + colWidths.producto + 2, yPos, { align: 'center' });
    doc.text(
      `$${precioUnitarioFinal.toLocaleString('es-MX', { maximumFractionDigits: 2 })}`,
      startX + colWidths.producto + colWidths.cant + 2,
      yPos,
      { align: 'right' }
    );
    doc.text(descuentoDisplay, startX + colWidths.producto + colWidths.cant + colWidths.unitario + 2, yPos, {
      align: 'center',
    });
    doc.text(
      `$${importeLinea.toLocaleString('es-MX', { maximumFractionDigits: 2 })}`,
      startX + colWidths.producto + colWidths.cant + colWidths.unitario + colWidths.desc + 2,
      yPos,
      { align: 'right' }
    );

    if (item.notas) {
      yPos += Math.max(5, productoLines.length * 3.5);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(notaLines, startX + 5, yPos);
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      yPos += notaLines.length * 3 + 2;
    } else {
      yPos += rowHeight + 2;
    }
  });

  yPos += 3;
  doc.setDrawColor(180, 180, 180);
  doc.line(startX, yPos, pageWidth - margin, yPos);
  yPos += 6;

  // Totales
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const totalsStartX = pageWidth - margin - 80;

  doc.text('Subtotal:', totalsStartX, yPos, { align: 'left' });
  doc.setFont('helvetica', 'normal');
  doc.text(`$${subtotal.toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${simbolo}`, pageWidth - margin - 5, yPos, {
    align: 'right',
  });
  yPos += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('IVA (16%):', totalsStartX, yPos, { align: 'left' });
  doc.setFont('helvetica', 'normal');
  doc.text(`$${iva.toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${simbolo}`, pageWidth - margin - 5, yPos, {
    align: 'right',
  });
  yPos += 7;

  // Total box
  doc.setFillColor(...COLOR_BRAND);
  doc.setTextColor(255, 255, 255);
  doc.roundedRect(totalsStartX - 5, yPos - 4, 85, 7, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL:', totalsStartX, yPos, { align: 'left' });
  doc.text(`$${total.toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${simbolo}`, pageWidth - margin - 5, yPos, {
    align: 'right',
  });
  yPos += 10;

  // Aviso vigencia — centrado, como en la referencia
  doc.setFillColor(255, 240, 220);
  doc.setTextColor(220, 100, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const avisoLines = doc.splitTextToSize(
    `Esta cotización tiene una vigencia de 30 días naturales; después de este período los precios y disponibilidad están sujetos a cambio.`,
    pageWidth - 2 * margin - 10
  );
  const avisoHeight = avisoLines.length * 4 + 4;
  doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, avisoHeight, 1.5, 1.5, 'F');
  doc.text(avisoLines, pageWidth / 2, yPos, { align: 'center' });
  yPos += avisoHeight + 4;

  // Vigencia y Método de Pago — en cajas grises, como en la referencia
  const boxWidth = (pageWidth - 2 * margin - 6) / 2;
  const infoBoxHeight = 20;

  doc.setFillColor(...COLOR_GRAY_BG);
  doc.roundedRect(margin, yPos - 4, boxWidth, infoBoxHeight, 2, 2, 'F');
  doc.roundedRect(margin + boxWidth + 6, yPos - 4, boxWidth, infoBoxHeight, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setTextColor(...COLOR_GRAY_LABEL);
  doc.setFont('helvetica', 'bold');
  doc.text('VIGENCIA', margin + 5, yPos);
  doc.text('MÉTODO DE PAGO', margin + boxWidth + 11, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLOR_TEXT);
  doc.text('30 días', margin + 5, yPos);
  doc.text(METODO_PAGO_LABELS[metodoPago], margin + boxWidth + 11, yPos);
  yPos += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(`Del ${fecha} al ${fechaVencimiento}`, margin + 5, yPos);

  // ==================== PÁGINA 3: TÉRMINOS Y CONDICIONES ====================
  doc.addPage();
  paginaActual++;
  addHeaderAndFooter(doc, paginaActual, fecha, companiaName);

  yPos = 30;

  const terminos = [
    {
      titulo: 'Forma de pago:',
      texto: '80 % de anticipo para iniciar el proyecto y 20 % contra entrega del equipo instalado y funcionando.',
    },
    {
      titulo: 'Alcance de la instalación:',
      texto:
        'La propuesta contempla la instalación estándar del sistema de videovigilancia. No incluye readecuaciones, obra civil ni acabados especiales; cualquier modificación adicional será cotizada y negociada por separado.',
    },
    {
      titulo: 'Vigencia y precios:',
      texto: 'Los precios aquí presentados pueden variar sin previo aviso una vez transcurrida la vigencia de esta cotización.',
    },
    {
      titulo: 'Facturación:',
      texto: 'Si requiere factura, favor de enviar su constancia de situación fiscal actualizada para tramitarla correctamente.',
    },
    {
      titulo: 'Tiempo de entrega:',
      texto:
        'La instalación se ejecutará en un período de 5 a 7 días hábiles, contados a partir de la aceptación de la propuesta y la confirmación del pago correspondiente.',
    },
    {
      titulo: 'Cancelación:',
      texto: 'En caso de cancelación de la propuesta ya aceptada y pagada, se aplicará una penalización del 20 % sobre el monto total.',
    },
    {
      titulo: 'Confirmación de pagos:',
      texto:
        'Para agilizar la aplicación a su cuenta, le solicitamos amablemente enviar el comprobante de pago vía correo electrónico o WhatsApp; de lo contrario, el pago seguirá registrado como pendiente.',
    },
  ];

  doc.setFontSize(9);
  const terminosTextWidth = pageWidth - 2 * margin - 16;
  let terminosContentHeight = 8; // encabezado
  const terminosLineData = terminos.map((item) => {
    const lineas = doc.splitTextToSize(item.texto, terminosTextWidth);
    const itemHeight = 4 + lineas.length * 3.5 + 4;
    terminosContentHeight += itemHeight;
    return { ...item, lineas };
  });
  terminosContentHeight += 4; // padding inferior

  // Caja gris + barra azul continua (reemplaza los guiones sueltos de la versión anterior)
  const terminosBoxY = yPos - 6;
  doc.setFillColor(...COLOR_GRAY_BG);
  doc.roundedRect(margin, terminosBoxY, pageWidth - 2 * margin, terminosContentHeight, 2, 2, 'F');
  doc.setFillColor(...COLOR_BRAND);
  doc.rect(margin, terminosBoxY, 1.5, terminosContentHeight, 'F');

  doc.setFontSize(12);
  doc.setTextColor(...COLOR_BRAND);
  doc.setFont('helvetica', 'bold');
  doc.text('Términos y Condiciones', margin + 8, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  terminosLineData.forEach((item) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_TEXT);
    doc.text(item.titulo, margin + 8, yPos);
    yPos += 4;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_TEXT_SOFT);
    doc.text(item.lineas, margin + 8, yPos);
    yPos += item.lineas.length * 3.5 + 4;
  });

  yPos = terminosBoxY + terminosContentHeight + 10;

  // Sobre Nosotros — misma caja gris + barra azul
  const datosBancarios = [
    { titulo: 'Titular:', valor: 'Su Nombre' },
    { titulo: 'Banco:', valor: 'Santander' },
    { titulo: 'Cuenta:', valor: '60556305657' },
    { titulo: 'CLABE:', valor: '014691605563056579' },
    { titulo: 'No. Tarjeta:', valor: '5579 0780 0293 3345' },
  ];

  doc.setFontSize(9);
  const sobreNosotrosIntro = `En ${companiaName} nos respaldan años de experiencia brindando soluciones de seguridad electrónica confiables. Para su comodidad, estos son nuestros datos bancarios:`;
  const introLines = doc.splitTextToSize(sobreNosotrosIntro, pageWidth - 2 * margin - 16);

  const notaBancariaTexto =
    'Por favor referencie el comprobante de pago con el nombre del proyecto o del cliente para una identificación ágil.';
  const notaBancariaLines = doc.splitTextToSize(notaBancariaTexto, pageWidth - 2 * margin - 16);

  const sobreNosotrosHeight =
    8 + introLines.length * 4 + 4 + datosBancarios.length * 4 + 3 + notaBancariaLines.length * 3.5 + 4;

  const sobreNosotrosBoxY = yPos - 6;
  doc.setFillColor(...COLOR_GRAY_BG);
  doc.roundedRect(margin, sobreNosotrosBoxY, pageWidth - 2 * margin, sobreNosotrosHeight, 2, 2, 'F');
  doc.setFillColor(...COLOR_BRAND);
  doc.rect(margin, sobreNosotrosBoxY, 1.5, sobreNosotrosHeight, 'F');

  doc.setFontSize(12);
  doc.setTextColor(...COLOR_BRAND);
  doc.setFont('helvetica', 'bold');
  doc.text('Sobre Nosotros', margin + 8, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setTextColor(...COLOR_TEXT_SOFT);
  doc.setFont('helvetica', 'normal');
  doc.text(introLines, margin + 8, yPos);
  yPos += introLines.length * 4 + 4;

  datosBancarios.forEach((dato) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_TEXT);
    doc.text(dato.titulo, margin + 8, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_TEXT_SOFT);
    doc.text(dato.valor, margin + 40, yPos);
    yPos += 4;
  });

  yPos += 3;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text(notaBancariaLines, margin + 8, yPos);

  // ==================== PÁGINA 4: CONTACTO FINAL ====================
  doc.addPage();
  paginaActual++;
  addHeaderAndFooter(doc, paginaActual, fecha, companiaName);

  yPos = 60;

  // Mensaje completo (antes faltaba la primera oración por completo — bug corregido)
  const contactoIntro = `Estamos listos para llevar el proyecto ${(
    proyecto.titulo || 'cotizado'
  ).toUpperCase()} a la realidad. Si tiene alguna duda o desea ajustar algún detalle, comuníquese directamente conmigo. Puede escribirme por WhatsApp y con gusto le brindaré asesoría personalizada para que tome la mejor decisión.`;
  const contactoLines = doc.splitTextToSize(contactoIntro, pageWidth - 2 * margin - 8);

  const bloqueAzulHeight = contactoLines.length * 5 + 6 + 5 + 5 + 6 + 2 + 6 + (datosCliente.correos.length > 0 ? 5 : 0) + 8;

  doc.setFillColor(...COLOR_BRAND);
  doc.roundedRect(margin, yPos - 5, pageWidth - 2 * margin, bloqueAzulHeight, 2, 2, 'F');

  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.text(contactoLines, margin + 4, yPos);
  yPos += contactoLines.length * 5 + 6;

  // Nombre de quien firma la cotización (antes se imprimía literalmente el texto "Nombre del Contacto" — bug corregido)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(datosCliente.nombreCompleto, margin + 4, yPos);
  yPos += 5;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(companiaName, margin + 4, yPos);
  yPos += 6;

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.2);
  doc.line(margin + 4, yPos, pageWidth - margin - 4, yPos);
  yPos += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(companiaName.toUpperCase(), margin + 4, yPos);
  yPos += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (datosCliente.correos.length > 0) {
    doc.text(datosCliente.correos.join(', '), margin + 4, yPos);
  }
  if (datosCliente.telefono) {
    doc.text(datosCliente.telefono, pageWidth - margin - 5, yPos, { align: 'right' });
  }

  yPos = pageHeight - 50;

  // Footer info
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  const footerLines = [
    datosCliente.rfc
      ? `${datosCliente.nombreCompleto} • RFC: ${datosCliente.rfc} • ${datosCliente.telefono}`
      : `${datosCliente.nombreCompleto} • ${datosCliente.telefono}`,
    `${datosCliente.empresa || 'Su Empresa'}`,
  ];
  footerLines.forEach((line, i) => {
    doc.text(line, pageWidth / 2, yPos + i * 3, { align: 'center' });
  });

  // Sustituye el placeholder de todas las páginas por el total real de páginas
  doc.putTotalPages(TOTAL_PAGES_EXP);

  const nombreArchivo = `Cotizacion_${datosCliente.nombreCompleto.replace(/\s+/g, '_')}_${fecha.replace(/\//g, '-')}.pdf`;
  doc.save(nombreArchivo);
}