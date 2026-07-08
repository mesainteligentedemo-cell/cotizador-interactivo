import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { CartItem, DatosCliente, MetodoPago, Proyecto } from '@/lib/types';

interface GuardarCotizacionBody {
  fecha?: string;
  cliente: DatosCliente;
  proyecto: Proyecto;
  cart: CartItem[];
  moneda: 'USD' | 'MXN';
  metodoPago: MetodoPago;
  subtotal: number;
  iva: number;
  total: number;
}

const SHEET_NAME = 'Cotizaciones';
// Fecha, Cliente, Empresa, RFC, Email, Teléfono, Productos (JSON), Subtotal, IVA, Total, Moneda, Método Pago, Notas, ID
const HEADER_ROW = [
  'Fecha',
  'Cliente',
  'Empresa',
  'RFC',
  'Email',
  'Teléfono',
  'Productos (JSON)',
  'Subtotal',
  'IVA',
  'Total',
  'Moneda',
  'Método Pago',
  'Notas',
  'ID Cotización',
];

export async function POST(request: NextRequest) {
  try {
    const body: GuardarCotizacionBody = await request.json();
    const { fecha, cliente, proyecto, cart, moneda, metodoPago, subtotal, iva, total } = body;

    if (!cliente || !cart || total === undefined || total === null) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos para guardar la cotización (cliente, cart, total)' },
        { status: 400 }
      );
    }

    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const privateKeyRaw = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!clientEmail || !privateKeyRaw || !spreadsheetId) {
      console.error(
        '[sheets/guardar-cotizacion] Faltan variables de entorno: GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY o GOOGLE_SHEETS_SPREADSHEET_ID'
      );
      return NextResponse.json(
        {
          success: false,
          error:
            'Google Sheets no está configurado. Define GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY y GOOGLE_SHEETS_SPREADSHEET_ID en las variables de entorno (comparte el Sheet con ese correo de servicio como Editor).',
        },
        { status: 501 }
      );
    }

    // En Vercel los saltos de línea de la private key llegan escapados como "\n" literal.
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Aseguramos que exista la hoja "Cotizaciones"; si no existe, la creamos con encabezado.
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId });
      const existe = meta.data.sheets?.some(
        (s) => s.properties?.title === SHEET_NAME
      );

      if (!existe) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{ addSheet: { properties: { title: SHEET_NAME } } }],
          },
        });
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${SHEET_NAME}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [HEADER_ROW] },
        });
      }
    } catch (metaError) {
      console.error('[sheets/guardar-cotizacion] Error verificando/creando la hoja:', metaError);
      return NextResponse.json(
        {
          success: false,
          error: `No se pudo acceder al Google Sheet. Verifica que GOOGLE_SHEETS_SPREADSHEET_ID sea correcto y que el Sheet esté compartido con ${clientEmail} como Editor.`,
        },
        { status: 502 }
      );
    }

    const cotizacionId = `COT-${Date.now()}`;
    const fechaISO = fecha || new Date().toISOString();
    const notas = proyecto?.descripcion || proyecto?.titulo || '';

    const row = [
      fechaISO,
      cliente.nombreCompleto || '',
      cliente.empresa || '',
      cliente.rfc || '',
      Array.isArray(cliente.correos) ? cliente.correos.join(', ') : '',
      cliente.telefono || '',
      JSON.stringify(cart),
      subtotal ?? 0,
      iva ?? 0,
      total ?? 0,
      moneda || '',
      metodoPago || '',
      notas,
      cotizacionId,
    ];

    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${SHEET_NAME}!A:N`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
      });
    } catch (appendError) {
      console.error('[sheets/guardar-cotizacion] Error escribiendo en Google Sheets:', appendError);
      const mensaje = appendError instanceof Error ? appendError.message : 'error desconocido';
      return NextResponse.json(
        { success: false, error: `Error al escribir en Google Sheets: ${mensaje}` },
        { status: 502 }
      );
    }

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    return NextResponse.json({ success: true, sheetUrl, cotizacionId });
  } catch (error) {
    console.error('[sheets/guardar-cotizacion] Error en API de Sheets:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al procesar la solicitud',
      },
      { status: 500 }
    );
  }
}