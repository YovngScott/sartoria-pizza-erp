import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

const GMAIL_USER = Deno.env.get('GMAIL_USER')
const GMAIL_PASS = Deno.env.get('GMAIL_PASS')

serve(async (req) => {
  try {
    const { record } = await req.json()
    const emailCliente = record.cliente_email_snapshot;

    if (!emailCliente) return new Response("Sin email", { status: 200 });

    const client = new SmtpClient();
    
    // Cambiamos a puerto 587 (más compatible con servidores en la nube)
    await client.connect({
      hostname: "smtp.gmail.com",
      port: 587,
      username: GMAIL_USER!,
      password: GMAIL_PASS!,
    });

    const htmlBody = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #D4AF37; border-radius: 15px;">
        <h1 style="color: #D4AF37;">Sartoria Pizza</h1>
        <p>¡Hola ${record.cliente_nombre_snapshot}!</p>
        <p>Tu pedido #${record.id} ha sido confirmado.</p>
        <p>Total: RD$${record.total}</p>
        <p>¡Gracias por tu compra!</p>
      </div>
    `;

    await client.send({
      from: GMAIL_USER!,
      to: emailCliente,
      subject: `Confirmación Pedido #${record.id} - Sartoria Pizza`,
      content: htmlBody,
      html: htmlBody,
    });

    await client.close();
    return new Response(JSON.stringify({ ok: true }), { status: 200 });

  } catch (error) {
    console.error("DETALLE ERROR GMAIL:", error.message);
    return new Response(error.message, { status: 500 });
  }
})
