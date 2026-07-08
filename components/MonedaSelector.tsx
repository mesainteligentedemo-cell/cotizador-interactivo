'use client';

interface MonedaSelectorProps {
  moneda: 'USD' | 'MXN';
  tipoCambio: number;
  baseUSD: number;
  onChange: (moneda: 'USD' | 'MXN') => void;
  onTipoCambioChange: (tc: number) => void;
}

export function MonedaSelector({
  moneda,
  tipoCambio,
  baseUSD,
  onChange,
  onTipoCambioChange,
}: MonedaSelectorProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Moneda de Cotización:</h3>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => onChange('USD')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
            moneda === 'USD'
              ? 'bg-gray-100 text-gray-900 border-2 border-gray-400'
              : 'bg-gray-50 text-gray-700 border border-gray-300'
          }`}
        >
          us USD
        </button>
        <button
          onClick={() => onChange('MXN')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
            moneda === 'MXN'
              ? 'bg-blue-600 text-white border-2 border-blue-700'
              : 'bg-gray-50 text-gray-700 border border-gray-300'
          }`}
        >
          MX MXN
        </button>
      </div>

      <p className="text-xs text-yellow-600 mb-3">⚠️ Los precios se convertirán usando el tipo de cambio</p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cambio (MXN/USD):</label>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">$</span>
          <input
            type="number"
            value={tipoCambio}
            onChange={(e) => onTipoCambioChange(parseFloat(e.target.value) || 1)}
            step="0.01"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <span className="text-gray-600">MXN</span>
        </div>
      </div>

      <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
        <p className="text-gray-600">
          Base USD: <span className="font-bold text-gray-900">${baseUSD.toFixed(2)}</span>
        </p>
      </div>
    </div>
  );
}