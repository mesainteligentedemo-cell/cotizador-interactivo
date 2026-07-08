import { formatearFecha } from '@/lib/calculos';

export function VigenciaBadge() {
  const fechaVencimiento = formatearFecha(30);

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
      <h4 className="font-bold text-gray-900 mb-2">Vigencia de la Cotización:</h4>
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-gray-900">30</span>
        <span className="text-gray-600">días</span>
        <span className="text-2xl">⭐</span>
      </div>
      <p className="text-sm text-gray-600 mt-2">Válida hasta: {fechaVencimiento}</p>
    </div>
  );
}