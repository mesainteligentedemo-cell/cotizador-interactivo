'use client';

import { useState } from 'react';

const SUCURSALES = [
  {
    nombre: 'Mi Sucursal',
    direccion: 'AV. BACALAR MZA 3 LOTE 1 203 Int. DEPTO Q',
    ciudad: 'BENITO JUAREZ, QROO 77506',
    telefono: '9982063719',
  },
];

export function MiSucursal() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [sucursalActual, setSucursalActual] = useState(0);

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6 relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-blue-600">Mi Sucursal</h3>
        <button
          type="button"
          onClick={() => setModalAbierto(true)}
          className="px-4 py-1 border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50"
        >
          CAMBIAR
        </button>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <span className="text-lg">📍</span>
          <div>
            <p className="font-medium text-gray-900">Dirección Fiscal</p>
            <p className="text-gray-600">{SUCURSALES[sucursalActual].direccion}</p>
            <p className="text-gray-600">{SUCURSALES[sucursalActual].ciudad}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <span>📞</span>
          <span>{SUCURSALES[sucursalActual].telefono}</span>
        </div>
      </div>

      {modalAbierto && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setModalAbierto(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-lg font-bold text-gray-900 mb-4">Seleccionar Sucursal</h4>
            <div className="space-y-2">
              {SUCURSALES.map((sucursal, idx) => (
                <button
                  key={sucursal.nombre}
                  type="button"
                  onClick={() => {
                    setSucursalActual(idx);
                    setModalAbierto(false);
                  }}
                  className={`w-full text-left px-4 py-2 rounded-lg border text-sm transition ${
                    idx === sucursalActual
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {sucursal.nombre}
                </button>
              ))}
              <p className="text-xs text-gray-400 pt-2">
                Próximamente: administra múltiples sucursales.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalAbierto(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}