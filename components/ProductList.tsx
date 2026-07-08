'use client';

import { useState } from 'react';
import { Product } from '@/lib/types';

interface ProductListProps {
  productos: Product[];
  tipoPrecio: 'descuento' | 'costoGanancia';
  ocultarDescuento: boolean;
  onAgregarAlCarrito: (producto: Product, cantidad: number, descuento: number, notas: string) => void;
}

export function ProductList({ productos, tipoPrecio, ocultarDescuento, onAgregarAlCarrito }: ProductListProps) {
  if (productos.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No se encontraron productos</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0055a5] text-white">
              <th className="px-3 py-3 text-left font-semibold">Modelo</th>
              <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">Precio Unit.</th>
              {!ocultarDescuento && (
                <th className="px-3 py-3 text-center font-semibold whitespace-nowrap">
                  {tipoPrecio === 'costoGanancia' ? 'Ganancia %' : 'Descuento %'}
                </th>
              )}
              <th className="px-3 py-3 text-center font-semibold">Cantidad</th>
              <th className="px-3 py-3 text-right font-semibold">Importe</th>
              <th className="px-3 py-3 text-center font-semibold">Acción</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <ProductRow
                key={producto.id}
                producto={producto}
                tipoPrecio={tipoPrecio}
                ocultarDescuento={ocultarDescuento}
                onAgregarAlCarrito={onAgregarAlCarrito}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface ProductRowProps {
  producto: Product;
  tipoPrecio: 'descuento' | 'costoGanancia';
  ocultarDescuento: boolean;
  onAgregarAlCarrito: (producto: Product, cantidad: number, descuento: number, notas: string) => void;
}

function ProductRow({ producto, tipoPrecio, ocultarDescuento, onAgregarAlCarrito }: ProductRowProps) {
  const [cantidad, setCantidad] = useState(1);
  const [valorAjuste, setValorAjuste] = useState(0);
  const [mostrarNotas, setMostrarNotas] = useState(false);
  const [notas, setNotas] = useState('');

  const descuentoEfectivo = tipoPrecio === 'costoGanancia' ? -valorAjuste : valorAjuste;
  const importe = producto.precio * cantidad * (1 - descuentoEfectivo / 100);
  const simbolo = producto.moneda === 'USD' ? 'USD' : 'MXN';

  const handleAgregar = () => {
    onAgregarAlCarrito(producto, cantidad, descuentoEfectivo, notas);
    setCantidad(1);
    setValorAjuste(0);
    setNotas('');
    setMostrarNotas(false);
  };

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
        <td className="px-3 py-3 align-top">
          <p className="font-semibold text-gray-900 text-sm line-clamp-2">{producto.nombre}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
              {producto.categoria}
            </span>
            {producto.codigo && (
              <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-mono">
                {producto.codigo}
              </span>
            )}
          </div>
          <button
            onClick={() => setMostrarNotas(!mostrarNotas)}
            className="mt-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            {mostrarNotas ? 'Ocultar notas' : '+ Agregar notas'}
          </button>
          {mostrarNotas && (
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas para este producto..."
              rows={2}
              className="mt-2 w-full px-2 py-1 border border-gray-300 rounded text-xs"
            />
          )}
        </td>
        <td className="px-3 py-3 text-right align-top whitespace-nowrap">
          <p className="font-bold text-[#0055a5]">${producto.precio.toLocaleString('es-MX')}</p>
          <p className="text-xs text-gray-500">{simbolo}</p>
        </td>
        {!ocultarDescuento && (
          <td className="px-3 py-3 align-top">
            <input
              type="number"
              value={valorAjuste}
              onChange={(e) => setValorAjuste(parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
              className="w-16 text-center border border-gray-300 rounded px-1 py-1 text-xs mx-auto block"
            />
          </td>
        )}
        <td className="px-3 py-3 align-top">
          <input
            type="number"
            value={cantidad}
            onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            className="w-14 text-center border border-gray-300 rounded px-1 py-1 text-xs mx-auto block"
          />
        </td>
        <td className="px-3 py-3 text-right align-top whitespace-nowrap">
          <p className="font-bold text-gray-900">${importe.toLocaleString('es-MX', { maximumFractionDigits: 2 })}</p>
        </td>
        <td className="px-3 py-3 text-center align-top">
          <button
            onClick={handleAgregar}
            className="bg-[#0055a5] hover:bg-blue-800 text-white px-3 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap"
          >
            Agregar
          </button>
        </td>
      </tr>
    </>
  );
}