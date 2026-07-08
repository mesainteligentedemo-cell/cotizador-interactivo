'use client';

import { MetodoPago as MetodoPagoType } from '@/lib/types';

interface MetodoPagoProps {
  valor: MetodoPagoType;
  onChange: (valor: MetodoPagoType) => void;
}

export function MetodoPago({ valor, onChange }: MetodoPagoProps) {
  const opciones: { value: MetodoPagoType; label: string }[] = [
    { value: 'tarjeta_credito', label: 'Tarjeta de Crédito' },
    { value: 'tarjeta_debito', label: 'Tarjeta de Débito' },
    { value: 'contado', label: 'Contado' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'credito', label: 'Crédito' },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Método de Pago</h3>
      <div className="grid grid-cols-2 gap-3">
        {opciones.map((opcion) => (
          <button
            key={opcion.value}
            onClick={() => onChange(opcion.value)}
            className={`px-4 py-3 rounded-lg font-medium text-sm transition ${
              valor === opcion.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {opcion.label}
          </button>
        ))}
      </div>
    </div>
  );
}