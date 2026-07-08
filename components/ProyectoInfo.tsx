'use client';

import { Proyecto } from '@/lib/types';

interface ProyectoInfoProps {
  proyecto: Proyecto;
  onChange: (proyecto: Proyecto) => void;
}

export function ProyectoInfo({ proyecto, onChange }: ProyectoInfoProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Título de la Cotización</label>
        <input
          type="text"
          value={proyecto.titulo}
          onChange={(e) => onChange({ ...proyecto, titulo: e.target.value })}
          placeholder="Ej: BATERIA"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Descripción del Proyecto</label>
        <textarea
          value={proyecto.descripcion}
          onChange={(e) => onChange({ ...proyecto, descripcion: e.target.value })}
          placeholder="Describe los detalles importantes del proyecto..."
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>
    </div>
  );
}