// ========================================== //
//           SUPABASE FUNCTION: SEND ORDER EMAIL//
// ========================================== //
// Envía un correo electrónico de confirmación al cliente tras realizar un pedido.
// Utiliza SMTP (Gmail) para el envío de correos.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

// ========================================== //
// CONFIGURACIÓN DE CREDENCIALES DE GMAIL     //
// ========================================== //

const GMAIL_USER = Deno.env.get('GMAIL_USER')
const GMAIL_PASS = Deno.env.get('GMAIL_PASS')

// ========================================== //
// SERVIDOR HTTP PARA LA EDGE FUNCTION        //
// ========================================== //

serve(async (req) => {
  try {
    // Extracción del registro del pedido desde el payload de Supabase Webhook
    const { record } = await req.json()
    const emailCliente = record.cliente_email_snapshot;

    // Si el pedido no tiene email, no se envía nada
    if (!emailCliente) return new Response("Sin email", { status: 200 });

    const client = new SmtpClient();
    
    // Conexión al servidor SMTP de Gmail usando el puerto 587 (TLS)
    await client.connect({
      hostname: "smtp.gmail.com",
      port: 587,
      username: GMAIL_USER!,
      password: GMAIL_PASS!,
    });

    // Construcción del cuerpo HTML del correo con estilos inline
    const htmlBody = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #D4AF37; border-radius: 15px;">
        <h1 style="color: #D4AF37;">Sartoria Pizza</h1>
        <p>¡Hola ${record.cliente_nombre_snapshot}!</p>
        <p>Tu pedido #${record.id} ha sido confirmado.</p>
        <p>Total: RD$${record.total}</p>
        <p>¡Gracias por tu compra!</p>
      </div>
    `;

    // Envío del correo electrónico
    await client.send({
      from: GMAIL_USER!,
      to: emailCliente,
      subject: `Confirmación Pedido #${record.id} - Sartoria Pizza`,
      content: htmlBody,
      html: htmlBody,
    });

    // Cierre de la conexión SMTP
    await client.close();
    return new Response(JSON.stringify({ ok: true }), { status: 200 });

  } catch (error) {
    console.error("DETALLE ERROR GMAIL:", error.message);
    return new Response(error.message, { status: 500 });
  }
})
