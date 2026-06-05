export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { question } = req.body;

  try {
    // ── STEP 1: Find relevant Ayats ──
    const retrievalResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: retrievalPrompt(question) }],
        max_tokens: 600,
        temperature: 0.2
      })
    });

    const retrievalData = await retrievalResponse.json();
    const ayats = retrievalData.choices?.[0]?.message?.content || '';

    // ── STEP 2: Reason from those Ayats to derive conclusion ──
    const reasoningResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: reasoningPrompt(question, ayats) }],
        max_tokens: 900,
        temperature: 0.4
      })
    });

    const reasoningData = await reasoningResponse.json();

    if (!reasoningResponse.ok || !reasoningData.choices) {
      console.error('Groq error:', JSON.stringify(reasoningData));
      return res.status(500).json({ error: reasoningData.error?.message || 'Groq error' });
    }

    const answer = reasoningData.choices[0].message.content || 'No response received.';
    res.status(200).json({ answer });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

function retrievalPrompt(question) {
  return `You are a Quranic scholar. Find the most relevant Ayats from the Quran for this question:

"${question}"

You MUST list 4-6 Ayats in this EXACT format and no other format:
(Surah Name, Chapter:Verse) "exact verse text here"

Example:
(Al-Baqarah, 2:286) "Allah does not burden a soul beyond that it can bear."

Only list Ayats in that exact format. Nothing else.`;
}

function reasoningPrompt(question, ayats) {
  return `You are a wise Islamic guide. You have been given a question and a set of Quranic Ayats that are relevant to it.

The question: "${question}"

The Quranic Ayats (treat these as ground truth — 100% accurate):
${ayats}

Your task:
1. Read each Ayat carefully and understand what Allah is saying
2. Connect the meaning of the Ayats to the person's specific situation
3. Derive a clear, practical conclusion in an explained form that is grounded in these Ayats
4. Do not add opinions or outside knowledge — your conclusion must flow directly from the Ayats and its Tafsir

Instructions for your response:
- Find the most relevant Quranic verses that address this question
- If and only if someone greet with "Assalamu alaikum", reply with "Wa alaikum assalam!"
- Answer softly and factually as a knowledgeable Islamic guide, answer enthusiastically (not with exaggerated greeting like "My dear brother/sister")
- Quote the relevant Ayats directly in your answer in this format: (Surah Name, Chapter:Verse) "verse text here"
- Use tafsir in the internet to ensure the context of the Ayat and the Question are same
- Be practical and relevant to the person's real life situation
- Keep the answer between 7-9 sentences
- End with an encouraging closing thought`;
}
