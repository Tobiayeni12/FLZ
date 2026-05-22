import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { entries } = req.body
  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: 'No entries provided.' })
  }

  const lines = entries.map((e, i) => {
    const d = e.analysis?.dimensions ?? {}
    return `Entry ${i + 1} (${new Date(e.created_at).toLocaleDateString()}): "${e.input.slice(0, 100)}" — energy: ${d.energy}, emotion: ${d.emotion}, clarity: ${d.clarity}, growth opportunity: ${d.growthOpportunity}`
  }).join('\n')

  const prompt = `You are FLZ, a thoughtful personal growth companion. A user has completed ${entries.length} reflections this month. Here they are:\n\n${lines}\n\nWrite a warm, honest monthly deep dive (5–7 sentences) that:\n- Opens with the dominant theme or arc of the month\n- Identifies 1–2 specific growth patterns or shifts across the entries\n- Notes any tension or contrast between different entries\n- Ends with a clear, specific observation about what this month revealed about this person\n- Uses soft, interpretive language ("This month seems to...", "A thread running through...", "What stands out is...")\n- Reads like a thoughtful letter from someone who knows them well\n\nReturn only the plain text. No headers, no bullets, no sign-off.`

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })
    res.json({ summary: message.content[0].text.trim() })
  } catch (err) {
    console.error('[FLZ] Monthly summary error:', err)
    res.status(500).json({ error: 'Could not generate monthly deep dive.' })
  }
}
