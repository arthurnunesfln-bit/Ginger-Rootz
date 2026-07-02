// Vercel Serverless Function
// Keeps the Anthropic API key on the server — the browser never sees it.
//
// Deploy on Vercel and set the environment variable ANTHROPIC_API_KEY
// (Project Settings -> Environment Variables) with a key from
// https://console.anthropic.com/settings/keys
//
// Check https://docs.claude.com for the current recommended model string;
// "claude-sonnet-5" is used below as a solid default for this workload.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY não configurada no servidor." });
    return;
  }

  try {
    const { system, messages } = req.body || {};
    if (!messages) {
      res.status(400).json({ error: "Campo 'messages' é obrigatório." });
      return;
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1000,
        system,
        messages,
      }),
    });

    const data = await anthropicRes.json();
    res.status(anthropicRes.status).json(data);
  } catch (err) {
    res.status(500).json({ error: String(err && err.message ? err.message : err) });
  }
}
