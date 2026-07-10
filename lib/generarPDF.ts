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

// ---------------------------------------------------------------------------
// TIPOGRAFÍA — JUSTIFICACIÓN + INTERLINEADO DINÁMICO
// ---------------------------------------------------------------------------
// Conversión punto→milímetro (unidad del documento). jsPDF mide el tamaño de
// fuente en pt pero dibuja en mm, así que toda altura de línea se deriva de aquí
// para que el interlineado sea REAL y consistente con el tamaño de fuente activo.
const PT_TO_MM = 0.352778;

// Interlineado dentro del contenido (párrafos, listas): espacio y medio (1.5x).
const LH_CONTENT = 1.5;
// Separación entre un título y su contenido: doble espacio (2x).
const LH_TITLE_GAP = 2.0;

// Altura de un renglón en mm para un tamaño de fuente (pt) y un multiplicador.
function lineHeightMM(fontSizePt: number, factor: number): number {
  return fontSizePt * PT_TO_MM * factor;
}

// Cuenta cuántos renglones ocupará un texto (respetando saltos \n) al ancho dado.
// Se usa para dimensionar cajas ANTES de renderizar, de forma 100% consistente con
// drawJustifiedText. El caller debe fijar el mismo font/size antes de llamar.
function countWrappedLines(doc: jsPDF, text: string, maxWidth: number): number {
  return text.split('\n').reduce((total, paragraph) => {
    const trimmed = paragraph.trim();
    if (trimmed.length === 0) return total + 1;
    return total + (doc.splitTextToSize(trimmed, maxWidth) as string[]).length;
  }, 0);
}

// Dibuja texto JUSTIFICADO a ambos márgenes. jsPDF no justifica de forma nativa
// respetando la última línea (estira los espacios de la línea final), por eso se
// implementa a mano: se reparte el sobrante entre los huecos de cada línea salvo
// la última de cada párrafo, que queda alineada a la izquierda (estándar tipográfico).
// Respeta saltos \n tratando cada segmento como párrafo. Devuelve la nueva `y`.
// El caller DEBE fijar font/size/color antes (getTextWidth usa la fuente activa).
function drawJustifiedText(
  doc: jsPDF,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  fontSizePt: number,
  lineFactor: number = LH_CONTENT
): number {
  const lineHeight = lineHeightMM(fontSizePt, lineFactor);
  let y = startY;

  text.split('\n').forEach((paragraph) => {
    const trimmed = paragraph.trim();
    if (trimmed.length === 0) {
      y += lineHeight;
      return;
    }
    const lines = doc.splitTextToSize(trimmed, maxWidth) as string[];
    lines.forEach((line, idx) => {
      const isLastLine = idx === lines.length - 1;
      const words = line.split(/\s+/).filter((w) => w.length > 0);

      if (isLastLine || words.length < 2) {
        // Última línea del párrafo (o línea de una sola palabra): izquierda.
        doc.text(line, x, y);
      } else {
        // Reparte el espacio sobrante uniformemente entre las palabras.
        const wordsWidth = words.reduce((sum, w) => sum + doc.getTextWidth(w), 0);
        const gap = (maxWidth - wordsWidth) / (words.length - 1);
        let cursor = x;
        words.forEach((w) => {
          doc.text(w, cursor, y);
          cursor += doc.getTextWidth(w) + gap;
        });
      }
      y += lineHeight;
    });
  });

  return y;
}

// Carga el logo desde /public/logo.png (servido por Next.js) y lo convierte a data URL.
// generarPDF.ts corre en el navegador ('use client'), NO en Node, así que jsPDF no puede
// leer el archivo del filesystem directamente: hay que pedirlo por fetch() y convertirlo.
// Si algo falla (offline, archivo faltante, navegador sin fetch/FileReader) se resuelve a
// `null` en vez de lanzar, para que el PDF SIEMPRE se genere — con o sin logo.
async function cargarLogoDataUrl(): Promise<string | null> {
  try {
    const response = await fetch('/logo.png');
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('No se pudo cargar el logo para el PDF, se continúa sin él:', error);
    return null;
  }
}

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

  // Se carga antes de dibujar nada porque `doc.addImage` necesita el data URL ya resuelto
  // (no acepta promesas) y toda la función es async, así que un solo await aquí basta.
  const logoDataUrl = await cargarLogoDataUrl();

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

  // Logo real de la empresa, centrado horizontalmente cerca del top de la portada.
  // El PNG fuente es 500x500 (1:1) — se usa el mismo ancho/alto para no distorsionarlo.
  const logoWidth = 26; // mm
  const logoHeight = 26; // mm
  const logoX = (pageWidth - logoWidth) / 2;
  const logoY = yPos;

  let logoInsertado = false;
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
      logoInsertado = true;
    } catch (error) {
      // No debe romper la generación del PDF: si el logo falla, se cae al placeholder.
      console.warn('No se pudo insertar el logo en el PDF, se usa el placeholder:', error);
    }
  }

  if (logoInsertado) {
    yPos = logoY + logoHeight + 6;
  } else {
    // Placeholder (rectángulo con iniciales de la empresa) — fallback si el logo no cargó.
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
    yPos += 24;
  }

  // Título principal (nombre de la compañía) — oscuro, no azul, como en la referencia
  doc.setFontSize(14);
  doc.setTextColor(...COLOR_TEXT);
  doc.setFont('helvetica', 'bold');
  doc.text((companiaName || 'MI EMPRESA').toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Contacto — fijo, siempre los mismos datos de la empresa que emite (HEADER_*).
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(HEADER_EMAILS, pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  doc.text(`Tel: ${HEADER_TELEFONO}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_GRAY_LABEL);
  doc.text(`RFC: ${HEADER_RFC}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  yPos += 6;

  // Bloque azul con fecha
  doc.setFillColor(...COLOR_BRAND);
  doc.roundedRect(margin, yPos, contentWidth, 8, 1.5, 1.5, 'F');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('COTIZACIÓN', margin + 5, yPos + 5);
  doc.text(`Fecha: ${fecha}`, pageWidth - margin - 5, yPos + 5, { align: 'right' });
  yPos += 14;

  // Sección Cliente — caja gris. Se calcula la altura primero y se mantiene unida.
  const nombreClienteMostrar = (
    datosCliente.nombreComercial ||
    datosCliente.empresa ||
    datosCliente.nombreCompleto
  ).toUpperCase();

  const clienteBoxHeight = 7 + 7 + (datosCliente.telefono ? 6 : 0) + 8;
  checkPageBreak(clienteBoxHeight + 12);

  const clienteBoxY = yPos - 6;
  doc.setFillColor(...COLOR_GRAY_BG);
  doc.roundedRect(margin, clienteBoxY, contentWidth, clienteBoxHeight, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setTextColor(...COLOR_GRAY_LABEL);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', margin + 5, yPos);
  yPos += 7;

  doc.setFontSize(12);
  doc.setTextColor(...COLOR_TEXT);
  doc.setFont('helvetica', 'bold');
  doc.text(nombreClienteMostrar, margin + 5, yPos);
  yPos += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  if (datosCliente.telefono) {
    doc.text(`Tel: ${datosCliente.telefono}`, margin + 5, yPos);
    yPos += 6;
  }

  yPos = clienteBoxY + clienteBoxHeight + 4;

  // Narrativa del proyecto — texto JUSTIFICADO con interlineado 1.5x. Puede saltar de
  // página si es muy largo. El saludo ("Estimada X,") es su propio párrafo (\n) y por
  // tanto queda alineado a la izquierda, no estirado.
  doc.setFontSize(10);
  doc.setTextColor(...COLOR_TEXT_SOFT);
  doc.setFont('helvetica', 'normal');
  const narrativa = `Estimada ${datosCliente.nombreCompleto},\nEs un gusto saludarle en nombre de ${companiaName}. Hemos preparado con especial atención esta propuesta para ${proyecto.titulo || 'su proyecto'}, pensando en un sistema que combine tecnología de punta, confiabilidad y la tranquilidad que su proyecto merece.`;
  const narrativaLH = lineHeightMM(10, LH_CONTENT);
  const narrativaLineCount = countWrappedLines(doc, narrativa, contentWidth);
  checkPageBreak(narrativaLineCount * narrativaLH + narrativaLH);
  yPos = drawJustifiedText(doc, narrativa, margin, yPos, contentWidth, 10);
  yPos += narrativaLH; // gap dinámico hacia la siguiente sección

  // Título proyecto + descripción (mantenidos juntos con su primera línea).
  // Título → DOBLE espacio → descripción JUSTIFICADA con interlineado 1.5x.
  const proyectoTitleGap = lineHeightMM(14, LH_TITLE_GAP); // doble espacio tras título
  const descLH = lineHeightMM(10, LH_CONTENT);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const descLineCount = proyecto.descripcion
    ? countWrappedLines(doc, proyecto.descripcion, contentWidth)
    : 0;
  checkPageBreak(lineHeightMM(14, 1.2) + proyectoTitleGap + descLineCount * descLH + descLH);

  doc.setFontSize(14);
  doc.setTextColor(...COLOR_BRAND);
  doc.setFont('helvetica', 'bold');
  doc.text((proyecto.titulo || 'PROYECTO').toUpperCase(), margin, yPos);
  yPos += proyectoTitleGap;

  if (proyecto.descripcion) {
    doc.setFontSize(10);
    doc.setTextColor(...COLOR_TEXT_SOFT);
    doc.setFont('helvetica', 'normal');
    yPos = drawJustifiedText(doc, proyecto.descripcion, margin, yPos, contentWidth, 10);
    yPos += descLH;
  }

  // Beneficios Clave — caja azul claro. Bloque adhesivo (no se parte).
  const beneficios = [
    'Vigilancia continua con visión nocturna IR',
    'Transmisión estable y protegida',
    'Cableado certificado para exterior',
    'Instalación profesional especializada',
  ];
  const beneficiosBoxHeight = 7 + beneficios.length * 6 + 8;
  checkPageBreak(beneficiosBoxHeight + 8);

  const beneficiosBoxY = yPos - 6;
  doc.setFillColor(...COLOR_BRAND_LIGHT);
  doc.roundedRect(margin, beneficiosBoxY, contentWidth, beneficiosBoxHeight, 2, 2, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_BRAND);
  doc.text('Beneficios Clave', margin + 5, yPos);
  yPos += 7;

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
    yPos += 6;
  });
  yPos = beneficiosBoxY + beneficiosBoxHeight + 6;

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
  checkPageBreak(6 + 10);
  drawTableHeader(yPos);
  yPos += 8;
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
      yPos += 8;
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
      yPos += notaLines.length * 2.6 + 2.5;
    } else {
      yPos += rowHeight + 2.5;
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
  const avisoHeight = avisoLines.length * 3.5 + 7;
  const infoBoxHeight = 26;
  const totalesBlockHeight = 5 + 8 + 7 + 8 + 9 + avisoHeight + 4 + 8 + 8 + infoBoxHeight + 6;
  checkPageBreak(totalesBlockHeight);

  yPos += 5;
  doc.setDrawColor(180, 180, 180);
  doc.line(startX, yPos, pageWidth - margin, yPos);
  yPos += 8;

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
  yPos += 7;

  doc.setFont('helvetica', 'bold');
  doc.text('IVA (16%):', totalsStartX, yPos, { align: 'left' });
  doc.setFont('helvetica', 'normal');
  doc.text(`$${iva.toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${simbolo}`, pageWidth - margin - 5, yPos, {
    align: 'right',
  });
  yPos += 8;

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
  yPos += 9;

  // Aviso vigencia — centrado, como en la referencia
  doc.setFillColor(255, 240, 220);
  doc.setTextColor(220, 100, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.roundedRect(margin, yPos - 6, contentWidth, avisoHeight, 1.5, 1.5, 'F');
  doc.text(avisoLines, pageWidth / 2, yPos, { align: 'center' });
  yPos += avisoHeight + 4;

  // Vigencia y Método de Pago — en cajas grises, como en la referencia
  const boxWidth = (contentWidth - 6) / 2;

  doc.setFillColor(...COLOR_GRAY_BG);
  doc.roundedRect(margin, yPos - 6, boxWidth, infoBoxHeight, 2, 2, 'F');
  doc.roundedRect(margin + boxWidth + 6, yPos - 6, boxWidth, infoBoxHeight, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setTextColor(...COLOR_GRAY_LABEL);
  doc.setFont('helvetica', 'bold');
  doc.text('VIGENCIA', margin + 5, yPos);
  doc.text('MÉTODO DE PAGO', margin + boxWidth + 11, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLOR_TEXT);
  doc.text('30 días', margin + 5, yPos);
  doc.text(METODO_PAGO_LABELS[metodoPago], margin + boxWidth + 11, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(`Del ${fecha} al ${fechaVencimiento}`, margin + 5, yPos);
  yPos = yPos + infoBoxHeight + 6; // baja al final de las cajas info + gap

  // ==================== TÉRMINOS Y CONDICIONES (bloque adhesivo) ====================
  // Texto fijo — ver TERMINOS_FIJOS al inicio del archivo (siempre igual, sin importar
  // la cotización).
  const terminosTextWidth = contentWidth - 16;
  // Interlineado dinámico: encabezado 12pt → DOBLE espacio; subtítulo 9pt → DOBLE espacio →
  // texto 9pt JUSTIFICADO a 1.5x; separación entre términos = un renglón de contenido.
  const termHeaderGap = lineHeightMM(12, LH_TITLE_GAP);
  const termTitleGap = lineHeightMM(9, LH_TITLE_GAP);
  const termTextLH = lineHeightMM(9, LH_CONTENT);
  const termBlockGap = termTextLH;

  // La altura de la caja se calcula EXACTAMENTE igual que el renderizado de abajo, para que
  // el siguiente bloque ("Sobre Nosotros") nunca se dibuje encima del texto ni queden blancos.
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let terminosContentHeight = 8 + termHeaderGap; // padding superior + avance del encabezado
  const terminosLineData = TERMINOS_FIJOS.map((item) => {
    const lineCount = countWrappedLines(doc, item.texto, terminosTextWidth);
    terminosContentHeight += termTitleGap + lineCount * termTextLH + termBlockGap;
    return item;
  });
  terminosContentHeight += 4; // padding inferior

  checkPageBreak(terminosContentHeight + 14);

  // Caja gris + barra azul continua (reemplaza los guiones sueltos de la versión anterior)
  const terminosBoxY = yPos - 8;
  doc.setFillColor(...COLOR_GRAY_BG);
  doc.roundedRect(margin, terminosBoxY, contentWidth, terminosContentHeight, 2, 2, 'F');
  doc.setFillColor(...COLOR_BRAND);
  doc.rect(margin, terminosBoxY, 1.5, terminosContentHeight, 'F');

  doc.setFontSize(12);
  doc.setTextColor(...COLOR_BRAND);
  doc.setFont('helvetica', 'bold');
  doc.text('Términos y Condiciones', margin + 8, yPos);
  yPos += termHeaderGap;

  terminosLineData.forEach((item) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_TEXT);
    doc.text(item.titulo, margin + 8, yPos);
    yPos += termTitleGap;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_TEXT_SOFT);
    yPos = drawJustifiedText(doc, item.texto, margin + 8, yPos, terminosTextWidth, 9);
    yPos += termBlockGap;
  });

  yPos = terminosBoxY + terminosContentHeight + 6;

  // ==================== SOBRE NOSOTROS + DATOS BANCARIOS (bloque adhesivo) ====================
  // Datos fijos — ver DATOS_BANCARIOS_FIJOS al inicio del archivo (siempre los mismos,
  // sin importar la cotización).
  const sobreNosotrosIntro = `En ${companiaName} nos respaldan años de experiencia brindando soluciones de seguridad electrónica confiables. Para su comodidad, estos son nuestros datos bancarios:`;
  const notaBancariaTexto =
    'Por favor referencie el comprobante de pago con el nombre del proyecto o del cliente para una identificación ágil.';

  // Interlineado dinámico: título 12pt → DOBLE espacio; intro 9pt justificada 1.5x;
  // filas de datos 9pt a 1.5x; nota 8pt a 1.5x. La altura se calcula igual que el render.
  const snHeaderGap = lineHeightMM(12, LH_TITLE_GAP);
  const snIntroLH = lineHeightMM(9, LH_CONTENT);
  const snDatoLH = lineHeightMM(9, LH_CONTENT);
  const snNotaLH = lineHeightMM(8, LH_CONTENT);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const introLineCount = countWrappedLines(doc, sobreNosotrosIntro, contentWidth - 16);
  doc.setFontSize(8);
  const notaLineCount = countWrappedLines(doc, notaBancariaTexto, contentWidth - 16);

  const sobreNosotrosHeight =
    8 + // padding superior
    snHeaderGap +
    introLineCount * snIntroLH +
    snIntroLH + // gap tras intro
    DATOS_BANCARIOS_FIJOS.length * snDatoLH +
    5 + // gap antes de la nota
    notaLineCount * snNotaLH +
    6; // padding inferior

  checkPageBreak(sobreNosotrosHeight + 8);

  const sobreNosotrosBoxY = yPos - 8;
  doc.setFillColor(...COLOR_GRAY_BG);
  doc.roundedRect(margin, sobreNosotrosBoxY, contentWidth, sobreNosotrosHeight, 2, 2, 'F');
  doc.setFillColor(...COLOR_BRAND);
  doc.rect(margin, sobreNosotrosBoxY, 1.5, sobreNosotrosHeight, 'F');

  doc.setFontSize(12);
  doc.setTextColor(...COLOR_BRAND);
  doc.setFont('helvetica', 'bold');
  doc.text('Sobre Nosotros', margin + 8, yPos);
  yPos += snHeaderGap;

  doc.setFontSize(9);
  doc.setTextColor(...COLOR_TEXT_SOFT);
  doc.setFont('helvetica', 'normal');
  yPos = drawJustifiedText(doc, sobreNosotrosIntro, margin + 8, yPos, contentWidth - 16, 9);
  yPos += snIntroLH;

  DATOS_BANCARIOS_FIJOS.forEach((dato) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_TEXT);
    doc.text(dato.titulo, margin + 8, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_TEXT_SOFT);
    doc.text(dato.valor, margin + 40, yPos);
    yPos += snDatoLH;
  });

  yPos += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  yPos = drawJustifiedText(doc, notaBancariaTexto, margin + 8, yPos, contentWidth - 16, 8);

  yPos = sobreNosotrosBoxY + sobreNosotrosHeight + 6;

  // ==================== CONTACTO FINAL (bloque adhesivo) ====================
  // IMPORTANTE: fontSize/font deben fijarse ANTES de splitTextToSize — si no, el ancho de
  // línea se calcula con el tamaño de fuente que haya quedado activo de la sección anterior
  // y el texto se desborda al dibujarse después a 11pt.
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const contactoIntro = `Estamos listos para llevar el proyecto ${(
    proyecto.titulo || 'cotizado'
  ).toUpperCase()} a la realidad. Si tiene alguna duda o desea ajustar algún detalle, comuníquese directamente conmigo. Puede escribirme por WhatsApp y con gusto le brindaré asesoría personalizada para que tome la mejor decisión.`;

  // Interlineado dinámico: párrafo 11pt JUSTIFICADO a 1.5x; luego firma con filas
  // legibles. La altura del bloque azul se deriva de las mismas constantes.
  const contactoLH = lineHeightMM(11, LH_CONTENT);
  const contactoLineCount = countWrappedLines(doc, contactoIntro, contentWidth - 8);
  const contactoBlockGap = contactoLH; // gap entre párrafo y firma

  // La firma de cierre (nombre, empresa, correo, teléfono, RFC) es SIEMPRE la de quien
  // emite la cotización (HEADER_*) — nunca la del cliente al que se le cotiza.
  const bloqueAzulHeight =
    8 + contactoLineCount * contactoLH + contactoBlockGap + 8 + 8 + 8 + 8 + 8;
  const footerInfoHeight = 12 + 8;
  checkPageBreak(bloqueAzulHeight + footerInfoHeight);

  doc.setFillColor(...COLOR_BRAND);
  doc.roundedRect(margin, yPos - 8, contentWidth, bloqueAzulHeight, 2, 2, 'F');

  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  yPos = drawJustifiedText(doc, contactoIntro, margin + 4, yPos, contentWidth - 8, 11);
  yPos += contactoBlockGap;

  // Nombre de quien firma la cotización — fijo (HEADER_CONTACTO)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(HEADER_CONTACTO, margin + 4, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(companiaName, margin + 4, yPos);
  yPos += 8;

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.2);
  doc.line(margin + 4, yPos, pageWidth - margin - 4, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(companiaName.toUpperCase(), margin + 4, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(HEADER_EMAILS, margin + 4, yPos);
  doc.text(HEADER_TELEFONO, pageWidth - margin - 5, yPos, { align: 'right' });

  // Footer info — fluye justo debajo del bloque de contacto
  yPos += 12;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  const footerLines = [
    `${HEADER_CONTACTO} • RFC: ${HEADER_RFC} • ${HEADER_TELEFONO}`,
    `${companiaName}`,
  ];
  footerLines.forEach((line, i) => {
    doc.text(line, pageWidth / 2, yPos + i * 5, { align: 'center' });
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