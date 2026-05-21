import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Disable body parsing — Stripe needs the raw body to verify the signature
export const config = { api: { bodyParser: false } }

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBody = await getRawBody(req)
  const sig = req.headers['stripe-signature']

  let event
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[FLZ] Webhook signature error:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Use service role key to bypass RLS
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // ── Payment succeeded → flip user to Pro ─────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.client_reference_id
    if (userId) {
      const { error } = await supabase.from('profiles').upsert({
        id:                    userId,
        is_pro:                true,
        stripe_customer_id:    session.customer,
        stripe_subscription_id: session.subscription,
        subscription_status:   'pro',
        updated_at:            new Date().toISOString(),
      })
      if (error) console.error('[FLZ] Profile upsert error:', error)
      else console.log('[FLZ] User upgraded to Pro:', userId)
    }
  }

  // ── Subscription cancelled → revert to free ───────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', subscription.customer)
      .single()

    if (profile) {
      await supabase.from('profiles').update({
        is_pro:              false,
        subscription_status: 'free',
        updated_at:          new Date().toISOString(),
      }).eq('id', profile.id)
      console.log('[FLZ] User reverted to free:', profile.id)
    }
  }

  res.json({ received: true })
}
