export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages array' });
  }

  const systemPrompt = {
    role: 'system',
    content: `You are a professional sales assistant for Zubhai...` // your prompt
  };

  const fullMessages = [systemPrompt, ...messages];

  try {
    const openaiRes = await fetch('https://api.deepseek.com/v1/chat/completions', {  // ✅ DeepSeek URL
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`  // ✅ Correct env var
      },
      body: JSON.stringify({
        model: 'deepseek-chat',  // ✅ DeepSeek model
        messages: fullMessages,
        max_tokens: 150,
        temperature: 0.7
      })
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      console.error('DeepSeek error:', data);
      return res.status(500).json({ error: 'DeepSeek API error', details: data.error });
    }

    const assistantMessage = data.choices[0].message.content;
    return res.status(200).json({ reply: assistantMessage });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
