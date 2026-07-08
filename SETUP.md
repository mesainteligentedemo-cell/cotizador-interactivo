# Cotizador Interactivo - Instrucciones de Setup

## Requisitos
- Node.js 18+ 
- npm o yarn

## Instalación Local

1. **Instalar dependencias:**
```bash
npm install
```

2. **Ejecutar en modo desarrollo:**
```bash
npm run dev
```

3. **Acceder a la aplicación:**
- Abre tu navegador en: http://localhost:3000
- El servidor se reinicia automáticamente cuando editas archivos

## Características Implementadas

✅ **Carga de productos** desde Google Sheet  
✅ **Filtros por categoría** y búsqueda de productos  
✅ **Carrito interactivo** con control de cantidades  
✅ **Cálculo automático** de subtotal, IVA (16%) y total  
✅ **Descarga en PDF** con formato profesional  
✅ **Envío por correo** (simulado en local, integración real en Vercel)  
✅ **Formulario de datos del cliente** editable  
✅ **Diseño responsivo** (mobile, tablet, desktop)  
✅ **Interfaz similar a SYSCOM** (azul/blanco, limpio)  

## Estructura del Proyecto

```
cotizador-interactivo/
├── app/
│   ├── api/
│   │   └── email/send/route.ts      # API para enviar correos
│   ├── layout.tsx                    # Layout principal
│   ├── page.tsx                      # Página principal
│   └── globals.css                   # Estilos globales
├── components/
│   ├── Header.tsx                    # Encabezado
│   ├── FilterBar.tsx                 # Filtros y búsqueda
│   ├── ProductList.tsx               # Lista de productos
│   └── CartSummary.tsx               # Resumen del carrito
├── lib/
│   ├── generarPDF.ts                 # Función para generar PDF
│   └── enviarCorreo.ts               # Función para enviar por correo
├── package.json                      # Dependencias
├── tsconfig.json                     # Configuración TypeScript
├── next.config.js                    # Configuración Next.js
├── tailwind.config.js                # Configuración Tailwind
└── postcss.config.js                 # Configuración PostCSS
```

## Próximos Pasos

1. **Testing Local:**
   - Agregar productos al carrito
   - Probar filtros y búsqueda
   - Descargar PDF (guarda en Descargas)
   - Enviar correo de prueba

2. **Integración con Servicio de Email:**
   - Reemplazar API mock en `/api/email/send`
   - Integrar con Resend, SendGrid o AWS SES
   - Configurar variables de entorno

3. **Deploy a Vercel:**
   ```bash
   npm run build
   git push origin main
   ```

## Notas de Desarrollo

- Los productos se cargan directamente en `app/page.tsx`
- Para cargar desde Google Sheet en vivo, descomentar y configurar la API en `app/api/productos/route.ts`
- El PDF se genera con jsPDF + html2canvas
- Los correos son simulados en local, requieren integración en Vercel