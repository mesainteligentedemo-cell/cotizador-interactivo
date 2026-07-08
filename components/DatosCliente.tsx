'use client';

import { DatosCliente as DatosClienteType } from '@/lib/types';
import { MultiEmailInput } from './MultiEmailInput';

interface DatosClienteProps {
  datos: DatosClienteType;
  onChange: (datos: DatosClienteType) => void;
}

export function DatosCliente({ datos, onChange }: DatosClienteProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">Mis Datos de Contacto</h3>
        <button className="text-yellow-500 hover:text-yellow-600 text-lg">⭐</button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre comercial (opcional)</label>
          <input
            type="text"
            placeholder="Nombre comercial"
            value={datos.nombreComercial || ''}
            onChange={(e) => onChange({ ...datos, nombreComercial: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de empresa o marca</label>
          <input
            type="text"
            value={datos.empresa}
            onChange={(e) => onChange({ ...datos, empresa: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
          <input
            type="text"
            value={datos.nombreCompleto}
            onChange={(e) => onChange({ ...datos, nombreCompleto: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">RFC (opcional)</label>
          <input
            type="text"
            value={datos.rfc || ''}
            onChange={(e) => onChange({ ...datos, rfc: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input
            type="tel"
            value={datos.telefono}
            onChange={(e) => onChange({ ...datos, telefono: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <MultiEmailInput
          correos={datos.correos}
          onChange={(correos) => onChange({ ...datos, correos })}
        />
      </div>
    </div>
  );
}