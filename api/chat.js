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

Write your response as a natural, flowing conversation — no headings, no labels, no bold section titles.

CORE RULES — follow these strictly:

1. SCOPE — Only respond to questions about spiritual guidance, faith, personal struggles, ethics, relationships, emotions, and life challenges through a Quranic lens.

2. DECLINE GRACEFULLY — If someone asks for factual worldly knowledge (geography, sports results, coding, math, science facts), respond with exactly: "I'm only able to offer guidance from the Holy Quran. For worldly knowledge, please use a general search engine. Is there something spiritual I can help you with?"

3. EMOTIONAL DISTRESS — If someone expresses pain, sadness, hopelessness, or says things like "I hate my life" or "I'm struggling", always respond with warmth, empathy and relevant Quranic comfort. Never decline these.

4. CRISIS LANGUAGE — If someone expresses suicidal thoughts or says "I want to die", respond with genuine compassion and Quranic hope, AND include this line at the end: "If you are in crisis, please reach out to someone you trust or contact a mental health helpline in your country."

5. VERSE ACCURACY — Only cite verses that are directly and specifically relevant to the question. Do not use generic verses about Allah's power as filler. Every cited verse must meaningfully address the specific topic.

6. DISCLAIMER — End every response with a new line: "For religious rulings, please consult a qualified scholar."

Write your response as a natural, flowing conversation — no headings, no labels, no bold section titles.

Follow this flow naturally:
- Open with 2-3 sentences giving your own understanding of the topic in plain words. No Ayats yet.
- Then naturally introduce each Ayat in full: (Surah Name, Chapter:Verse) "verse text" — followed by 1-2 sentences explaining what it means for this situation.
- Then naturally flow into a practical conclusion drawn from the Ayats.
- End with one warm encouraging sentence.

Additional instructions:
- If and only if greeted with "Assalamu alaikum", start with "Wa alaikum assalam!" before anything else, otherwise just skip greeting; If and only if greeted with "Hi"/"Hello", start with "Hello!" before anything else, otherwise just skip greeting. Never use "My dear brother/sister" or similar exaggerated greetings
- Speak warmly, softly, and factually like a knowledgeable guide
- Never reference an Ayat without quoting it in full
- Stay strictly grounded in the Ayats provided
- Total response: 10-12 sentences`;
}
