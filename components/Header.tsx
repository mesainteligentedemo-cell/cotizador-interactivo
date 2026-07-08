export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">Cotizador</h1>
            <p className="text-gray-600 text-sm mt-1">
              Genera cotizaciones de forma rápida y profesional
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-600">Sistemas de Seguridad</p>
            <p className="text-xs text-gray-500 mt-1">
              Alarmas • Videovigilancia • Control de Acceso
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}