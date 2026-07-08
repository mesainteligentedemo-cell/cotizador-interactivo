'use client';

interface FilterBarProps {
  categorias: string[];
  filtroCategoria: string;
  setFiltroCategoria: (categoria: string) => void;
  busqueda: string;
  setBusqueda: (busqueda: string) => void;
  tipoProductoFiltro: '' | 'catalogo' | 'otro' | 'manoObra';
  setTipoProductoFiltro: (tipo: '' | 'catalogo' | 'otro' | 'manoObra') => void;
  tipoPrecio: 'descuento' | 'costoGanancia';
  setTipoPrecio: (tipo: 'descuento' | 'costoGanancia') => void;
  ocultarDescuento: boolean;
  setOcultarDescuento: (valor: boolean) => void;
}

export function FilterBar({
  categorias,
  filtroCategoria,
  setFiltroCategoria,
  busqueda,
  setBusqueda,
  tipoProductoFiltro,
  setTipoProductoFiltro,
  tipoPrecio,
  setTipoPrecio,
  ocultarDescuento,
  setOcultarDescuento,
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

        {/* Tipo de producto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Producto
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setTipoProductoFiltro('catalogo')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                tipoProductoFiltro === 'catalogo'
                  ? 'bg-[#0055a5] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Catálogo
            </button>
            <button
              onClick={() => setTipoProductoFiltro('otro')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                tipoProductoFiltro === 'otro'
                  ? 'bg-[#0055a5] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Otros productos
            </button>
            <button
              onClick={() => setTipoProductoFiltro('manoObra')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                tipoProductoFiltro === 'manoObra'
                  ? 'bg-[#0055a5] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mano de Obra
            </button>
          </div>
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

        {/* Toggle tipo de precio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Precio con descuento / Costo + ganancia
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setTipoPrecio('descuento')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                tipoPrecio === 'descuento'
                  ? 'bg-[#0055a5] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Precio con descuento
            </button>
            <button
              onClick={() => setTipoPrecio('costoGanancia')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                tipoPrecio === 'costoGanancia'
                  ? 'bg-[#0055a5] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Costo + ganancia
            </button>
          </div>
        </div>

        {/* Ocultar descuento al cliente */}
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={ocultarDescuento}
            onChange={(e) => setOcultarDescuento(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Ocultar descuento al cliente
        </label>
      </div>
    </div>
  );
}