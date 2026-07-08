'use client';

import { useState, useMemo } from 'react';
import { CartItem, DatosCliente, MetodoPago, Proyecto } from '@/lib/types';
import { calcularSubtotal } from '@/lib/calculos';
import { generarPDF } from '@/lib/generarPDF';
import { enviarPorCorreo } from '@/lib/enviarCorreo';
import { guardarEnSheets } from '@/lib/guardarCotizacion';

interface CartSummaryProps {
  cart: CartItem[];
  moneda: 'USD' | 'MXN';
  tipoCambio: number;
  metodoPago: MetodoPago;
  cliente: DatosCliente;
  proyecto: Proyecto;
  ocultarDescuento: boolean;
  onActualizarCantidad: (productoId: string, cantidad: number) => void;
  onActualizarDescuento: (productoId: string, descuento: number) => void;
  onActualizarNotas: (productoId: string, notas: string) => void;
  onEliminarProducto: (productoId: string) => void;
  onLimpiarCarrito: () => void;
}

const TIPO_LABELS: Record<string, string> = {
  catalogo: 'Catálogo',
  otro: 'Otros productos',
  manoObra: 'Mano de Obra',
};

export function CartSummary({
  cart,
  moneda,
  tipoCambio,
  metodoPago,
  cliente,
  proyecto,
  ocultarDescuento,
  onActualizarCantidad,
  onActualizarDescuento,
  onActualizarNotas,
  onEliminarProducto,
  onLimpiarCarrito,
}: CartSummaryProps) {
  const [cargando, setCargando] = useState(false);

  const { subtotalMXN: subtotal, baseUSD } = useMemo(
    () => calcularSubtotal(cart, moneda, tipoCambio),
    [cart, moneda, tipoCambio]
  );
  const iva = subtotal * 0.16;
  const total = subtotal + iva;
  const simbolo = moneda === 'USD' ? 'USD' : 'MXN';

  const porTipo = useMemo(() => {
    const grupos: Record<string, { count: number; subtotal: number }> = {};
    cart.forEach((item) => {
      const tipo = item.product.tipoProducto || 'catalogo';
      const importe = item.product.precio * item.cantidad * (1 - item.descuento / 100);
      const importeConvertido =
        item.product.moneda === 'USD' && moneda === 'MXN'
          ? importe * tipoCambio
          : item.product.moneda !== 'USD' && moneda === 'USD'
          ? importe / tipoCambio
          : importe;
      if (!grupos[tipo]) grupos[tipo] = { count: 0, subtotal: 0 };
      grupos[tipo].count += 1;
      grupos[tipo].subtotal += importeConvertido;
    });
    return grupos;
  }, [cart, moneda, tipoCambio]);

  const handleDescargarPDF = async () => {
    setCargando(true);
    try {
      await generarPDF(cart, cliente, proyecto, metodoPago, moneda, ocultarDescuento, subtotal, iva, total);
    } catch (error) {
      console.error('Error generando PDF:', error);
      const mensaje = error instanceof Error ? error.message : 'error desconocido';
      alert(`Error al generar el PDF: ${mensaje}`);
    } finally {
      setCargando(false);
    }
  };

  const handleGuardarCotizacion = async () => {
    setCargando(true);
    const errores: string[] = [];

    try {
      await guardarEnSheets(cart, cliente, proyecto, metodoPago, moneda, subtotal, iva, total);
    } catch (error) {
      console.error('Error guardando en Sheets:', error);
      const mensaje = error instanceof Error ? error.message : 'error desconocido';
      errores.push(`Google Sheets: ${mensaje}`);
    }

    try {
      await generarPDF(cart, cliente, proyecto, metodoPago, moneda, ocultarDescuento, subtotal, iva, total);
    } catch (error) {
      console.error('Error generando PDF:', error);
      const mensaje = error instanceof Error ? error.message : 'error desconocido';
      errores.push(`PDF: ${mensaje}`);
    }

    setCargando(false);

    if (errores.length === 0) {
      alert('Cotización guardada correctamente');
    } else {
      alert(`Se completó parcialmente. Revisa lo siguiente:\n\n${errores.join('\n')}`);
    }
  };

  const handleEnviarYGuardar = async () => {
    if (cliente.correos.length === 0) {
      alert('Agrega al menos un correo electrónico');
      return;
    }

    setCargando(true);
    const errores: string[] = [];
    let correoSandbox = false;

    try {
      const resultadoCorreo = await enviarPorCorreo(
        cart,
        cliente,
        proyecto,
        metodoPago,
        moneda,
        ocultarDescuento,
        subtotal,
        iva,
        total
      );
      correoSandbox = Boolean(resultadoCorreo?.sandbox);
    } catch (error) {
      console.error('Error enviando correo:', error);
      const mensaje = error instanceof Error ? error.message : 'error desconocido';
      errores.push(`Correo: ${mensaje}`);
    }

    try {
      await guardarEnSheets(cart, cliente, proyecto, metodoPago, moneda, subtotal, iva, total);
    } catch (error) {
      console.error('Error guardando en Sheets:', error);
      const mensaje = error instanceof Error ? error.message : 'error desconocido';
      errores.push(`Google Sheets: ${mensaje}`);
    }

    try {
      await generarPDF(cart, cliente, proyecto, metodoPago, moneda, ocultarDescuento, subtotal, iva, total);
    } catch (error) {
      console.error('Error generando PDF:', error);
      const mensaje = error instanceof Error ? error.message : 'error desconocido';
      errores.push(`PDF: ${mensaje}`);
    }

    setCargando(false);

    if (errores.length === 0) {
      alert(
        correoSandbox
          ? 'Cotización guardada correctamente. Nota: el correo se envió en modo de prueba (RESEND_API_KEY no configurada), no llegó realmente al cliente.'
          : 'Cotización enviada y guardada correctamente'
      );
    } else {
      alert(`Se completó parcialmente. Revisa lo siguiente:\n\n${errores.join('\n')}`);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 sticky top-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Resumen</h2>

      {cart.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">Tu cotización está vacía</p>
          <p className="text-xs text-gray-400">Agrega productos para comenzar</p>
        </div>
      ) : (
        <>
          {/* Lista de items */}
          <div className="max-h-96 overflow-y-auto mb-6 border-b border-gray-200 pb-4">
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.product.id} className="text-sm">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium text-gray-900 flex-1 line-clamp-2">
                      {item.product.nombre}
                    </p>
                    <button
                      onClick={() => onEliminarProducto(item.product.id)}
                      className="text-red-500 hover:text-red-700 text-lg ml-2"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>
                      ${item.product.precio.toLocaleString('es-MX')} × {item.cantidad}
                      {!ocultarDescuento && item.descuento !== 0 ? ` (${item.descuento}%)` : ''}
                    </span>
                    <span className="font-semibold text-gray-900">
                      ${(item.product.precio * item.cantidad * (1 - item.descuento / 100)).toLocaleString('es-MX', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {item.notas && (
                    <p className="text-xs text-gray-500 italic mt-1">Nota: {item.notas}</p>
                  )}
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <button
                      onClick={() =>
                        onActualizarCantidad(item.product.id, Math.max(1, item.cantidad - 1))
                      }
                      className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.cantidad}
                      onChange={(e) =>
                        onActualizarCantidad(item.product.id, parseInt(e.target.value) || 1)
                      }
                      className="w-10 text-center border border-gray-300 rounded px-1 py-1 text-xs"
                      min="1"
                    />
                    <button
                      onClick={() => onActualizarCantidad(item.product.id, item.cantidad + 1)}
                      className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs"
                    >
                      +
                    </button>
                    {!ocultarDescuento && (
                      <input
                        type="number"
                        value={item.descuento}
                        onChange={(e) =>
                          onActualizarDescuento(item.product.id, parseFloat(e.target.value) || 0)
                        }
                        placeholder="Desc %"
                        title="Descuento %"
                        className="w-14 text-center border border-gray-300 rounded px-1 py-1 text-xs"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Productos por Tipo de Precio */}
          <div className="mb-6">
            <h4 className="font-bold text-gray-900 text-sm mb-2">Productos por Tipo de Precio</h4>
            <div className="space-y-1 text-sm">
              {Object.entries(porTipo).map(([tipo, datos]) => (
                <div key={tipo} className="flex justify-between text-gray-600">
                  <span>{TIPO_LABELS[tipo] || tipo} ({datos.count})</span>
                  <span>${datos.subtotal.toLocaleString('es-MX', { maximumFractionDigits: 2 })} {simbolo}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-gray-700">
              <span>Moneda:</span>
              <span className="font-medium">{simbolo}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Tipo de Cambio:</span>
              <span>${tipoCambio.toFixed(2)} MXN</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Base USD:</span>
              <span>${baseUSD.toLocaleString('es-MX', { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-gray-700 pt-2 border-t border-gray-200">
              <span>Subtotal:</span>
              <span>${subtotal.toLocaleString('es-MX', { maximumFractionDigits: 2 })} {simbolo}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>IVA (16%):</span>
              <span>${iva.toLocaleString('es-MX', { maximumFractionDigits: 2 })} {simbolo}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-[#0055a5] pt-2 border-t-2 border-gray-200">
              <span>Total:</span>
              <span>${total.toLocaleString('es-MX', { maximumFractionDigits: 2 })} {simbolo}</span>
            </div>
          </div>

          {/* Botones */}
          <div className="space-y-2">
            <button
              onClick={handleEnviarYGuardar}
              disabled={cargando}
              className="w-full bg-[#0055a5] hover:bg-blue-800 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium text-sm transition"
            >
              {cargando ? 'Procesando...' : '✉️ Enviar y Guardar'}
            </button>
            <button
              onClick={handleGuardarCotizacion}
              disabled={cargando}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium text-sm transition"
            >
              {cargando ? 'Procesando...' : '📥 Guardar Cotización'}
            </button>
            <button
              onClick={handleDescargarPDF}
              disabled={cargando}
              className="w-full bg-gray-700 hover:bg-gray-800 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium text-sm transition"
            >
              {cargando ? 'Procesando...' : '📄 Descargar PDF'}
            </button>
            <button
              onClick={onLimpiarCarrito}
              className="w-full bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-medium text-sm transition"
            >
              Limpiar Carrito
            </button>
          </div>
        </>
      )}
    </div>
  );
}