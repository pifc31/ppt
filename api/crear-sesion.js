module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL;
    const successUrl = baseUrl + '/gracias?session_id={CHECKOUT_SESSION_ID}';
    const cancelUrl = baseUrl + '/pagar?cancelado=true';

    const params = [
      'payment_method_types[]=card',
      'mode=payment',
      'line_items[0][price]=' + encodeURIComponent(process.env.STRIPE_PRICE_ID),
      'line_items[0][quantity]=1',
      'success_url=' + encodeURIComponent(successUrl),
      'cancel_url=' + encodeURIComponent(cancelUrl),
      'locale=es-419',
    ].join('&');

    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.STRIPE_SECRET_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    const data = await r.json();
    if (data.url) {
      res.status(200).json({ url: data.url });
    } else {
      console.error('Stripe error:', JSON.stringify(data));
      res.status(500).json({ error: data.error ? data.error.message : 'Error Stripe' });
    }
  } catch (err) {
    console.error('Catch error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
