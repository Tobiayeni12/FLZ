import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { entries } = req.body
  if (!Array.isArray(entries) || entries.length < 3) {
    return res.status(400).json({ error: 'Need at least 3 entries for a pattern.' })
  }

  const summary = entries.slice(0, 14).map((e, i) => {
    const d = e.analysis?.dimensions ?? {}
    return `Entry ${i + 1} (${new Date(e.created_at).toLocaleDateString()}): "${e.input.slice(0, 80)}" — energy: ${d.energy}, emotion: ${d.emotion}, clarity: ${d.clarity}, direction: ${d.direction}`
  }).join('\n')

  const prompt = `You are FLZ, a calm personal growth companion. A user has shared ${entries.length} journal entries with you. Here they are, from most recent to oldest:\n\n${summary}\n\nWrite a short, warm, insightful pattern summary (3–5 sentences) that:\n- Notices recurring themes, emotional patterns, or energy trends\n- Uses soft interpretive language ("This may suggest...", "There seems to be a thread of...", "You appear to...")\n- Ends with one gentle, forward-looking observation\n- Feels like a thoughtful mirror, not a diagnosis\n- Is written in second person, directly to the user\n\nReturn only the plain text summary. No JSON, no headers, no bullet points.`

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })
    res.json({ summary: message.content[0].text.trim() })
  } catch (err) {
    console.error('Pattern error:', err)
    res.status(500).json({ error: 'Could not generate pattern summary.' })
  }
}
