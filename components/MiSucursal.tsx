export function MiSucursal() {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-blue-600">Mi Sucursal</h3>
        <button className="px-4 py-1 border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50">
          CAMBIAR
        </button>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <span className="text-lg">📍</span>
          <div>
            <p className="font-medium text-gray-900">Dirección Fiscal</p>
            <p className="text-gray-600">AV. BACALAR MZA 3 LOTE 1 203 Int. DEPTO Q</p>
            <p className="text-gray-600">BENITO JUAREZ, QROO 77506</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <span>📞</span>
          <span>9982063719</span>
        </div>
      </div>
    </div>
  );
}