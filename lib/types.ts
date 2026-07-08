export interface Product {
  id: string;
  nombre: string;
  precio: number;
  categoria: string;
  proveedor: string;
  codigo: string;
  moneda?: 'USD' | 'MXN';
  tipoProducto?: 'catalogo' | 'otro' | 'manoObra';
}

export interface CartItem {
  product: Product;
  cantidad: number;
  descuento: number; // % descuento
  notas: string;
}

export type MetodoPago = 'tarjeta_credito' | 'tarjeta_debito' | 'contado' | 'cheque' | 'transferencia' | 'credito';

export interface DatosCliente {
  nombreComercial?: string;
  empresa: string;
  nombreCompleto: string;
  correos: string[];
  telefono: string;
  rfc?: string;
}

export interface Proyecto {
  titulo: string;
  descripcion: string;
}