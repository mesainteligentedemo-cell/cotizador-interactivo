import { CartItem, DatosCliente, MetodoPago, Proyecto } from './types';

export interface GuardarCotizacionResult {
  success: boolean;
  sheetUrl?: string;
  cotizacionId?: string;
  error?: string;
}

export async function guardarEnSheets(
  cart: CartItem[],
  cliente: DatosCliente,
  proyecto: Proyecto,
  metodoPago: MetodoPago,
  moneda: 'USD' | 'MXN',
  subtotal: number,
  iva: number,
  total: number
): Promise<GuardarCotizacionResult> {
  const response = await fetch('/api/sheets/guardar-cotizacion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fecha: new Date().toISOString(),
      cliente,
      proyecto,
      cart,
      moneda,
      metodoPago,
      subtotal,
      iva,
      total,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Error al guardar la cotización en Google Sheets');
  }

  return data;
}