import Stripe from 'stripe'

const PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  yearly:  process.env.STRIPE_PRICE_YEARLY,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { plan, userId, userEmail, origin } = req.body

  if (!PRICES[plan]) {
    return res.status(400).json({ error: 'Invalid plan.' })
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PRICES[plan], quantity: 1 }],
      success_url: `${origin}/?upgraded=true`,
      cancel_url:  `${origin}/`,
      customer_email: userEmail,
      client_reference_id: userId,
      metadata: { userId },
    })
    res.json({ url: session.url })
  } catch (err) {
    console.error('[FLZ] Stripe checkout error:', err)
    res.status(500).json({ error: 'Could not start checkout. Please try again.' })
  }
}
