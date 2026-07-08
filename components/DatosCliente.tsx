'use client';

import { useEffect, useState } from 'react';
import { DatosCliente as DatosClienteType } from '@/lib/types';
import { MultiEmailInput } from './MultiEmailInput';

interface DatosClienteProps {
  datos: DatosClienteType;
  onChange: (datos: DatosClienteType) => void;
}

const FAVORITOS_KEY = 'favoritos_clientes';

function leerFavoritos(): DatosClienteType[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FAVORITOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Error leyendo favoritos de clientes:', error);
    return [];
  }
}

export function DatosCliente({ datos, onChange }: DatosClienteProps) {
  const [favoritos, setFavoritos] = useState<DatosClienteType[]>([]);
  const [mensajeGuardado, setMensajeGuardado] = useState(false);

  useEffect(() => {
    setFavoritos(leerFavoritos());
  }, []);

  const guardarFavorito = () => {
    if (!datos.nombreCompleto && !datos.empresa) {
      alert('Agrega al menos el nombre completo o la empresa antes de guardar como favorito');
      return;
    }

    const actuales = leerFavoritos();
    const clave = (c: DatosClienteType) => `${c.empresa}__${c.nombreCompleto}`;
    const sinDuplicado = actuales.filter((f) => clave(f) !== clave(datos));
    const nuevos = [
      ...sinDuplicado,
      {
        nombreComercial: datos.nombreComercial || '',
        empresa: datos.empresa,
        nombreCompleto: datos.nombreCompleto,
        telefono: datos.telefono,
        rfc: datos.rfc || '',
        correos: datos.correos,
      },
    ];

    try {
      window.localStorage.setItem(FAVORITOS_KEY, JSON.stringify(nuevos));
      setFavoritos(nuevos);
      setMensajeGuardado(true);
      setTimeout(() => setMensajeGuardado(false), 2000);
    } catch (error) {
      console.error('Error guardando favorito:', error);
      alert('No se pudo guardar el cliente como favorito');
    }
  };

  const cargarFavorito = (indice: number) => {
    if (indice < 0) return;
    const favorito = favoritos[indice];
    if (favorito) {
      onChange({ ...datos, ...favorito });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">Mis Datos de Contacto</h3>
        <div className="flex items-center gap-2">
          {mensajeGuardado && (
            <span className="text-xs text-green-600 font-medium">Guardado ✓</span>
          )}
          <button
            type="button"
            onClick={guardarFavorito}
            title="Guardar como favorito"
            className="text-yellow-500 hover:text-yellow-600 text-lg"
          >
            ⭐
          </button>
        </div>
      </div>

      {favoritos.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cargar cliente guardado
          </label>
          <select
            defaultValue=""
            onChange={(e) => cargarFavorito(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="" disabled>
              Selecciona un favorito...
            </option>
            {favoritos.map((f, idx) => (
              <option key={idx} value={idx}>
                {f.empresa || f.nombreCompleto || `Favorito ${idx + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

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