const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return res.status(503).json({ error: 'Online payment is not switched on yet - please use "reserve & talk first".' });
  }
  try {
    const stripe = Stripe(key);
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'vom-ministry-ai.vercel.app';
    const origin = proto + '://' + host;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: 29500,
          product_data: {
            name: 'Ministry AI Assessment - Founding-church rate',
            description: '45-min discovery call + AI-assisted plan (3-7 tools, hours saved) + 30-min review call. Money-back if we cannot find 5+ hours/week.'
          }
        }
      }],
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      success_url: origin + '/?paid=1',
      cancel_url: origin + '/#assessment'
    });
    return res.status(200).json({ url: session.url });
  } catch (e) {
    return res.status(500).json({ error: 'Could not start checkout - please try again or use "reserve & talk first".' });
  }
};
