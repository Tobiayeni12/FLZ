import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { entries } = req.body
  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: 'No entries provided.' })
  }

  const summary = entries.map((e, i) => {
    const d = e.analysis?.dimensions ?? {}
    return `Entry ${i + 1} (${new Date(e.created_at).toLocaleDateString()}): "${e.input.slice(0, 80)}" — energy: ${d.energy}, emotion: ${d.emotion}, clarity: ${d.clarity}`
  }).join('\n')

  const prompt = `You are FLZ, a calm personal growth companion. Here are a user's entries from this week:\n\n${summary}\n\nWrite a warm, insightful weekly reflection (3–4 sentences) that:\n- Identifies the dominant emotional or energy theme of the week\n- Names one pattern or shift you notice\n- Ends with one specific, encouraging insight about what this week revealed\n- Uses soft language ("This week seems to...", "There's a thread of...", "You appear to...")\n- Feels like a thoughtful letter, not a report\n\nReturn only the plain text. No headers, no bullets.`

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 350,
      messages: [{ role: 'user', content: prompt }],
    })
    res.json({ summary: message.content[0].text.trim() })
  } catch (err) {
    console.error('[FLZ] Weekly summary error:', err)
    res.status(500).json({ error: 'Could not generate weekly summary.' })
  }
}
