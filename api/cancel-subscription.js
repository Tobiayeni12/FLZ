import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'userId is required.' })

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Look up the Stripe subscription ID for this user
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('id', userId)
    .single()

  if (profileError || !profile?.stripe_subscription_id) {
    return res.status(404).json({ error: 'No active subscription found.' })
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    // Cancel at period end — user keeps Pro access until billing cycle ends
    const subscription = await stripe.subscriptions.update(
      profile.stripe_subscription_id,
      { cancel_at_period_end: true }
    )

    // Mark as cancelling in Supabase so we can show the date in the UI
    await supabase.from('profiles').update({
      subscription_status: 'cancelling',
      updated_at:          new Date().toISOString(),
    }).eq('id', userId)

    const periodEnd = new Date(subscription.current_period_end * 1000).toISOString()
    console.log('[FLZ] Subscription set to cancel at period end for user:', userId, periodEnd)
    res.json({ cancelled: true, periodEnd })
  } catch (err) {
    console.error('[FLZ] Cancel subscription error:', err)
    res.status(500).json({ error: 'Could not cancel subscription. Please try again.' })
  }
}
