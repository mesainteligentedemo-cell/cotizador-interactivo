import { CartItem, DatosCliente, MetodoPago, Proyecto } from './types';
import { generarPDFBlob } from './generarPDF';

// URL del webhook de n8n. Se puede sobreescribir con NEXT_PUBLIC_N8N_WEBHOOK_URL en Vercel.
const N8N_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ||
  'https://n8n.srv1013903.hstgr.cloud/webhook/cotizador';

export interface EnviarAn8nResult {
  success: boolean;
  cotizacionId?: string;
  emailSent?: boolean;
  sheetsUpdated?: boolean;
  driveSaved?: boolean;
  adminNotified?: boolean;
  pdfAdjuntado?: boolean;
  timestamp?: string;
  error?: string;
}

// Convierte un Blob a base64 puro (sin el prefijo "data:application/pdf;base64,").
function blobABase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Automatización total vía n8n: genera el PDF en el navegador, lo convierte a base64
 * y lo envía (junto con todos los datos de la cotización) al webhook de n8n.
 * n8n se encarga de: enviar el correo al cliente CON el PDF adjunto (Resend),
 * guardar en Google Sheets, archivar el PDF en Google Drive y notificar internamente.
 * Todo manos libres — no depende de mailto ni de arrastrar el PDF a mano.
 */
export async function enviarAn8n(
  cart: CartItem[],
  cliente: DatosCliente,
  proyecto: Proyecto,
  metodoPago: MetodoPago,
  moneda: 'USD' | 'MXN',
  tipoCambio: number,
  ocultarDescuento: boolean,
  subtotal: number,
  iva: number,
  total: number
): Promise<EnviarAn8nResult> {
  // 1. Generar el mismo PDF (4-5 páginas) que ya produce la app, en memoria.
  const { blob, nombreArchivo } = await generarPDFBlob(
    cart,
    cliente,
    proyecto,
    metodoPago,
    moneda,
    ocultarDescuento,
    subtotal,
    iva,
    total
  );
  const pdfBase64 = await blobABase64(blob);

  // 2. Enviar TODO al webhook de n8n.
  const response = await fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cliente,
      proyecto,
      cart,
      moneda,
      tipoCambio,
      metodoPago,
      subtotal,
      iva,
      total,
      pdfBase64,
      nombreArchivo,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as EnviarAn8nResult;

  if (!response.ok || data.success === false) {
    throw new Error(data.error || `n8n respondió con estado ${response.status}`);
  }

  return data;
}