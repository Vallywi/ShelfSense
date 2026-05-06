const { GoogleGenerativeAI } = require('@google/generative-ai');
const { verifyToken } = require('./auth-middleware');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY not configured. Set it in your .env file or Vercel environment.',
    });
  }

  const { message, items = [], history = [] } = req.body || {};
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: buildSystemInstruction(items),
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 800,
      },
    });

    // Convert chat history to Gemini format
    const chatHistory = history
      .slice(-10) // last 10 messages for context, keep prompt small
      .map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }));

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message);
    const text = result.response.text();

    return res.status(200).json({ reply: text });
  } catch (err) {
    console.error('Chef AI error:', err);
    return res.status(500).json({
      error: err.message || 'Chef AI request failed',
    });
  }
};

function buildSystemInstruction(items) {
  const itemList = items.length > 0
    ? items
        .map((i) => {
          const exp = i.expiryDate ? new Date(i.expiryDate).toLocaleDateString() : 'no expiry set';
          return `- ${i.name} (${i.category || 'Uncategorized'}, qty: ${i.quantity || '1'}, status: ${i.status || 'safe'}, expires: ${exp})`;
        })
        .join('\n')
    : '(pantry is empty)';

  return `You are Chef Sage, a warm and creative AI cooking assistant inside the ShelfSense pantry app.

PERSONALITY:
- Friendly, encouraging, a bit playful
- Practical and never wasteful — prioritize ingredients about to expire
- Concise: 2-4 short paragraphs, no walls of text
- Use markdown sparingly: **bold** for ingredient names, bullet lists for steps
- Occasional 🍳 or 🌿 emoji for warmth (don't overdo it)

USER'S CURRENT PANTRY (${items.length} item${items.length === 1 ? '' : 's'}):
${itemList}

RULES:
- ALWAYS prioritize ingredients with status 'urgent' or 'expired' first — those need to be used now
- ITEMS MARKED 'soon' should be used within a week
- Only suggest recipes the user can mostly make with what they have. If a key ingredient is missing, say so and offer a simple substitution
- For recipe requests: give a 4-6 step version with realistic timing
- If pantry is empty: suggest a small smart grocery list (5-7 items) for someone starting fresh
- NEVER invent items not in their pantry; never claim they have something they don't
- If the user asks something unrelated to cooking/food, gently redirect: "I'm best at cooking — what can I help you make?"

Respond conversationally to the user's question.`;
}
