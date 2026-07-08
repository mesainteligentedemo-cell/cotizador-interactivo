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
  const margin = 15;
  let yPos = margin;

  // Función auxiliar para verificar si necesitamos una nueva página
  const verificarEspacio = (espacioNeeded: number) => {
    if (yPos + espacioNeeded > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }
  };

  // Encabezado
  doc.setTextColor(30, 58, 138); // Azul oscuro
  doc.setFontSize(24);
  doc.text('COTIZADOR', margin, yPos);
  yPos += 15;

  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // Información del cliente
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL CLIENTE', margin, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${datosCliente.nombre || ''}`, margin, yPos);
  yPos += 5;

  if (datosCliente.empresa) {
    doc.text(`Empresa: ${datosCliente.empresa || ''}`, margin, yPos);
    yPos += 5;
  }

  if (datosCliente.correo) {
    doc.text(`Correo: ${datosCliente.correo || ''}`, margin, yPos);
    yPos += 5;
  }

  if (datosCliente.telefono) {
    doc.text(`Teléfono: ${datosCliente.telefono || ''}`, margin, yPos);
    yPos += 5;
  }

  yPos += 5;

  // Tabla de productos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);

  // Encabezado de tabla
  const colWidths = [70, 20, 25, 30];
  const headers = ['Descripción', 'Cant.', 'P. Unitario', 'Subtotal'];

  let xPos = margin;
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], xPos, yPos);
    xPos += colWidths[i];
  }

  yPos += 5;
  doc.setDrawColor(100, 100, 100);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // Filas de productos
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  cart.forEach((item) => {
    verificarEspacio(8);

    const descripcion = doc.splitTextToSize(item.product.nombre, colWidths[0] - 2);
    const cantidadStr = item.cantidad.toString();
    const precioStr = `$${item.product.precio.toLocaleString('es-MX')}`;
    const subtotalStr = `$${(item.product.precio * item.cantidad).toLocaleString('es-MX')}`;

    doc.text(descripcion, margin + 1, yPos);
    doc.text(cantidadStr, margin + colWidths[0], yPos, { align: 'center' });
    doc.text(precioStr, margin + colWidths[0] + colWidths[1], yPos, {
      align: 'right',
    });
    doc.text(subtotalStr, margin + colWidths[0] + colWidths[1] + colWidths[2], yPos, {
      align: 'right',
    });

    const lineHeight = 5;
    const descriptionHeight = descripcion.length * lineHeight;
    yPos += Math.max(5, descriptionHeight);
  });

  yPos += 3;
  doc.setDrawColor(100, 100, 100);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 7;

  // Totales
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);

  const totalsStartX = pageWidth - 80;

  doc.text('Subtotal:', totalsStartX, yPos);
  doc.text(
    `$${subtotal.toLocaleString('es-MX')}`,
    pageWidth - margin,
    yPos,
    { align: 'right' }
  );
  yPos += 6;

  doc.text('IVA (16%):', totalsStartX, yPos);
  doc.text(
    `$${iva.toLocaleString('es-MX')}`,
    pageWidth - margin,
    yPos,
    { align: 'right' }
  );
  yPos += 6;

  // Total con fondo
  doc.setFillColor(30, 58, 138);
  doc.setTextColor(255, 255, 255);
  doc.rect(totalsStartX - 5, yPos - 5, 85, 8, 'F');

  doc.text('TOTAL:', totalsStartX, yPos);
  doc.text(
    `$${total.toLocaleString('es-MX')}`,
    pageWidth - margin,
    yPos,
    { align: 'right' }
  );
  yPos += 12;

  // Nota al pie
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text(
    'Los precios en esta cotización pueden variar según disponibilidad y tipo de cambio.',
    margin,
    pageHeight - 10
  );

  // Descargar
  const fecha = new Date().toLocaleDateString('es-MX');
  doc.save(`Cotizacion_${datosCliente.nombre.replace(/\s+/g, '_')}_${fecha}.pdf`);
}