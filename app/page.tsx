'use client';

import { useState, useMemo } from 'react';
import { ProductList } from '@/components/ProductList';
import { CartSummary } from '@/components/CartSummary';
import { Header } from '@/components/Header';
import { FilterBar } from '@/components/FilterBar';

export interface Product {
  id: string;
  nombre: string;
  precio: number;
  categoria: string;
  proveedor: string;
  codigo: string;
}

export interface CartItem {
  product: Product;
  cantidad: number;
}

export default function Home() {
  const [productos] = useState<Product[]>(getProductos());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const categorias = useMemo(
    () => Array.from(new Set(productos.map((p) => p.categoria))).sort(),
    [productos]
  );

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const matchCategoria = !filtroCategoria || p.categoria === filtroCategoria;
      const matchBusqueda =
        !busqueda ||
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.codigo.toLowerCase().includes(busqueda.toLowerCase());
      return matchCategoria && matchBusqueda;
    });
  }, [productos, filtroCategoria, busqueda]);

  const agregarAlCarrito = (producto: Product) => {
    setCart((prev) => {
      const existe = prev.find((item) => item.product.id === producto.id);
      if (existe) {
        return prev.map((item) =>
          item.product.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prev, { product: producto, cantidad: 1 }];
    });
  };

  const actualizarCantidad = (productoId: string, cantidad: number) => {
    if (cantidad <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productoId));
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === productoId
            ? { ...item, cantidad }
            : item
        )
      );
    }
  };

  const limpiarCarrito = () => {
    setCart([]);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel Izquierdo - Productos */}
          <div className="lg:col-span-2">
            <FilterBar
              categorias={categorias}
              filtroCategoria={filtroCategoria}
              setFiltroCategoria={setFiltroCategoria}
              busqueda={busqueda}
              setBusqueda={setBusqueda}
            />

            <ProductList
              productos={productosFiltrados}
              onAgregarAlCarrito={agregarAlCarrito}
            />
          </div>

          {/* Panel Derecho - Carrito */}
          <div className="lg:col-span-1">
            <CartSummary
              cart={cart}
              onActualizarCantidad={actualizarCantidad}
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
    },
    {
      id: '2',
      nombre: 'Batería de respaldo AGM-VRLA 12V 75Ah',
      precio: 0,
      categoria: 'ALARMAS',
      proveedor: 'SYSCOM',
      codigo: 'PL-12-12',
    },
    {
      id: '3',
      nombre: 'Llavero remoto de 4 botones para Sistema PRO4G',
      precio: 900,
      categoria: 'ALARMAS',
      proveedor: 'SYSCOM',
      codigo: 'SFWST102',
    },
    {
      id: '4',
      nombre: 'SENSOR + TRANSMISOR 1 ZONA Inalámbrico',
      precio: 877,
      categoria: 'ALARMAS',
      proveedor: 'SYSCOM',
      codigo: 'SFWST232',
    },
    {
      id: '5',
      nombre: 'Detector de movimiento inalámbrico con inmunidad 31kg',
      precio: 1200,
      categoria: 'ALARMAS',
      proveedor: 'SYSCOM',
      codigo: 'SFWST742',
    },
    {
      id: '6',
      nombre: 'Panel de Alarma Cloud Híbrido 4G LTE PRO4G',
      precio: 7253,
      categoria: 'ALARMAS',
      proveedor: 'SYSCOM',
      codigo: 'PRO4GLTEM',
    },
    {
      id: '7',
      nombre: 'Sirena inalámbrica exterior/interior con batería',
      precio: 1268,
      categoria: 'ALARMAS',
      proveedor: 'SYSCOM',
      codigo: 'SF-70WK',
    },
    {
      id: '8',
      nombre: 'Comunicador M2M LTE 5G Dual SIM compatible Honeywell/DSC',
      precio: 4200,
      categoria: 'ALARMAS',
      proveedor: 'SYSCOM',
      codigo: 'MN01-LTE-M',
    },
    {
      id: '9',
      nombre: 'Contacto magnético de uso rudo para piso OVERHEAD',
      precio: 750,
      categoria: 'ALARMAS',
      proveedor: 'SYSCOM',
      codigo: '958',
    },
    {
      id: '10',
      nombre: 'Sirena de 2 tonos 30W 118dB',
      precio: 750,
      categoria: 'ALARMAS',
      proveedor: 'SYSCOM',
      codigo: 'SF-581A',
    },

    // ALARMA VISTA 48
    {
      id: '11',
      nombre: 'Kit inalámbrico VISTA48 con teclado y accesorios',
      precio: 7500,
      categoria: 'ALARMA VISTA 48',
      proveedor: 'SYSCOM',
      codigo: 'VISTA48ECORF',
    },
    {
      id: '12',
      nombre: 'Detector de movimiento inalámbrico VISTA48 36kg',
      precio: 950,
      categoria: 'ALARMA VISTA 48',
      proveedor: 'SYSCOM',
      codigo: '5800-PIR',
    },
    {
      id: '13',
      nombre: 'Contacto magnético inalámbrico VISTA48',
      precio: 850,
      categoria: 'ALARMA VISTA 48',
      proveedor: 'SYSCOM',
      codigo: '5816',
    },

    // ALARMA AJAX
    {
      id: '14',
      nombre: 'AJAX KIT STARTER Hub2Plus Ethernet/WiFi/LTE',
      precio: 8300,
      categoria: 'ALARMA AJAX',
      proveedor: 'TVC',
      codigo: 'AJAX KIT STARTER',
    },
    {
      id: '15',
      nombre: 'AJAX SpaceControl W - Llavero inalámbrico',
      precio: 850,
      categoria: 'ALARMA AJAX',
      proveedor: 'TVC',
      codigo: 'AJX-SPACE',
    },
    {
      id: '16',
      nombre: 'AJAX Keypad W - Teclado táctil inalámbrico',
      precio: 2200,
      categoria: 'ALARMA AJAX',
      proveedor: 'TVC',
      codigo: 'AJX-KEYPAD',
    },

    // ALARMA DAHUA
    {
      id: '17',
      nombre: 'Panel de Alarma Inalámbrico Dahua ARC3000H-FW2',
      precio: 3600,
      categoria: 'ALARMA DAHUA',
      proveedor: 'TVC',
      codigo: 'DAHUA DHI-ARC3000H-FW2',
    },
    {
      id: '18',
      nombre: 'Detector PIR Inalámbrico Dahua con inmunidad mascotas',
      precio: 500,
      categoria: 'ALARMA DAHUA',
      proveedor: 'TVC',
      codigo: 'DAHUA DHI-ARD1233-W2',
    },

    // CÁMARAS
    {
      id: '19',
      nombre: 'Cámara Bullet Varifocal 2MP Lente 2.7-12mm',
      precio: 1250,
      categoria: 'CÁMARAS',
      proveedor: 'TVC',
      codigo: 'DAH3950025',
    },
    {
      id: '20',
      nombre: 'Cámara Bullet 5MP Lente 2.8mm 106°',
      precio: 1250,
      categoria: 'CÁMARAS',
      proveedor: 'TVC',
      codigo: 'DHT0290034',
    },
    {
      id: '21',
      nombre: 'Cámara Bullet HDCVI 1080p 82° Lente 3.6mm',
      precio: 1250,
      categoria: 'CÁMARAS',
      proveedor: 'TVC',
      codigo: 'SCA395014',
    },
    {
      id: '22',
      nombre: 'Bala TURBOHD 2MP Metallic 103° Lente 2.8mm',
      precio: 1250,
      categoria: 'CÁMARAS',
      proveedor: 'SYSCOM',
      codigo: 'B8-TURBO-XG2W',
    },
    {
      id: '23',
      nombre: 'Cámara Bala IP 4MP Lente 2.8mm 30mts IR',
      precio: 2800,
      categoria: 'CÁMARAS',
      proveedor: 'SYSCOM',
      codigo: 'DS-2CV2041G2-IDW(D)',
    },

    // DVR/NVR
    {
      id: '24',
      nombre: 'DVR 16 Canales 1080p Lite WizSense H.265+',
      precio: 2500,
      categoria: 'DVR/NVR',
      proveedor: 'TVC',
      codigo: 'DHT0370012',
    },
    {
      id: '25',
      nombre: 'DVR 4 Canales Pentahíbrido 4MP Lite H265+',
      precio: 1613,
      categoria: 'DVR/NVR',
      proveedor: 'TVC',
      codigo: 'DAD499004',
    },
    {
      id: '26',
      nombre: 'DVR 8 Canales 5MP Lite WizSense H.265+',
      precio: 3040,
      categoria: 'DVR/NVR',
      proveedor: 'TVC',
      codigo: 'DAHUA XVR5108HS-I3',
    },

    // DISCOS DUROS
    {
      id: '27',
      nombre: 'Disco Duro 3TB Purple para Videovigilancia',
      precio: 2800,
      categoria: 'DISCOS DUROS',
      proveedor: 'TVC',
      codigo: 'TVM110069',
    },
    {
      id: '28',
      nombre: 'Disco Duro 4TB Purple SATA 6Gbs',
      precio: 3800,
      categoria: 'DISCOS DUROS',
      proveedor: 'TVC',
      codigo: 'WDC1490012',
    },
    {
      id: '29',
      nombre: 'Disco Duro 6TB Purple para Videovigilancia',
      precio: 5900,
      categoria: 'DISCOS DUROS',
      proveedor: 'TVC',
      codigo: 'WDC1490005',
    },

    // ACCESORIOS
    {
      id: '30',
      nombre: 'Fuente de poder regulada 12VCD 4.1A',
      precio: 750,
      categoria: 'ACCESORIOS',
      proveedor: 'TVC',
      codigo: 'TVN0830052',
    },
    {
      id: '31',
      nombre: 'Switch PoE 6 puertos Fast Ethernet 36W',
      precio: 1200,
      categoria: 'ACCESORIOS',
      proveedor: 'TVC',
      codigo: 'DAHUA PFS3006-4ET-36',
    },
    {
      id: '32',
      nombre: 'Cable UTP Cat5E 100% cobre 305mts',
      precio: 3500,
      categoria: 'ACCESORIOS',
      proveedor: 'TVC',
      codigo: 'TVD119047',
    },
    {
      id: '33',
      nombre: 'UPS 1500VA 900W Línea Interactiva AVR',
      precio: 3670,
      categoria: 'ACCESORIOS',
      proveedor: 'TVC',
      codigo: 'DAHUA DH-PFM350-900',
    },

    // CONTROL DE ACCESO
    {
      id: '34',
      nombre: 'Barrera Vehicular Izquierda Led Servo Motor',
      precio: 28630,
      categoria: 'CONTROL DE ACCESO',
      proveedor: 'TVC',
      codigo: 'TVB348020',
    },
    {
      id: '35',
      nombre: 'Terminal Control Acceso Facial Proface X ZKTeco',
      precio: 24537,
      categoria: 'CONTROL DE ACCESO',
      proveedor: 'TVC',
      codigo: 'ZTA0610006',
    },
    {
      id: '36',
      nombre: 'Control Acceso 1 Puerta 1500 usuarios',
      precio: 3000,
      categoria: 'CONTROL DE ACCESO',
      proveedor: 'TVC',
      codigo: 'ZKT0680042',
    },

    // SERVICIOS
    {
      id: '37',
      nombre: 'Póliza Mensual Mantenimiento y Monitoreo',
      precio: 600,
      categoria: 'SERVICIOS',
      proveedor: 'N/A',
      codigo: 'POL-MES',
    },
    {
      id: '38',
      nombre: 'Póliza Trimestral Mantenimiento y Monitoreo',
      precio: 1800,
      categoria: 'SERVICIOS',
      proveedor: 'N/A',
      codigo: 'POL-TRIM',
    },
    {
      id: '39',
      nombre: 'Servicio de Instalación Alarma Cancún',
      precio: 2500,
      categoria: 'SERVICIOS',
      proveedor: 'N/A',
      codigo: 'INST-CANCUN',
    },
  ];
}