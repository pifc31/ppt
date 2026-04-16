const Stripe = require('stripe');

  module.exports = async (req, res) => {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
            try {
                const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                        mode: 'payment',
                  line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
                  success_url: `${process.env.NEXT_PUBLIC_URL}/gracias?session_id={CHECKOUT_SESSION_ID}`,
                  cancel_url: `${process.env.NEXT_PUBLIC_URL}/pagar?cancelado=true`,
                        locale: 'es-419',
                  });
                  res.status(200).json({ url: session.url });
                  } catch (err) {
                    res.status(500).json({ error: err.message });
                  }
                };
