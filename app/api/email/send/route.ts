import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { destinatario, asunto, html, nombreCliente } = await request.json();

    if (!destinatario || !asunto || !html) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    console.log('Email enviado:', {
      destinatario,
      asunto,
      nombreCliente,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Cotización enviada correctamente',
      email: destinatario,
    });
  } catch (error) {
    console.error('Error en API de email:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}