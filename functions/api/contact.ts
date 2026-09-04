/// <reference types="@cloudflare/workers-types" />

interface Env {
  BOT_TOKEN: string;
  CHAT_ID: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LEN = { name: 120, email: 200, message: 5000 };

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { name?: unknown; email?: unknown; message?: unknown; company?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, MAX_LEN.name) : "";
  const email = typeof body.email === "string" ? body.email.trim().slice(0, MAX_LEN.email) : "";
  const message = typeof body.message === "string" ? body.message.trim().slice(0, MAX_LEN.message) : "";
  const honeypot = typeof body.company === "string" ? body.company.trim() : "";

  if (honeypot) {
    return Response.json({ ok: true });
  }

  if (!name || !email || !message || !EMAIL_RE.test(email)) {
    return Response.json({ ok: false, error: "validation" }, { status: 400 });
  }

  const text = `Nuevo contacto — Nitza Develop\n\nNombre: ${name}\nCorreo: ${email}\n\n${message}`;

  const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.CHAT_ID, text }),
  });

  if (!res.ok) {
    return Response.json({ ok: false, error: "send_failed" }, { status: 502 });
  }

  return Response.json({ ok: true });
};
