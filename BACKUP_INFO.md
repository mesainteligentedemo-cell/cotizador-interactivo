# BACKUP_INFO — Cotizador Interactivo

## Fecha del respaldo
2026-07-14

## Versión estable respaldada
- **Tag:** `v1.0-production`
- **Rama de respaldo:** `backup-stable`
- **Rama de producción:** `main`
- **Último commit:** `e73b600` — "backup: stable version production"
- **Remoto:** `origin` → https://github.com/mesainteligentedemo-cell/cotizador-interactivo.git
- **URL live:** https://cotizador-interactivo.vercel.app

## Contenido incluido en este respaldo
- Cotizador interactivo completo (Next.js 15 + React 18 + TypeScript + Tailwind)
- Generación de PDF de cotización (jsPDF + html2canvas) con logo HIMAYA, texto justificado,
  interlineado dinámico y espaciado corregido
- Envío de cotización por correo (Resend, modo sandbox si no hay API key)
- Guardado de cotizaciones en Google Sheets (cuenta de servicio)
- **Nuevo:** integración con n8n (`lib/enviarAn8n.ts` + `n8n-workflow-cotizador.json`) para
  automatizar envío de cotización (correo + Sheets + Drive + notificación admin) vía webhook
- Documentación previa del proyecto: `README.md`, `DEPLOY.md`, `FEATURES.md`,
  `INSTRUCCIONES.md`, `SETUP.md`, `START_HERE.md`, `TESTING.md`
- 42 archivos trackeados en git · repo `.git` ~732 KB · working dir (sin `node_modules`/`.next`) ~1.5 MB

## Cómo restaurar si es necesario

### Opción A — Volver al tag exacto (versión inmutable)
```bash
git fetch origin --tags
git checkout v1.0-production
```

### Opción B — Restaurar main desde la rama de respaldo
```bash
git fetch origin
git checkout main
git reset --hard origin/backup-stable
git push origin main --force-with-lease
```

### Opción C — Clonar limpio desde cero
```bash
git clone https://github.com/mesainteligentedemo-cell/cotizador-interactivo.git
cd cotizador-interactivo
git checkout v1.0-production   # o backup-stable
npm install
```

## Credenciales requeridas (NO se muestran valores reales — ver `.env.example`)
Copiar `.env.example` a `.env.local` y completar:

| Variable | Uso |
|---|---|
| `RESEND_API_KEY` | Envío real de correo (Resend). Si se omite, funciona en modo sandbox. |
| `RESEND_FROM_EMAIL` | Remitente verificado en Resend. |
| `GOOGLE_SHEETS_CLIENT_EMAIL` | Cuenta de servicio de Google Cloud con acceso a Sheets API. |
| `GOOGLE_SHEETS_PRIVATE_KEY` | Private key de la cuenta de servicio (formato con `\n` literales). |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | ID del spreadsheet de destino (compartido como Editor con la cuenta de servicio). |
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | (Opcional) URL del webhook n8n; si se omite usa el default en `lib/enviarAn8n.ts`. |

Estas variables se configuran en **Vercel → Project Settings → Environment Variables**, nunca en el
repositorio ni en archivos versionados.

## Verificación post-backup
- [x] `git status` limpio tras commit
- [x] Push de `main` a `origin` exitoso
- [x] Rama `backup-stable` creada y pusheada a `origin`
- [x] Tag `v1.0-production` creado y pusheado a `origin`
- [x] Este archivo (`BACKUP_INFO.md`) documentado
