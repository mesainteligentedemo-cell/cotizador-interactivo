import { CartItem, DatosCliente, MetodoPago, Proyecto } from './types';

const METODO_PAGO_LABELS: Record<MetodoPago, string> = {
  tarjeta_credito: 'Tarjeta de Crédito',
  tarjeta_debito: 'Tarjeta de Débito',
  contado: 'Contado',
  cheque: 'Cheque',
  transferencia: 'Transferencia',
  credito: 'Crédito',
};

export async function enviarPorCorreo(
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
  const htmlCotizacion = generarHTMLCotizacion(
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

  const response = await fetch('/api/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      destinatario: datosCliente.correos.join(','),
      asunto: `Cotización - ${proyecto.titulo || datosCliente.nombreCompleto}`,
      html: htmlCotizacion,
      nombreCliente: datosCliente.nombreCompleto,
    }),
  });

  if (!response.ok) {
    throw new Error('Error al enviar el correo');
  }

  return response.json();
}

function generarHTMLCotizacion(
  cart: CartItem[],
  datosCliente: DatosCliente,
  proyecto: Proyecto,
  metodoPago: MetodoPago,
  moneda: 'USD' | 'MXN',
  ocultarDescuento: boolean,
  subtotal: number,
  iva: number,
  total: number
): string {
  const simbolo = moneda === 'USD' ? 'USD' : 'MXN';

  const productosHTML = cart
    .map((item) => {
      const precioUnitarioFinal = item.product.precio * (1 - item.descuento / 100);
      const importeLinea = precioUnitarioFinal * item.cantidad;
      const descuentoHTML =
        !ocultarDescuento && item.descuento !== 0
          ? `<br><span style="color:#0055a5;font-size:11px;">Descuento: ${item.descuento}%</span>`
          : '';
      const notasHTML = item.notas
        ? `<br><span style="color:#666;font-size:11px;">Nota: ${item.notas}</span>`
        : '';

      return `
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 10px; text-align: left;">${item.product.nombre}${descuentoHTML}${notasHTML}</td>
      <td style="padding: 10px; text-align: center;">${item.cantidad}</td>
      <td style="padding: 10px; text-align: right;">$${precioUnitarioFinal.toLocaleString('es-MX', { maximumFractionDigits: 2 })}</td>
      <td style="padding: 10px; text-align: right;">$${importeLinea.toLocaleString('es-MX', { maximumFractionDigits: 2 })}</td>
    </tr>
  `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0055a5; color: white; padding: 20px; text-align: center; border-radius: 5px; }
    .content { margin: 20px 0; }
    .cliente-info { background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background-color: #0055a5; color: white; padding: 10px; text-align: left; }
    .totales { margin: 20px 0; text-align: right; }
    .total-fila { font-weight: bold; font-size: 16px; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">${proyecto.titulo || 'COTIZADOR'}</h1>
      <p style="margin: 5px 0 0 0;">Sistemas de Seguridad</p>
    </div>

    <div class="content">
      <h2>¡Hola ${datosCliente.nombreCompleto}!</h2>
      <p>Te enviamos tu cotización solicitada. Aquí están los detalles:</p>
      ${proyecto.descripcion ? `<p>${proyecto.descripcion}</p>` : ''}

      <div class="cliente-info">
        <h3 style="margin-top: 0;">Datos del Cliente:</h3>
        <p><strong>${datosCliente.nombreCompleto}</strong></p>
        ${datosCliente.empresa ? `<p>Empresa: ${datosCliente.empresa}</p>` : ''}
        ${datosCliente.rfc ? `<p>RFC: ${datosCliente.rfc}</p>` : ''}
        ${datosCliente.telefono ? `<p>Teléfono: ${datosCliente.telefono}</p>` : ''}
        <p>Método de pago: ${METODO_PAGO_LABELS[metodoPago]}</p>
      </div>

      <h3>Productos Cotizados:</h3>
      <table>
        <thead>
          <tr>
            <th style="text-align: left;">Descripción</th>
            <th style="text-align: center;">Cant.</th>
            <th style="text-align: right;">P. Unitario</th>
            <th style="text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${productosHTML}
        </tbody>
      </table>

      <div class="totales">
        <div style="margin: 10px 0;">
          <strong>Subtotal:</strong> $${subtotal.toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${simbolo}
        </div>
        <div style="margin: 10px 0;">
          <strong>IVA (16%):</strong> $${iva.toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${simbolo}
        </div>
        <div style="margin: 10px 0; padding: 10px; background-color: #0055a5; color: white; border-radius: 5px; font-size: 18px;" class="total-fila">
          TOTAL: $${total.toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${simbolo}
        </div>
      </div>

      <p style="margin-top: 20px;">Si tienes preguntas o necesitas realizar cambios, no dudes en contactarnos.</p>
    </div>

    <div class="footer">
      <p>Los precios en esta cotización pueden variar según disponibilidad y tipo de cambio.</p>
      <p>© ${new Date().getFullYear()} Sistemas de Seguridad. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;
}