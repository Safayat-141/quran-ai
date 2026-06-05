export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { question } = req.body;
  try {
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

    const reasoningResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: reasoningPrompt(question, ayats) }],
        max_tokens: 1200,
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

List exactly 3-4 Ayats in this EXACT format only:
(Surah Name, Chapter:Verse) "exact verse text here"

Example:
(Al-Baqarah, 2:286) "Allah does not burden a soul beyond that it can bear."

Only list Ayats. Nothing else. No numbering, no explanation.`;
}

function reasoningPrompt(question, ayats) {
  return `You are a wise Islamic guide. A person has asked: "${question}"

The following Quranic Ayats are your ground truth — treat them as 100% accurate:
${ayats}

Structure your response in these exact sections with these exact headings:

**Understanding**
Write 2-3 sentences giving context and your understanding of the topic from an Islamic perspective. Do not quote any Ayat here. Speak in your own words.

**Quranic Guidance**
For each Ayat, write it in full using this format: (Surah Name, Chapter:Verse) "verse text"
Then on the next line, write 1-2 sentences explaining what this Ayat means in relation to the question. Do this for each Ayat separately.

**Conclusion**
Write 2-3 sentences summarizing what the Quran teaches about this situation. Make it practical and directly useful to the person.

**Closing**
One warm, encouraging sentence to end.

Additional instructions:
- If greeted with "Assalamu alaikum", add "Wa alaikum assalam!" before the Understanding section
- Never use greetings like "My dear brother/sister"
- Speak softly, factually, and with warmth
- Every Ayat must be quoted in full — never reference an Ayat without quoting it completely
- Stay strictly grounded in the Ayats provided`;
}
