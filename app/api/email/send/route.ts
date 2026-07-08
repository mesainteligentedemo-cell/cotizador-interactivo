import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const { destinatario, asunto, html, nombreCliente } = await request.json();

    if (!destinatario || !asunto || !html) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos (destinatario, asunto, html)' },
        { status: 400 }
      );
    }

    const destinatarios = String(destinatario)
      .split(',')
      .map((email: string) => email.trim())
      .filter(Boolean);

    if (destinatarios.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó ningún correo de destino válido' },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;

    // Modo sandbox: si no hay API key configurada, simulamos el envío
    // para no romper el flujo en desarrollo local o antes de configurar Vercel.
    if (!apiKey) {
      console.warn(
        '[email/send] RESEND_API_KEY no configurada — enviando en modo sandbox (simulado)'
      );
      console.log('[email/send] Email simulado:', {
        destinatarios,
        asunto,
        nombreCliente,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        sandbox: true,
        message:
          'Modo de prueba: RESEND_API_KEY no está configurada, el correo no se envió realmente.',
        email: destinatarios,
      });
    }

    const remitente = process.env.RESEND_FROM_EMAIL || 'Cotizador <onboarding@resend.dev>';
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: remitente,
      to: destinatarios,
      subject: asunto,
      html,
    });

    if (error) {
      console.error('[email/send] Error de Resend:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Error al enviar el correo con Resend' },
        { status: 400 }
      );
    }

    console.log('[email/send] Email enviado correctamente:', {
      id: data?.id,
      destinatarios,
      asunto,
      nombreCliente,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Cotización enviada correctamente',
      email: destinatarios,
      id: data?.id,
    });
  } catch (error) {
    console.error('[email/send] Error en API de email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al procesar la solicitud',
      },
      { status: 500 }
    );
  }
}