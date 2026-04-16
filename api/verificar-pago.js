const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function supabase(path, method, body) {
    const r = await fetch(SUPABASE_URL + '/rest/v1' + path, {
          method: method || 'GET',
          headers: {
                  'apikey': SUPABASE_SERVICE_KEY,
                  'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=representation',
          },
          body: body ? JSON.stringify(body) : undefined,
    });
    return r.json();
}

module.exports = async (req, res) => {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ error: 'Falta session_id' });
  
    try {
          // Verificar pago en Stripe
          const sr = await fetch('https://api.stripe.com/v1/checkout/sessions/' + session_id, {
                  headers: { 'Authorization': 'Bearer ' + process.env.STRIPE_SECRET_KEY },
          });
          const session = await sr.json();
      
          if (session.payment_status !== 'paid') return res.status(400).json({ error: 'Pago no completado' });
      
          const email = session.customer_email || (session.customer_details && session.customer_details.email);
          if (!email) return res.status(400).json({ error: 'Email no encontrado' });
      
          // Crear usuario en Supabase si no existe
          const existing = await supabase('/usuarios?email=eq.' + encodeURIComponent(email) + '&select=id', 'GET');
          if (!existing || existing.length === 0) {
                  await supabase('/usuarios', 'POST', {
                            email,
                            stripe_session_id: session_id,
                            stripe_payment_intent: session.payment_intent,
                            monto_pagado: session.amount_total,
                            moneda: session.currency,
                            pagado_en: new Date().toISOString(),
                            progreso: {},
                  });
          }
      
          // Enviar magic link via Supabase Auth
          await fetch(SUPABASE_URL + '/auth/v1/magiclink', {
                  method: 'POST',
                  headers: {
                            'apikey': SUPABASE_SERVICE_KEY,
                            'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
                            'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                            email,
                            create_user: true,
                            redirectTo: 'https://app.perpetua.today/app',
                  }),
          });
      
          res.status(200).json({ ok: true, email });
    } catch (err) {
          res.status(500).json({ error: err.message });
    }
};onst SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function supabase(path, method, body) {
  const r = await fetch(SUPABASE_URL + '/rest/v1' + path, {
    method: method || 'GET',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: 'Falta session_id' });

  try {
    // Verificar pago en Stripe
    const sr = await fetch('https://api.stripe.com/v1/checkout/sessions/' + session_id, {
      headers: { 'Authorization': 'Bearer ' + process.env.STRIPE_SECRET_KEY },
    });
    const session = await sr.json();
    if (session.payment_status !== 'paid') return res.status(400).json({ error: 'Pago no completado' });

    const email = session.customer_email || (session.customer_details && session.customer_details.email);
    if (!email) return res.status(400).json({ error: 'Email no encontrado' });

    // Crear usuario en Supabase si no existe
    const existing = await supabase('/usuarios?email=eq.' + encodeURIComponent(email) + '&select=id', 'GET');
    if (!existing || existing.length === 0) {
      await supabase('/usuarios', 'POST', {
        email,
        stripe_session_id: session_id,
        stripe_payment_intent: session.payment_intent,
        monto_pagado: session.amount_total,
        moneda: session.currency,
        pagado_en: new Date().toISOString(),
        progreso: {},
      });
    }

    // Enviar magic link via Supabase Auth
    await fetch(SUPABASE_URL + '/auth/v1/magiclink', {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        options: { redirectTo: process.env.NEXT_PUBLIC_URL + '/app' },
      }),
    });

    res.status(200).json({ ok: true, email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
