import { CartItem } from './types';

export function calcularSubtotal(items: CartItem[], moneda: 'USD' | 'MXN', tipoCambio: number): { subtotalMXN: number; baseUSD: number } {
  let baseUSD = 0;
  let subtotalMXN = 0;

  items.forEach(item => {
    const precioBase = item.product.precio;
    const descuentoAplicado = precioBase * item.cantidad * (1 - item.descuento / 100);

    if (item.product.moneda === 'USD') {
      baseUSD += descuentoAplicado;
      subtotalMXN += descuentoAplicado * tipoCambio;
    } else {
      subtotalMXN += descuentoAplicado;
    }
  });

  if (moneda === 'USD') {
    return { subtotalMXN: subtotalMXN / tipoCambio, baseUSD };
  }

  return { subtotalMXN, baseUSD };
}

export function formatearFecha(dias: number = 30): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
}