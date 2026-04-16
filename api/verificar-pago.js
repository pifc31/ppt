const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: 'Falta session_id' });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  try {
    // 1. Verificar que el pago fue exitoso
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Pago no completado' });
    }

    const email = session.customer_email || session.customer_details?.email;
    if (!email) return res.status(400).json({ error: 'Email no encontrado' });

    // 2. Crear o recuperar usuario en Supabase
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .single();

    if (!existingUser) {
      // Crear registro del usuario
      await supabase.from('usuarios').insert({
        email,
        stripe_session_id: session_id,
        stripe_payment_intent: session.payment_intent,
        monto_pagado: session.amount_total,
        moneda: session.currency,
        pagado_en: new Date().toISOString(),
        progreso: {},
      });
    }

    // 3. Enviar magic link al email
    const { error: authError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_URL}/app`,
      },
    });

    if (authError) throw authError;

    // 4. Responder éxito — el magic link llega al email
    res.status(200).json({ ok: true, email });

  } catch (err) {
    console.error('Error verificar-pago:', err);
    res.status(500).json({ error: err.message });
  }
};
