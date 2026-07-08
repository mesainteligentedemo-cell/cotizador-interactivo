# Guía Completa: Testing Local → Vercel Deploy

## 🚀 PASO 1: Setup Local (15-20 minutos)

### 1.1 Verificar Node.js
```powershell
node --version  # Debe ser v18+
npm --version   # Debe ser 8+
```

### 1.2 Instalar Dependencias
```powershell
cd C:\Users\inbou\cotizador-interactivo
npm install
```

**Salida esperada:**
```
added 150 packages in 45s
```

### 1.3 Ejecutar en Desarrollo
```powershell
npm run dev
```

**Salida esperada:**
```
> next dev

  ▲ Next.js 15.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.5s
```

---

## 🧪 PASO 2: Testing Manual (30-45 minutos)

**Abre:** http://localhost:3000

### Checklist de Testing

#### Test 1: Interfaz Básica
- [ ] Encabezado visible (azul)
- [ ] Filtros visibles
- [ ] Lista de productos visible
- [ ] Carrito visible a la derecha (desktop)
- [ ] Sin errores en consola (F12)

#### Test 2: Filtros y Búsqueda
- [ ] Ingresa "alarma" en búsqueda → filtra productos
- [ ] Haz clic en "ALARMAS" → muestra solo esa categoría
- [ ] Haz clic en "TODOS" → restaura vista completa
- [ ] Busca por código "PRO4G" → encuentra el producto

#### Test 3: Carrito Básico
1. Haz clic en "Agregar" de **3 productos diferentes**
2. Verifica que aparezcan en el carrito
3. Verifica que el subtotal sea correcto:
   - Ej: $5,900 + $8,300 + $2,800 = $17,000

#### Test 4: Cálculos de IVA
- [ ] Subtotal: $17,000
- [ ] IVA (16%): Debe ser $2,720
  - Cálculo: 17,000 × 0.16 = 2,720 ✓
- [ ] Total: Debe ser $19,720
  - Cálculo: 17,000 + 2,720 = 19,720 ✓

#### Test 5: Edición de Cantidades
- [ ] Haz clic en "+" para aumentar cantidad → total sube
- [ ] Haz clic en "-" para disminuir → total baja
- [ ] Escribe cantidad directamente → total se actualiza

#### Test 6: Eliminar Productos
- [ ] Haz clic en la "×" de un producto
- [ ] Producto desaparece del carrito
- [ ] Total se recalcula automáticamente

#### Test 7: Datos del Cliente
1. Haz clic en "Mostrar Datos del Cliente"
2. Cambia:
   - Nombre: "MI EMPRESA LTDA"
   - Correo: "test@example.com"
   - Teléfono: "+52 555 123 4567"
3. Verifica que los datos se actualicen

#### Test 8: Descargar PDF ✅ CRÍTICO
1. Agrega 5 productos al carrito
2. Haz clic en "📥 Descargar PDF"
3. **Debe abrir un PDF con:**
   - Encabezado "COTIZADOR"
   - Datos del cliente
   - Tabla de productos
   - Subtotal, IVA, Total correctos
   - Nombre de archivo: `Cotizacion_[NOMBRE]_[FECHA].pdf`

#### Test 9: Enviar por Correo (Mock)
1. Ingresa correo válido
2. Haz clic en "✉️ Enviar por Correo"
3. Debe mostrar mensaje "Cotización enviada correctamente"
4. Verifica consola (F12) → no debe haber errores
   - Log: `Email enviado: {...}`

#### Test 10: Responsividad
**En DevTools (F12):**

Móvil (375px):
- [ ] Filtros se ven bien
- [ ] Productos en 1 columna
- [ ] Carrito debajo

Tablet (768px):
- [ ] Productos en 2 columnas
- [ ] Carrito a la derecha

Desktop (1920px):
- [ ] Productos en 2 columnas (derecha)
- [ ] Carrito sticky a la derecha
- [ ] Layout perfecto

### Resultados Esperados

| Test | Status | Detalle |
|------|--------|---------|
| Carga | ✅ | Sin errores |
| Filtros | ✅ | Filtra correctamente |
| Búsqueda | ✅ | Encuentra por nombre/código |
| IVA 16% | ✅ | Cálculo exacto |
| PDF | ✅ | Se descarga correctamente |
| Email | ✅ | Mock funciona |
| Responsive | ✅ | Se ve bien en todos los tamaños |

---

## 🔧 PASO 3: Solución de Problemas

### Error: "Port 3000 already in use"
```powershell
npm run dev -- -p 3001
# Luego abre: http://localhost:3001
```

### Error: "Module not found"
```powershell
rm -Force node_modules -Recurse
npm install
npm run dev
```

### PDF no se descarga
- Abre DevTools (F12) → Console
- Verifica que no haya errores rojo
- Intenta en otro navegador (Chrome, Firefox)

### Estilos Tailwind no se aplican
```powershell
npm run build
# Espera a que termine
npm run dev
```

---

## 📤 PASO 4: Deploy a Vercel (10-15 minutos)

### 4.1 Subir a GitHub

```powershell
# Crear repositorio (si no existe)
git init
git add .
git commit -m "feat: Cotizador interactivo v1.0

- Carga de 39 productos de alarmas/videovigilancia
- Filtros por categoría y búsqueda
- Carrito con cálculo automático de IVA 16%
- Descarga en PDF profesional
- Envío por correo (API integrado)"

# Subir a GitHub
git remote add origin https://github.com/[TU_USUARIO]/cotizador.git
git branch -M main
git push -u origin main
```

### 4.2 Crear Cuenta en Vercel
- Ir a: https://vercel.com
- Sign up con GitHub
- Autorizar Vercel

### 4.3 Importar Proyecto a Vercel

**Opción A: Desde Vercel Dashboard**
1. Click en "New Project"
2. Seleccionar repo "cotizador"
3. Click "Deploy"
4. Esperar 2-3 minutos

**Opción B: Con Vercel CLI**
```powershell
npm install -g vercel
vercel
# Seguir las instrucciones
```

### 4.4 Configurar Variables de Entorno (Opcional)

En Vercel → Settings → Environment Variables:

```
NEXT_PUBLIC_SITE_URL=https://cotizador-[tu-nombre].vercel.app
```

---

## ✅ PASO 5: Testing en Vercel (5-10 minutos)

Una vez que Vercel termina el deploy (aparece ✓ Deployed):

1. **Abre la URL generada**
   - Ejemplo: `https://cotizador-pablo.vercel.app`

2. **Repite los Tests Críticos:**
   - [ ] Carga de productos
   - [ ] Filtros funcionan
   - [ ] Agregar al carrito
   - [ ] **Descargar PDF** (CRÍTICO)
   - [ ] Cálculos correctos
   - [ ] Sin errores en consola

3. **Verifica Performance**
   - Abre DevTools (F12) → Lighthouse
   - Score debe ser 85+

---

## 🎉 PASO 6: Compartir URL

**Cotizador está listo en:**
```
https://cotizador-[tu-nombre].vercel.app
```

### Compartir con Clientes
```
Tu equipo está usando este cotizador para:
✅ Ahorrar tiempo (2 min vs 20 min manual)
✅ Generar PDFs profesionales
✅ Enviar presupuestos por email
✅ Sin errores en cálculos

👉 Prueba aquí: [URL]
```

---

## 📊 Monitoreo Post-Deploy

### Analytics
En Vercel → Analytics:
- [ ] Verificar que no haya 404s
- [ ] Verificar response times < 200ms
- [ ] Verificar visitors count

### Logs
En Vercel → Logs:
- [ ] No debe haber errores 500
- [ ] Los requests a /api/email/send deben ser 200

---

## 🔄 Actualizaciones Futuras

Para hacer cambios después de deploy:

```powershell
# 1. Editar código localmente
# 2. Probar en desarrollo (npm run dev)
# 3. Verificar con npm run build

git add .
git commit -m "fix: Descripción del cambio"
git push origin main

# ✓ Vercel redeploy automático (2-3 minutos)
```

---

## 📋 Checklist Final

### Antes de ir a producción:

- [ ] Testing local completo (todos los tests pasan)
- [ ] PDF se descarga correctamente
- [ ] Cálculos de IVA son exactos
- [ ] Responsividad en mobile/tablet/desktop
- [ ] Sin errores en consola (F12)
- [ ] Build local sin errores: `npm run build`
- [ ] Código subido a GitHub
- [ ] Deploy en Vercel completado
- [ ] Testing en URL live completado
- [ ] Lighthouse score 85+
- [ ] URL compartida con equipo

---

## 🆘 Soporte Rápido

| Problema | Solución |
|----------|----------|
| Página en blanco | Verificar F12 → Console |
| 404 en /api/email | API está en construcción |
| PDF no descarga | Intentar en Chrome |
| Lento en cargar | Revisar conexión internet |
| Botones no funcionan | Limpiar caché: Ctrl+Shift+Del |

---

**Tiempo Total Estimado:**
- Setup + Testing Local: 60 minutos
- Deploy a Vercel: 10 minutos
- **Total: 70 minutos**

**Siguiente:** Integración con servicio de email real (Resend, SendGrid)