'use client';

import { CartItem } from '@/app/page';
import { useState } from 'react';
import { generarPDF } from '@/lib/generarPDF';
import { enviarPorCorreo } from '@/lib/enviarCorreo';

interface CartSummaryProps {
  cart: CartItem[];
  onActualizarCantidad: (productoId: string, cantidad: number) => void;
  onLimpiarCarrito: () => void;
}

export function CartSummary({
  cart,
  onActualizarCantidad,
  onLimpiarCarrito,
}: CartSummaryProps) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [datosCliente, setDatosCliente] = useState({
    nombre: 'TALLER BONAMPACK LIC. KARLA CERON',
    empresa: '',
    correo: '',
    telefono: '',
  });
  const [cargando, setCargando] = useState(false);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.precio * item.cantidad,
    0
  );
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  const handleDescargarPDF = async () => {
    setCargando(true);
    try {
      await generarPDF(cart, datosCliente, subtotal, iva, total);
    } catch (error) {
      console.error('Error descargando PDF:', error);
      alert('Error al descargar PDF');
    } finally {
      setCargando(false);
    }
  };

  const handleEnviarCorreo = async () => {
    if (!datosCliente.correo) {
      alert('Por favor ingresa un correo electrónico');
      return;
    }

    setCargando(true);
    try {
      await enviarPorCorreo(cart, datosCliente, subtotal, iva, total);
      alert('Cotización enviada correctamente');
      setMostrarFormulario(false);
    } catch (error) {
      console.error('Error enviando correo:', error);
      alert('Error al enviar la cotización');
    } finally {
      setCargando(false);
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
                      onClick={() => onActualizarCantidad(item.product.id, 0)}
                      className="text-red-500 hover:text-red-700 text-lg ml-2"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>
                      ${item.product.precio.toLocaleString('es-MX')} × {item.cantidad}
                    </span>
                    <span className="font-semibold text-gray-900">
                      ${(item.product.precio * item.cantidad).toLocaleString('es-MX')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <button
                      onClick={() =>
                        onActualizarCantidad(
                          item.product.id,
                          Math.max(1, item.cantidad - 1)
                        )
                      }
                      className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.cantidad}
                      onChange={(e) =>
                        onActualizarCantidad(
                          item.product.id,
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="w-10 text-center border border-gray-300 rounded px-1 py-1 text-xs"
                      min="1"
                    />
                    <button
                      onClick={() =>
                        onActualizarCantidad(item.product.id, item.cantidad + 1)
                      }
                      className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal:</span>
              <span>${subtotal.toLocaleString('es-MX')}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>IVA (16%):</span>
              <span>${iva.toLocaleString('es-MX')}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-blue-600 pt-2 border-t-2 border-gray-200">
              <span>Total:</span>
              <span>${total.toLocaleString('es-MX')}</span>
            </div>
          </div>

          {/* Formulario de cliente */}
          {mostrarFormulario && (
            <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
              <h3 className="font-semibold text-sm mb-3">Datos del Cliente</h3>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Nombre/Empresa"
                  value={datosCliente.nombre}
                  onChange={(e) =>
                    setDatosCliente({ ...datosCliente, nombre: e.target.value })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                />
                <input
                  type="text"
                  placeholder="Empresa (opcional)"
                  value={datosCliente.empresa}
                  onChange={(e) =>
                    setDatosCliente({ ...datosCliente, empresa: e.target.value })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                />
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={datosCliente.correo}
                  onChange={(e) =>
                    setDatosCliente({ ...datosCliente, correo: e.target.value })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                />
                <input
                  type="tel"
                  placeholder="Teléfono (opcional)"
                  value={datosCliente.telefono}
                  onChange={(e) =>
                    setDatosCliente({ ...datosCliente, telefono: e.target.value })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                />
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="space-y-2">
            <button
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-lg font-medium text-sm transition"
            >
              {mostrarFormulario ? 'Ocultar Datos' : 'Mostrar Datos del Cliente'}
            </button>
            <button
              onClick={handleDescargarPDF}
              disabled={cargando}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium text-sm transition"
            >
              {cargando ? 'Procesando...' : '📥 Descargar PDF'}
            </button>
            <button
              onClick={handleEnviarCorreo}
              disabled={cargando}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium text-sm transition"
            >
              {cargando ? 'Procesando...' : '✉️ Enviar por Correo'}
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