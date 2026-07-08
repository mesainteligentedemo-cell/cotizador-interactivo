interface FilterBarProps {
  categorias: string[];
  filtroCategoria: string;
  setFiltroCategoria: (categoria: string) => void;
  busqueda: string;
  setBusqueda: (busqueda: string) => void;
}

export function FilterBar({
  categorias,
  filtroCategoria,
  setFiltroCategoria,
  busqueda,
  setBusqueda,
}: FilterBarProps) {
  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="space-y-4">
        {/* Búsqueda */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar producto o código
          </label>
          <input
            type="text"
            placeholder="Ej: Alarma, camara, PRO4G..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filtro por Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoría
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setFiltroCategoria('')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                filtroCategoria === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setFiltroCategoria(cat)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  filtroCategoria === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}