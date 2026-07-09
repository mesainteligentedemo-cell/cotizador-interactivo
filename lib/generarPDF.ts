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

// Datos de la empresa que emite la cotización — SIEMPRE fijos, nunca dependen de
// `datosCliente` (que representa al cliente que RECIBE la cotización, no a quien la emite).
// Se usan en el encabezado (portada + header/footer de cada página) y en el bloque de
// cierre/firma, para que la identidad de quien cotiza nunca cambie de una cotización a otra.
const HEADER_EMPRESA = 'HIMAYA SISTEMAS EDUARDO EFREN PIMENTEL AGUIRRE';
const HEADER_EMAILS = 'eduardo@himayasist.com,aranza@himayasist.com,turno_mat@himayasist.com';
const HEADER_TELEFONO = '9982063719';
const HEADER_CONTACTO = 'EDUARDO EFREN PIMENTEL AGUIRRE';
const HEADER_RFC = 'PIAE641027GT2';

// Términos y Condiciones — texto fijo, siempre igual sin importar la cotización.
const TERMINOS_FIJOS = [
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

// Datos Bancarios — siempre los mismos, sin importar la cotización.
const DATOS_BANCARIOS_FIJOS = [
  { titulo: 'Titular:', valor: 'Eduardo Pimentel Aguirre' },
  { titulo: 'Banco:', valor: 'Santander' },
  { titulo: 'Cuenta:', valor: '60556305657' },
  { titulo: 'CLABE:', valor: '014691605563056579' },
  { titulo: 'No. Tarjeta:', valor: '5579 0780 0293 3345' },
];

function addHeaderAndFooter(
  doc: jsPDF,
  pageNum: number,
  fecha: string,
  companiaName: string = 'MI SUCURSAL'
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text(`${fecha}`, margin, 9);
  doc.text(`Cotización — ${companiaName}`, pageWidth / 2, 9, { align: 'center' });

  doc.text(`${pageNum}/${TOTAL_PAGES_EXP}`, pageWidth - margin, pageHeight - 7, { align: 'right' });

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
}

// Construye el documento jsPDF completo (todas las páginas) sin guardarlo ni exportarlo
// todavía. `generarPDF` y `generarPDFBlob` reutilizan esta función para no duplicar el
// dibujado del PDF — uno lo guarda directo a disco, el otro lo entrega como Blob en memoria
// (para adjuntarlo/abrirlo desde el cliente de correo sin pasar por el disco primero).
//
// ARQUITECTURA — FLOW LAYOUT DINÁMICO (como HTML):
//   El contenido fluye de arriba a abajo. NO hay `doc.addPage()` hardcodeados por sección.
//   Una página nueva solo se crea cuando el siguiente bloque no cabe en el espacio restante
//   (`checkPageBreak`). Resultado: PDFs compactos que se adaptan al contenido — sin espacios
//   en blanco grandes, sea la cotización de 1 producto o de 100.
async function construirDocumentoPDF(
  cart: CartItem[],
  datosCliente: DatosCliente,
  proyecto: Proyecto,
  metodoPago: MetodoPago,
  moneda: 'USD' | 'MXN',
  ocultarDescuento: boolean,
  subtotal: number,
  iva: number,
  total: number
): Promise<{ doc: jsPDF; nombreArchivo: string }> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - 2 * margin;
  const simbolo = moneda === 'USD' ? 'USD' : 'MXN';
  const fecha = new Date().toLocaleDateString('es-MX');
  const fechaVencimiento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-MX');
  // La empresa que emite la cotización es SIEMPRE la misma — no depende de datosCliente
  // (que es el cliente al que se le cotiza). Se usa en portada, header/footer de cada
  // página, logo y bloque de cierre/firma.
  const companiaName = HEADER_EMPRESA;

  // Límites verticales del área de contenido (entre header y footer).
  const contentTop = 22;
  const contentBottom = pageHeight - 14;

  let paginaActual = 1;
  let yPos = contentTop;

  // ---------------------------------------------------------------------------
  // checkPageBreak: núcleo del flow layout. Si el bloque que viene (`requiredSpace`
  // en mm) no cabe en lo que resta de la página, crea una página nueva, repinta el
  // header/footer y reinicia yPos arriba. Si cabe, no hace nada. Devuelve true si
  // saltó de página (útil, p. ej., para repintar el encabezado de la tabla).
  // ---------------------------------------------------------------------------
  function checkPageBreak(requiredSpace: number): boolean {
    if (yPos + requiredSpace > contentBottom) {
      doc.addPage();
      paginaActual++;
      addHeaderAndFooter(doc, paginaActual, fecha, companiaName);
      yPos = contentTop;
      return true;
    }
    return false;
  }

  // ==================== PORTADA (encabezado del documento) ====================
  addHeaderAndFooter(doc, paginaActual, fecha, companiaName);

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
  yPos += 17;

  // Título principal (nombre de la compañía) — oscuro, no azul, como en la referencia
  doc.setFontSize(14);
  doc.setTextColor(...COLOR_TEXT);
  doc.setFont('helvetica', 'bold');
  doc.text((companiaName || 'MI EMPRESA').toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;

  // Contacto — fijo, siempre los mismos datos de la empresa que emite (HEADER_*).
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(HEADER_EMAILS, pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  doc.text(`Tel: ${HEADER_TELEFONO}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_GRAY_LABEL);
  doc.text(`RFC: ${HEADER_RFC}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  yPos += 4;

  // Bloque azul con fecha
  doc.setFillColor(...COLOR_BRAND);
  doc.roundedRect(margin, yPos, contentWidth, 8, 1.5, 1.5, 'F');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('COTIZACIÓN', margin + 5, yPos + 5);
  doc.text(`Fecha: ${fecha}`, pageWidth - margin - 5, yPos + 5, { align: 'right' });
  yPos += 12;

  // Sección Cliente — caja gris. Se calcula la altura primero y se mantiene unida.
  const nombreClienteMostrar = (
    datosCliente.nombreComercial ||
    datosCliente.empresa ||
    datosCliente.nombreCompleto
  ).toUpperCase();

  const clienteBoxHeight = 5 + 5 + (datosCliente.telefono ? 4 : 0) + 4;
  checkPageBreak(clienteBoxHeight + 4);

  const clienteBoxY = yPos - 3;
  doc.setFillColor(...COLOR_GRAY_BG);
  doc.roundedRect(margin, clienteBoxY, contentWidth, clienteBoxHeight, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setTextColor(...COLOR_GRAY_LABEL);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', margin + 5, yPos);
  yPos += 5;

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
    yPos += 4;
  }

  yPos = clienteBoxY + clienteBoxHeight + 8;

  // Narrativa del proyecto (bloque de texto — puede saltar de página si es muy largo)
  doc.setFontSize(10);
  doc.setTextColor(...COLOR_TEXT_SOFT);
  doc.setFont('helvetica', 'normal');
  const narrativa = `Estimada ${datosCliente.nombreCompleto},\nEs un gusto saludarle en nombre de ${companiaName}. Hemos preparado con especial atención esta propuesta para ${proyecto.titulo || 'su proyecto'}, pensando en un sistema que combine tecnología de punta, confiabilidad y la tranquilidad que su proyecto merece.`;
  const narrativaLines = doc.splitTextToSize(narrativa, contentWidth);
  checkPageBreak(narrativaLines.length * 3.8 + 2);
  doc.text(narrativaLines, margin, yPos);
  yPos += narrativaLines.length * 3.8 + 3;

  // Título proyecto + descripción (mantenidos juntos con su primera línea)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  let descripcionLines: string[] = [];
  if (proyecto.descripcion) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    descripcionLines = doc.splitTextToSize(proyecto.descripcion, contentWidth);
  }
  checkPageBreak(6 + descripcionLines.length * 3.8 + 2);

  doc.setFontSize(14);
  doc.setTextColor(...COLOR_BRAND);
  doc.setFont('helvetica', 'bold');
  doc.text((proyecto.titulo || 'PROYECTO').toUpperCase(), margin, yPos);
  yPos += 5;

  if (descripcionLines.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(...COLOR_TEXT_SOFT);
    doc.setFont('helvetica', 'normal');
    doc.text(descripcionLines, margin, yPos);
    yPos += descripcionLines.length * 3.8 + 7;
  }

  // Beneficios Clave — caja azul claro. Bloque adhesivo (no se parte).
  const beneficios = [
    'Vigilancia continua con visión nocturna IR',
    'Transmisión estable y protegida',
    'Cableado certificado para exterior',
    'Instalación profesional especializada',
  ];
  const beneficiosBoxHeight = 5 + beneficios.length * 3.5 + 2;
  checkPageBreak(beneficiosBoxHeight + 3);

  const beneficiosBoxY = yPos - 3;
  doc.setFillColor(...COLOR_BRAND_LIGHT);
  doc.roundedRect(margin, beneficiosBoxY, contentWidth, beneficiosBoxHeight, 2, 2, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_BRAND);
  doc.text('Beneficios Clave', margin + 5, yPos);
  yPos += 4;

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
    yPos += 3.5;
  });
  yPos = beneficiosBoxY + beneficiosBoxHeight + 8;

  // ==================== TABLA DE PRODUCTOS (flujo dinámico) ====================
  const colWidths = {
    producto: 90,
    cant: 18,
    unitario: 28,
    desc: 18,
    subtotal: 35,
  };

  const startX = margin;

  function drawTableHeader(y: number) {
    doc.setFillColor(...COLOR_BRAND);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);

    doc.rect(startX, y - 4, contentWidth, 6, 'F');
    doc.text('PRODUCTO', startX + 2, y);
    doc.text('CANT.', startX + colWidths.producto + 2, y);
    doc.text('P. UNITARIO', startX + colWidths.producto + colWidths.cant + 2, y);
    doc.text('DESC.', startX + colWidths.producto + colWidths.cant + colWidths.unitario + 2, y);
    doc.text(
      'SUBTOTAL',
      startX + colWidths.producto + colWidths.cant + colWidths.unitario + colWidths.desc + 2,
      y
    );
  }

  // Aseguramos que el encabezado de la tabla nunca quede huérfano al pie de una página:
  // pedimos espacio para el header + al menos una fila.
  checkPageBreak(6 + 8);
  drawTableHeader(yPos);
  yPos += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  cart.forEach((item, index) => {
    const precioUnitarioFinal = item.product.precio * (1 - item.descuento / 100);
    const importeLinea = precioUnitarioFinal * item.cantidad;
    const descuentoDisplay = item.descuento > 0 && !ocultarDescuento ? `${item.descuento}%` : '—';

    const nombreProducto = `${item.product.nombre}${item.product.codigo ? ` (${item.product.codigo})` : ''}`;
    doc.setFontSize(8);
    const productoLines = doc.splitTextToSize(nombreProducto, colWidths.producto - 5);

    let rowHeight = Math.max(4.2, productoLines.length * 3.1);
    let notaLines: string[] = [];
    if (item.notas) {
      doc.setFontSize(7);
      notaLines = doc.splitTextToSize(`Nota: ${item.notas}`, colWidths.producto - 5);
      doc.setFontSize(8);
      rowHeight += notaLines.length * 2.6;
    }

    // Si la fila NO cabe en lo que resta de la página → nueva página + repintar el
    // encabezado de la tabla para que la tabla continúe de forma legible.
    if (yPos + rowHeight > contentBottom) {
      doc.addPage();
      paginaActual++;
      addHeaderAndFooter(doc, paginaActual, fecha, companiaName);
      yPos = contentTop;
      drawTableHeader(yPos);
      yPos += 5.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }

    // Zebra striping — coincide con el look de la referencia
    if (index % 2 === 1) {
      doc.setFillColor(245, 247, 250);
      doc.rect(startX, yPos - 3, contentWidth, rowHeight + 1, 'F');
    }

    doc.setFontSize(8);
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
      yPos += Math.max(4.2, productoLines.length * 3.1);
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(notaLines, startX + 5, yPos);
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      yPos += notaLines.length * 2.6 + 0.5;
    } else {
      yPos += rowHeight + 0.5;
    }
  });

  // ==================== TOTALES + AVISO + INFO (bloque adhesivo) ====================
  // Se calcula la altura del bloque completo de cierre de la tabla y se mantiene unido
  // para que "Subtotal / IVA / TOTAL / vigencia" nunca se separen.
  doc.setFontSize(9);
  const avisoLines = doc.splitTextToSize(
    `Esta cotización tiene una vigencia de 30 días naturales; después de este período los precios y disponibilidad están sujetos a cambio.`,
    contentWidth - 10
  );
  const avisoHeight = avisoLines.length * 3.5 + 2;
  const infoBoxHeight = 15;
  const totalesBlockHeight = 3 + 5 + 4.5 + 5 + 5.5 + 2 + avisoHeight + 2 + infoBoxHeight + 1;
  checkPageBreak(totalesBlockHeight);

  yPos += 3;
  doc.setDrawColor(180, 180, 180);
  doc.line(startX, yPos, pageWidth - margin, yPos);
  yPos += 5;

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
  yPos += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.text('IVA (16%):', totalsStartX, yPos, { align: 'left' });
  doc.setFont('helvetica', 'normal');
  doc.text(`$${iva.toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${simbolo}`, pageWidth - margin - 5, yPos, {
    align: 'right',
  });
  yPos += 5;

  // Total box
  doc.setFillColor(...COLOR_BRAND);
  doc.setTextColor(255, 255, 255);
  doc.roundedRect(totalsStartX - 5, yPos - 3.5, 85, 6.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL:', totalsStartX, yPos, { align: 'left' });
  doc.text(`$${total.toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${simbolo}`, pageWidth - margin - 5, yPos, {
    align: 'right',
  });
  yPos += 6;

  // Aviso vigencia — centrado, como en la referencia
  doc.setFillColor(255, 240, 220);
  doc.setTextColor(220, 100, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.roundedRect(margin, yPos - 3, contentWidth, avisoHeight, 1.5, 1.5, 'F');
  doc.text(avisoLines, pageWidth / 2, yPos, { align: 'center' });
  yPos += avisoHeight + 2;

  // Vigencia y Método de Pago — en cajas grises, como en la referencia
  const boxWidth = (contentWidth - 6) / 2;

  doc.setFillColor(...COLOR_GRAY_BG);
  doc.roundedRect(margin, yPos - 3.5, boxWidth, infoBoxHeight, 2, 2, 'F');
  doc.roundedRect(margin + boxWidth + 6, yPos - 3.5, boxWidth, infoBoxHeight, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setTextColor(...COLOR_GRAY_LABEL);
  doc.setFont('helvetica', 'bold');
  doc.text('VIGENCIA', margin + 5, yPos);
  doc.text('MÉTODO DE PAGO', margin + boxWidth + 11, yPos);
  yPos += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLOR_TEXT);
  doc.text('30 días', margin + 5, yPos);
  doc.text(METODO_PAGO_LABELS[metodoPago], margin + boxWidth + 11, yPos);
  yPos += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(`Del ${fecha} al ${fechaVencimiento}`, margin + 5, yPos);
  yPos = yPos - 8 + infoBoxHeight + 8; // baja al final de las cajas info + gap

  // ==================== TÉRMINOS Y CONDICIONES (bloque adhesivo) ====================
  // Texto fijo — ver TERMINOS_FIJOS al inicio del archivo (siempre igual, sin importar
  // la cotización).
  doc.setFontSize(9);
  const terminosTextWidth = contentWidth - 16;
  // 5 = padding superior de la caja (terminosBoxY = yPos - 5) + 5 = avance del encabezado
  // (yPos += 5 tras el título). Ambos deben contarse: si se omite el padding superior la
  // caja queda corta y el siguiente bloque ("Sobre Nosotros") se dibuja encima del texto.
  let terminosContentHeight = 10; // padding superior + encabezado
  const terminosLineData = TERMINOS_FIJOS.map((item) => {
    const lineas = doc.splitTextToSize(item.texto, terminosTextWidth);
    const itemHeight = 3 + lineas.length * 3.5 + 3;
    terminosContentHeight += itemHeight;
    return { ...item, lineas };
  });
  terminosContentHeight += 4; // padding inferior

  checkPageBreak(terminosContentHeight + 5);

  // Caja gris + barra azul continua (reemplaza los guiones sueltos de la versión anterior)
  const terminosBoxY = yPos - 5;
  doc.setFillColor(...COLOR_GRAY_BG);
  doc.roundedRect(margin, terminosBoxY, contentWidth, terminosContentHeight, 2, 2, 'F');
  doc.setFillColor(...COLOR_BRAND);
  doc.rect(margin, terminosBoxY, 1.5, terminosContentHeight, 'F');

  doc.setFontSize(12);
  doc.setTextColor(...COLOR_BRAND);
  doc.setFont('helvetica', 'bold');
  doc.text('Términos y Condiciones', margin + 8, yPos);
  yPos += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  terminosLineData.forEach((item) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_TEXT);
    doc.text(item.titulo, margin + 8, yPos);
    yPos += 3;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_TEXT_SOFT);
    doc.text(item.lineas, margin + 8, yPos);
    yPos += item.lineas.length * 3.5 + 3;
  });

  yPos = terminosBoxY + terminosContentHeight + 7;

  // ==================== SOBRE NOSOTROS + DATOS BANCARIOS (bloque adhesivo) ====================
  // Datos fijos — ver DATOS_BANCARIOS_FIJOS al inicio del archivo (siempre los mismos,
  // sin importar la cotización).
  doc.setFontSize(9);
  const sobreNosotrosIntro = `En ${companiaName} nos respaldan años de experiencia brindando soluciones de seguridad electrónica confiables. Para su comodidad, estos son nuestros datos bancarios:`;
  const introLines = doc.splitTextToSize(sobreNosotrosIntro, contentWidth - 16);

  const notaBancariaTexto =
    'Por favor referencie el comprobante de pago con el nombre del proyecto o del cliente para una identificación ágil.';
  const notaBancariaLines = doc.splitTextToSize(notaBancariaTexto, contentWidth - 16);

  const sobreNosotrosHeight =
    5 + introLines.length * 3.6 + 3 + DATOS_BANCARIOS_FIJOS.length * 5 + 2.5 + notaBancariaLines.length * 3.2 + 4;

  checkPageBreak(sobreNosotrosHeight + 5);

  const sobreNosotrosBoxY = yPos - 5;
  doc.setFillColor(...COLOR_GRAY_BG);
  doc.roundedRect(margin, sobreNosotrosBoxY, contentWidth, sobreNosotrosHeight, 2, 2, 'F');
  doc.setFillColor(...COLOR_BRAND);
  doc.rect(margin, sobreNosotrosBoxY, 1.5, sobreNosotrosHeight, 'F');

  doc.setFontSize(12);
  doc.setTextColor(...COLOR_BRAND);
  doc.setFont('helvetica', 'bold');
  doc.text('Sobre Nosotros', margin + 8, yPos);
  yPos += 5;

  doc.setFontSize(9);
  doc.setTextColor(...COLOR_TEXT_SOFT);
  doc.setFont('helvetica', 'normal');
  doc.text(introLines, margin + 8, yPos);
  yPos += introLines.length * 3.6 + 3;

  DATOS_BANCARIOS_FIJOS.forEach((dato) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_TEXT);
    doc.text(dato.titulo, margin + 8, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_TEXT_SOFT);
    doc.text(dato.valor, margin + 40, yPos);
    yPos += 5;
  });

  yPos += 2.5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text(notaBancariaLines, margin + 8, yPos);

  yPos = sobreNosotrosBoxY + sobreNosotrosHeight + 8;

  // ==================== CONTACTO FINAL (bloque adhesivo) ====================
  // IMPORTANTE: fontSize/font deben fijarse ANTES de splitTextToSize — si no, el ancho de
  // línea se calcula con el tamaño de fuente que haya quedado activo de la sección anterior
  // y el texto se desborda al dibujarse después a 11pt.
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const contactoIntro = `Estamos listos para llevar el proyecto ${(
    proyecto.titulo || 'cotizado'
  ).toUpperCase()} a la realidad. Si tiene alguna duda o desea ajustar algún detalle, comuníquese directamente conmigo. Puede escribirme por WhatsApp y con gusto le brindaré asesoría personalizada para que tome la mejor decisión.`;
  const contactoLines = doc.splitTextToSize(contactoIntro, contentWidth - 8);

  // La firma de cierre (nombre, empresa, correo, teléfono, RFC) es SIEMPRE la de quien
  // emite la cotización (HEADER_*) — nunca la del cliente al que se le cotiza.
  const bloqueAzulHeight = contactoLines.length * 5 + 4 + 5 + 5 + 5 + 5 + 5 + 5;
  const footerInfoHeight = 10 + 6;
  checkPageBreak(bloqueAzulHeight + footerInfoHeight);

  doc.setFillColor(...COLOR_BRAND);
  doc.roundedRect(margin, yPos - 5, contentWidth, bloqueAzulHeight, 2, 2, 'F');

  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.text(contactoLines, margin + 4, yPos);
  yPos += contactoLines.length * 5 + 4;

  // Nombre de quien firma la cotización — fijo (HEADER_CONTACTO)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(HEADER_CONTACTO, margin + 4, yPos);
  yPos += 5;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(companiaName, margin + 4, yPos);
  yPos += 5;

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.2);
  doc.line(margin + 4, yPos, pageWidth - margin - 4, yPos);
  yPos += 5;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(companiaName.toUpperCase(), margin + 4, yPos);
  yPos += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(HEADER_EMAILS, margin + 4, yPos);
  doc.text(HEADER_TELEFONO, pageWidth - margin - 5, yPos, { align: 'right' });

  // Footer info — fluye justo debajo del bloque de contacto
  yPos += 10;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  const footerLines = [
    `${HEADER_CONTACTO} • RFC: ${HEADER_RFC} • ${HEADER_TELEFONO}`,
    `${companiaName}`,
  ];
  footerLines.forEach((line, i) => {
    doc.text(line, pageWidth / 2, yPos + i * 3, { align: 'center' });
  });

  // Sustituye el placeholder de todas las páginas por el total real de páginas
  doc.putTotalPages(TOTAL_PAGES_EXP);

  const nombreArchivo = `Cotizacion_${datosCliente.nombreCompleto.replace(/\s+/g, '_')}_${fecha.replace(/\//g, '-')}.pdf`;

  return { doc, nombreArchivo };
}

// Genera el PDF y lo descarga inmediatamente (comportamiento original, usado por
// "Descargar PDF" y "Guardar Cotización").
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
  const { doc, nombreArchivo } = await construirDocumentoPDF(
    cart,
    datosCliente,
    proyecto,
    metodoPago,
    moneda,
    ocultarDescuento,
    subtotal,
    iva,
    total
  );
  doc.save(nombreArchivo);
}

// Genera el PDF en memoria (Blob) sin descargarlo — usado por "Enviar y Guardar" para
// adjuntarlo/abrirlo desde el cliente de correo predeterminado (Outlook, etc).
export async function generarPDFBlob(
  cart: CartItem[],
  datosCliente: DatosCliente,
  proyecto: Proyecto,
  metodoPago: MetodoPago,
  moneda: 'USD' | 'MXN',
  ocultarDescuento: boolean,
  subtotal: number,
  iva: number,
  total: number
): Promise<{ blob: Blob; nombreArchivo: string }> {
  const { doc, nombreArchivo } = await construirDocumentoPDF(
    cart,
    datosCliente,
    proyecto,
    metodoPago,
    moneda,
    ocultarDescuento,
    subtotal,
    iva,
    total
  );
  const blob = doc.output('blob');
  return { blob, nombreArchivo };
}