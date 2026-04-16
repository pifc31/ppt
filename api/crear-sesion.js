module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const body = new URLSearchParams({
      'payment_method_types[]': 'card',
      'mode': 'payment',
      'line_items[0][price]': process.env.STRIPE_PRICE_ID,
      'line_items[0][quantity]': '1',
      'success_url': process.env.NEXT_PUBLIC_URL + '/gracias?session_id={CHECKOUT_SESSION_ID}',
      'cancel_url': process.env.NEXT_PUBLIC_URL + '/pagar?cancelado=true',
      'locale': 'es-419',
    }).toString();
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.STRIPE_SECRET_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });
    const data = await r.json();
    if (data.url) res.status(200).json({ url: data.url });
    else res.status(500).json({ error: data.error ? data.error.message : 'Error Stripe' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
