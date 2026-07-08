# Guía de Testing - Cotizador Interactivo

## Testing Local (Antes de Deploy)

### 1. Setup Inicial
```bash
# Instalar dependencias
npm install

# Ejecutar servidor
npm run dev
```

### 2. Pruebas Manuales en el Navegador

#### Test 1: Carga de Productos
- [ ] Abre http://localhost:3000
- [ ] Verifica que se carguen al menos 10 productos
- [ ] Verifica que cada producto tenga: nombre, precio, categoría

#### Test 2: Filtros y Búsqueda
- [ ] Haz clic en "ALARMAS" y verifica que solo muestre productos de esa categoría
- [ ] Escribe "alarma" en búsqueda y verifica filtrado
- [ ] Busca por código de producto (ej: "PRO4G")
- [ ] Haz clic en "Todos" para resetear filtros

#### Test 3: Agregar al Carrito
- [ ] Haz clic en "Agregar" de 3 productos diferentes
- [ ] Verifica que se actualice el contador en el resumen
- [ ] Verifica que el subtotal se calcule correctamente
- [ ] Verifica que el IVA (16%) se calcule correctamente

#### Test 4: Editar Cantidades
- [ ] Haz clic en el botón "+" para aumentar cantidad
- [ ] Haz clic en el botón "-" para disminuir cantidad
- [ ] Escribe una cantidad directamente en el input
- [ ] Verifica que los totales se actualicen

#### Test 5: Eliminar Productos
- [ ] Haz clic en la "×" al lado de un producto
- [ ] Verifica que desaparezca del carrito
- [ ] Verifica que el total se actualice

#### Test 6: Datos del Cliente
- [ ] Haz clic en "Mostrar Datos del Cliente"
- [ ] Edita el nombre (cambiar de "TALLER BONAMPACK..." a tu nombre)
- [ ] Edita empresa, correo y teléfono
- [ ] Verifica que los campos se actualicen

#### Test 7: Descargar PDF
- [ ] Agrega 5 productos al carrito
- [ ] Haz clic en "📥 Descargar PDF"
- [ ] Verifica que se descargue un archivo PDF
- [ ] Abre el PDF en tu visor predeterminado
- [ ] Verifica el contenido:
  - [ ] Encabezado "COTIZADOR"
  - [ ] Datos del cliente
  - [ ] Tabla con productos
  - [ ] Subtotal, IVA y Total
  - [ ] Formato profesional

#### Test 8: Enviar por Correo (Simulado en Local)
- [ ] Ingresa un correo válido en el formulario de datos
- [ ] Haz clic en "✉️ Enviar por Correo"
- [ ] Verifica que aparezca un mensaje de confirmación
- [ ] En consola (F12), verifica que no haya errores

#### Test 9: Limpiar Carrito
- [ ] Haz clic en "Limpiar Carrito"
- [ ] Verifica que desaparezcan todos los productos
- [ ] Verifica que el resumen esté vacío

#### Test 10: Responsividad
- [ ] Abre DevTools (F12) y cambia a vista móvil (375px)
- [ ] Verifica que los filtros se vean bien
- [ ] Verifica que el carrito sea accesible
- [ ] Prueba en tablets (768px)
- [ ] Prueba en desktop (1920px)

### 3. Pruebas de Rendimiento

```bash
# Construir para producción
npm run build

# Ver tamaño de bundle
npm run build

# Análisis de rendimiento
npx lighthouse http://localhost:3000
```

### 4. Pruebas de Funcionalidad

#### Calculadora de Precios
```javascript
// Probamos manualmente en consola:
subtotal = 5900 + 8300 + 2800 = 17000
iva = 17000 * 0.16 = 2720
total = 17000 + 2720 = 19720
```

#### Validación de Email
- Email válido: test@example.com ✓
- Email inválido: test@localhost ✗

### 5. Checklist Final

Antes de hacer push a Vercel:

- [ ] Todos los tests manuales pasaron
- [ ] No hay errores en consola (F12)
- [ ] PDF se descarga correctamente
- [ ] Los cálculos de IVA son correctos (siempre 16%)
- [ ] Funciona en Chrome, Firefox y Safari
- [ ] Funciona en mobile, tablet y desktop
- [ ] Las imágenes cargan sin errores
- [ ] Los estilos Tailwind se aplican correctamente
- [ ] No hay warnings en la consola

## Problemas Comunes y Soluciones

### Problema: "Module not found"
**Solución:** Ejecuta `npm install` nuevamente

### Problema: Puerto 3000 ya está en uso
**Solución:** 
```bash
# Cambiar puerto
npm run dev -- -p 3001
```

### Problema: PDF no se descarga
**Solución:** 
- Verifica que tengas permisos de escritura
- Intenta en otro navegador
- Abre DevTools y revisa errores

### Problema: Estilos no se aplican (Tailwind)
**Solución:**
```bash
# Reconstruir Tailwind
npm run build

# O en desarrollo, espera a que se recargue automáticamente
```

## Variables de Entorno (Para Integración Real)

Para enviar correos reales en Vercel, necesitarás:

```env
# .env.local (nunca commitar)
NEXT_PUBLIC_RESEND_API_KEY=tu_key_aqui
EMAIL_FROM=cotizador@tuemail.com
```

## Deploy a Vercel

Una vez que todos los tests pasen:

```bash
# 1. Crear repositorio git (si no existe)
git init
git add .
git commit -m "feat: Cotizador interactivo v1.0"

# 2. Subir a GitHub
git remote add origin https://github.com/tuuser/cotizador.git
git push -u origin main

# 3. En Vercel
# - Importar desde GitHub
# - Setear variables de entorno
# - Deploy

# O usar Vercel CLI:
npm i -g vercel
vercel
```

---

**Tiempo estimado de testing:** 30-45 minutos  
**Tiempo estimado de deploy:** 10-15 minutos