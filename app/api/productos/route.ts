import { google } from 'googleapis';

const SHEET_ID = '1AgYaDF1d4mAJb5mzku-HetlKwRy-AvxS-JldlfgUgaY';

export async function GET() {
  try {
    const sheets = google.sheets('v4');

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1',
      auth: new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      }),
    });

    const rows = response.data.values || [];
    const productos = parseProductos(rows);

    return Response.json({ productos, success: true });
  } catch (error) {
    console.error('Error fetching Google Sheet:', error);
    return Response.json(
      { error: 'Error cargando productos', success: false },
      { status: 500 }
    );
  }
}

function parseProductos(rows: any[]) {
  const productos = [];
  let currentCategory = '';

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;

    const [nombre, precioStr, proveedor, codigo] = row;

    // Si la fila es una categoría (sin precio)
    if (!precioStr || isNaN(parseFloat(precioStr))) {
      if (nombre && nombre.trim()) {
        currentCategory = nombre.trim();
      }
      continue;
    }

    const precio = parseFloat(precioStr.toString().replace(/[^\d.]/g, ''));

    if (!isNaN(precio) && nombre && nombre.trim()) {
      productos.push({
        id: `${currentCategory}-${productos.length}`,
        nombre: nombre.trim(),
        precio,
        categoria: currentCategory || 'Otros',
        proveedor: proveedor?.trim() || 'N/A',
        codigo: codigo?.trim() || '',
      });
    }
  }

  return productos;
}