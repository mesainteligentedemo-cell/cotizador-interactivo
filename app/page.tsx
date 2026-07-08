'use client';

import { useState, useMemo } from 'react';
import { ProductList } from '@/components/ProductList';
import { CartSummary } from '@/components/CartSummary';
import { Header } from '@/components/Header';
import { FilterBar } from '@/components/FilterBar';
import { VigenciaBadge } from '@/components/VigenciaBadge';
import { MiSucursal } from '@/components/MiSucursal';
import { ProyectoInfo } from '@/components/ProyectoInfo';
import { DatosCliente as DatosClienteForm } from '@/components/DatosCliente';
import { MetodoPago as MetodoPagoSelector } from '@/components/MetodoPago';
import { MonedaSelector } from '@/components/MonedaSelector';
import { calcularSubtotal } from '@/lib/calculos';
import { Product, CartItem, MetodoPago, DatosCliente, Proyecto } from '@/lib/types';

export default function Home() {
  const [productos] = useState<Product[]>(getProductos());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [tipoProductoFiltro, setTipoProductoFiltro] = useState<'' | 'catalogo' | 'otro' | 'manoObra'>('');
  const [tipoPrecio, setTipoPrecio] = useState<'descuento' | 'costoGanancia'>('descuento');
  const [ocultarDescuento, setOcultarDescuento] = useState(false);

  const [metodoPago, setMetodoPago] = useState<MetodoPago>('transferencia');
  const [moneda, setMoneda] = useState<'USD' | 'MXN'>('MXN');
  const [tipoCambio, setTipoCambio] = useState(18.5);

  const [cliente, setCliente] = useState<DatosCliente>({
    nombreComercial: '',
    empresa: '',
    nombreCompleto: 'TALLER BONAMPACK LIC. KARLA CERON',
    correos: [],
    telefono: '',
    rfc: '',
  });

  const [proyecto, setProyecto] = useState<Proyecto>({
    titulo: '',
    descripcion: '',
  });

  const categorias = useMemo(
    () => Array.from(new Set(productos.map((p) => p.categoria))).sort(),
    [productos]
  );

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const matchCategoria = !filtroCategoria || p.categoria === filtroCategoria;
      const matchTipo = !tipoProductoFiltro || (p.tipoProducto || 'catalogo') === tipoProductoFiltro;
      const matchBusqueda =
        !busqueda ||
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.codigo.toLowerCase().includes(busqueda.toLowerCase());
      return matchCategoria && matchTipo && matchBusqueda;
    });
  }, [productos, filtroCategoria, tipoProductoFiltro, busqueda]);

  const { baseUSD } = useMemo(
    () => calcularSubtotal(cart, moneda, tipoCambio),
    [cart, moneda, tipoCambio]
  );

  const agregarAlCarrito = (
    producto: Product,
    cantidad: number,
    descuento: number,
    notas: string
  ) => {
    setCart((prev) => {
      const existe = prev.find((item) => item.product.id === producto.id);
      if (existe) {
        return prev.map((item) =>
          item.product.id === producto.id
            ? {
                ...item,
                cantidad: item.cantidad + cantidad,
                descuento,
                notas: notas || item.notas,
              }
            : item
        );
      }
      return [...prev, { product: producto, cantidad, descuento, notas }];
    });
  };

  const actualizarCantidad = (productoId: string, cantidad: number) => {
    if (cantidad <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productoId));
    } else {
      setCart((prev) =>
        prev.map((item) => (item.product.id === productoId ? { ...item, cantidad } : item))
      );
    }
  };

  const actualizarDescuento = (productoId: string, descuento: number) => {
    setCart((prev) =>
      prev.map((item) => (item.product.id === productoId ? { ...item, descuento } : item))
    );
  };

  const actualizarNotas = (productoId: string, notas: string) => {
    setCart((prev) =>
      prev.map((item) => (item.product.id === productoId ? { ...item, notas } : item))
    );
  };

  const eliminarDelCarrito = (productoId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productoId));
  };

  const limpiarCarrito = () => {
    setCart([]);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <VigenciaBadge />
          <MiSucursal />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel Izquierdo - Proyecto + Filtros + Productos */}
          <div className="lg:col-span-2">
            <ProyectoInfo proyecto={proyecto} onChange={setProyecto} />

            <FilterBar
              categorias={categorias}
              filtroCategoria={filtroCategoria}
              setFiltroCategoria={setFiltroCategoria}
              busqueda={busqueda}
              setBusqueda={setBusqueda}
              tipoProductoFiltro={tipoProductoFiltro}
              setTipoProductoFiltro={setTipoProductoFiltro}
              tipoPrecio={tipoPrecio}
              setTipoPrecio={setTipoPrecio}
              ocultarDescuento={ocultarDescuento}
              setOcultarDescuento={setOcultarDescuento}
            />

            <ProductList
              productos={productosFiltrados}
              tipoPrecio={tipoPrecio}
              ocultarDescuento={ocultarDescuento}
              onAgregarAlCarrito={agregarAlCarrito}
            />
          </div>

          {/* Panel Derecho - Cliente + Pago + Moneda + Resumen */}
          <div className="lg:col-span-1">
            <DatosClienteForm datos={cliente} onChange={setCliente} />
            <MetodoPagoSelector valor={metodoPago} onChange={setMetodoPago} />
            <MonedaSelector
              moneda={moneda}
              tipoCambio={tipoCambio}
              baseUSD={baseUSD}
              onChange={setMoneda}
              onTipoCambioChange={setTipoCambio}
            />
            <CartSummary
              cart={cart}
              moneda={moneda}
              tipoCambio={tipoCambio}
              metodoPago={metodoPago}
              cliente={cliente}
              proyecto={proyecto}
              ocultarDescuento={ocultarDescuento}
              onActualizarCantidad={actualizarCantidad}
              onActualizarDescuento={actualizarDescuento}
              onActualizarNotas={actualizarNotas}
              onEliminarProducto={eliminarDelCarrito}
              onLimpiarCarrito={limpiarCarrito}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function getProductos(): Product[] {
  return [
    // ALARMAS
    {
      id: '1',
      nombre: 'KIT PROFESIONAL DE ALARMA HÍBRIDO PRO4G CON COMUNICADOR 4G LTE',
      precio: 5900,
      categoria: 'ALARMAS',
      proveedor: 'SYSCOM',
      codigo: 'PRO4GEN2K',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '2',
      nombre: 'Batería de respaldo AGM-VRLA 12V 75Ah',
      precio: 0,
      categoria: 'ALARMAS',
      proveedor: 'SYSCOM',
      codigo: 'PL-12-12',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '3',
      nombre: 'Llavero remoto de 4 botones para Sistema PRO4G',
      precio: 900,
      categoria: 'ALARMAS',
      proveedor: 'SYSCOM',
      codigo: 'SFWST102',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '4',
      nombre: 'SENSOR + TRANSMISOR 1 ZONA Inalámbrico',
      precio: 877,
      categoria: 'ALARMAS',
      proveedor: 'SYSCOM',
      codigo: 'SFWST232',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '5',
      nombre: 'Detector de movimiento inalámbrico con inmunidad 31kg',
      precio: 1200,
      categoria: 'ALARMAS',
      proveedor: 'SYSCOM',
      codigo: 'SFWST742',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '6',
      nombre: 'Panel de Alarma Cloud Híbrido 4G LTE PRO4G',
      precio: 7253,
      categoria: 'ALARMAS',
      proveedor: 'SYSCOM',
      codigo: 'PRO4GLTEM',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '7',
      nombre: 'Sirena inalámbrica exterior/interior con batería',
      precio: 1268,
      categoria: 'ALARMAS',
      proveedor: 'SYSCOM',
      codigo: 'SF-70WK',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '8',
      nombre: 'Comunicador M2M LTE 5G Dual SIM compatible Honeywell/DSC',
      precio: 4200,
      categoria: 'ALARMAS',
      proveedor: 'SYSCOM',
      codigo: 'MN01-LTE-M',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '9',
      nombre: 'Contacto magnético de uso rudo para piso OVERHEAD',
      precio: 750,
      categoria: 'ALARMAS',
      proveedor: 'SYSCOM',
      codigo: '958',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '10',
      nombre: 'Sirena de 2 tonos 30W 118dB',
      precio: 750,
      categoria: 'ALARMAS',
      proveedor: 'SYSCOM',
      codigo: 'SF-581A',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },

    // ALARMA VISTA 48
    {
      id: '11',
      nombre: 'Kit inalámbrico VISTA48 con teclado y accesorios',
      precio: 7500,
      categoria: 'ALARMA VISTA 48',
      proveedor: 'SYSCOM',
      codigo: 'VISTA48ECORF',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '12',
      nombre: 'Detector de movimiento inalámbrico VISTA48 36kg',
      precio: 950,
      categoria: 'ALARMA VISTA 48',
      proveedor: 'SYSCOM',
      codigo: '5800-PIR',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '13',
      nombre: 'Contacto magnético inalámbrico VISTA48',
      precio: 850,
      categoria: 'ALARMA VISTA 48',
      proveedor: 'SYSCOM',
      codigo: '5816',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },

    // ALARMA AJAX
    {
      id: '14',
      nombre: 'AJAX KIT STARTER Hub2Plus Ethernet/WiFi/LTE',
      precio: 8300,
      categoria: 'ALARMA AJAX',
      proveedor: 'TVC',
      codigo: 'AJAX KIT STARTER',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '15',
      nombre: 'AJAX SpaceControl W - Llavero inalámbrico',
      precio: 850,
      categoria: 'ALARMA AJAX',
      proveedor: 'TVC',
      codigo: 'AJX-SPACE',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '16',
      nombre: 'AJAX Keypad W - Teclado táctil inalámbrico',
      precio: 2200,
      categoria: 'ALARMA AJAX',
      proveedor: 'TVC',
      codigo: 'AJX-KEYPAD',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },

    // ALARMA DAHUA
    {
      id: '17',
      nombre: 'Panel de Alarma Inalámbrico Dahua ARC3000H-FW2',
      precio: 3600,
      categoria: 'ALARMA DAHUA',
      proveedor: 'TVC',
      codigo: 'DAHUA DHI-ARC3000H-FW2',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '18',
      nombre: 'Detector PIR Inalámbrico Dahua con inmunidad mascotas',
      precio: 500,
      categoria: 'ALARMA DAHUA',
      proveedor: 'TVC',
      codigo: 'DAHUA DHI-ARD1233-W2',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },

    // CÁMARAS
    {
      id: '19',
      nombre: 'Cámara Bullet Varifocal 2MP Lente 2.7-12mm',
      precio: 1250,
      categoria: 'CÁMARAS',
      proveedor: 'TVC',
      codigo: 'DAH3950025',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '20',
      nombre: 'Cámara Bullet 5MP Lente 2.8mm 106°',
      precio: 1250,
      categoria: 'CÁMARAS',
      proveedor: 'TVC',
      codigo: 'DHT0290034',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '21',
      nombre: 'Cámara Bullet HDCVI 1080p 82° Lente 3.6mm',
      precio: 1250,
      categoria: 'CÁMARAS',
      proveedor: 'TVC',
      codigo: 'SCA395014',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '22',
      nombre: 'Bala TURBOHD 2MP Metallic 103° Lente 2.8mm',
      precio: 1250,
      categoria: 'CÁMARAS',
      proveedor: 'SYSCOM',
      codigo: 'B8-TURBO-XG2W',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '23',
      nombre: 'Cámara Bala IP 4MP Lente 2.8mm 30mts IR',
      precio: 2800,
      categoria: 'CÁMARAS',
      proveedor: 'SYSCOM',
      codigo: 'DS-2CV2041G2-IDW(D)',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },

    // DVR/NVR
    {
      id: '24',
      nombre: 'DVR 16 Canales 1080p Lite WizSense H.265+',
      precio: 2500,
      categoria: 'DVR/NVR',
      proveedor: 'TVC',
      codigo: 'DHT0370012',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '25',
      nombre: 'DVR 4 Canales Pentahíbrido 4MP Lite H265+',
      precio: 1613,
      categoria: 'DVR/NVR',
      proveedor: 'TVC',
      codigo: 'DAD499004',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '26',
      nombre: 'DVR 8 Canales 5MP Lite WizSense H.265+',
      precio: 3040,
      categoria: 'DVR/NVR',
      proveedor: 'TVC',
      codigo: 'DAHUA XVR5108HS-I3',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },

    // DISCOS DUROS
    {
      id: '27',
      nombre: 'Disco Duro 3TB Purple para Videovigilancia',
      precio: 2800,
      categoria: 'DISCOS DUROS',
      proveedor: 'TVC',
      codigo: 'TVM110069',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '28',
      nombre: 'Disco Duro 4TB Purple SATA 6Gbs',
      precio: 3800,
      categoria: 'DISCOS DUROS',
      proveedor: 'TVC',
      codigo: 'WDC1490012',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '29',
      nombre: 'Disco Duro 6TB Purple para Videovigilancia',
      precio: 5900,
      categoria: 'DISCOS DUROS',
      proveedor: 'TVC',
      codigo: 'WDC1490005',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },

    // ACCESORIOS
    {
      id: '30',
      nombre: 'Fuente de poder regulada 12VCD 4.1A',
      precio: 750,
      categoria: 'ACCESORIOS',
      proveedor: 'TVC',
      codigo: 'TVN0830052',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '31',
      nombre: 'Switch PoE 6 puertos Fast Ethernet 36W',
      precio: 1200,
      categoria: 'ACCESORIOS',
      proveedor: 'TVC',
      codigo: 'DAHUA PFS3006-4ET-36',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '32',
      nombre: 'Cable UTP Cat5E 100% cobre 305mts',
      precio: 3500,
      categoria: 'ACCESORIOS',
      proveedor: 'TVC',
      codigo: 'TVD119047',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '33',
      nombre: 'UPS 1500VA 900W Línea Interactiva AVR',
      precio: 3670,
      categoria: 'ACCESORIOS',
      proveedor: 'TVC',
      codigo: 'DAHUA DH-PFM350-900',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },

    // CONTROL DE ACCESO
    {
      id: '34',
      nombre: 'Barrera Vehicular Izquierda Led Servo Motor',
      precio: 28630,
      categoria: 'CONTROL DE ACCESO',
      proveedor: 'TVC',
      codigo: 'TVB348020',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '35',
      nombre: 'Terminal Control Acceso Facial Proface X ZKTeco',
      precio: 24537,
      categoria: 'CONTROL DE ACCESO',
      proveedor: 'TVC',
      codigo: 'ZTA0610006',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },
    {
      id: '36',
      nombre: 'Control Acceso 1 Puerta 1500 usuarios',
      precio: 3000,
      categoria: 'CONTROL DE ACCESO',
      proveedor: 'TVC',
      codigo: 'ZKT0680042',
      moneda: 'MXN',
      tipoProducto: 'catalogo',
    },

    // SERVICIOS / MANO DE OBRA
    {
      id: '37',
      nombre: 'Póliza Mensual Mantenimiento y Monitoreo',
      precio: 600,
      categoria: 'SERVICIOS',
      proveedor: 'N/A',
      codigo: 'POL-MES',
      moneda: 'MXN',
      tipoProducto: 'manoObra',
    },
    {
      id: '38',
      nombre: 'Póliza Trimestral Mantenimiento y Monitoreo',
      precio: 1800,
      categoria: 'SERVICIOS',
      proveedor: 'N/A',
      codigo: 'POL-TRIM',
      moneda: 'MXN',
      tipoProducto: 'manoObra',
    },
    {
      id: '39',
      nombre: 'Servicio de Instalación Alarma Cancún',
      precio: 2500,
      categoria: 'SERVICIOS',
      proveedor: 'N/A',
      codigo: 'INST-CANCUN',
      moneda: 'MXN',
      tipoProducto: 'manoObra',
    },
    {
      id: '40',
      nombre: 'Mano de obra - Instalación y configuración por técnico especializado (por hora)',
      precio: 350,
      categoria: 'SERVICIOS',
      proveedor: 'N/A',
      codigo: 'MO-HORA',
      moneda: 'MXN',
      tipoProducto: 'manoObra',
    },
    {
      id: '41',
      nombre: 'Material eléctrico y cableado adicional para instalación',
      precio: 850,
      categoria: 'ACCESORIOS',
      proveedor: 'N/A',
      codigo: 'OTR-CABLE',
      moneda: 'MXN',
      tipoProducto: 'otro',
    },
    {
      id: '42',
      nombre: 'Canaleta y ductería para obra civil ligera',
      precio: 420,
      categoria: 'ACCESORIOS',
      proveedor: 'N/A',
      codigo: 'OTR-CANALETA',
      moneda: 'MXN',
      tipoProducto: 'otro',
    },
  ];
}