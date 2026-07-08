import { Product } from '@/app/page';

interface ProductListProps {
  productos: Product[];
  onAgregarAlCarrito: (producto: Product) => void;
}

export function ProductList({ productos, onAgregarAlCarrito }: ProductListProps) {
  if (productos.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No se encontraron productos</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {productos.map((producto) => (
        <div
          key={producto.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                {producto.nombre}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                  {producto.categoria}
                </span>
                {producto.codigo && (
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded font-mono">
                    {producto.codigo}
                  </span>
                )}
              </div>
              {producto.proveedor !== 'N/A' && (
                <p className="text-xs text-gray-500 mt-1">
                  Proveedor: {producto.proveedor}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2 whitespace-nowrap">
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600">
                  ${producto.precio.toLocaleString('es-MX')}
                </p>
                <p className="text-xs text-gray-500">MXN</p>
              </div>
              <button
                onClick={() => onAgregarAlCarrito(producto)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}