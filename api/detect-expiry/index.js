const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'Image is required' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Clean base64 string
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `You are an OCR assistant that extracts expiration dates from product label photos.

Read ALL text visible in the image, then identify the expiration / best-before / use-by date.

ACCEPTABLE FORMATS (extract whichever appears):
- Numeric: DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY, DD.MM.YYYY, YYYY-MM-DD, YYYY/MM/DD
- Short numeric: DD/MM/YY, MM/YY, MM/YYYY, MM-YY
- With month name: "21 JUL 2026", "JUL 21 2026", "July 21, 2026", "21 July 2026"
- Word-only month + year: "JUL 2026", "July 2026", "Nov-26", "NOV 26"
- With prefix words: "EXP", "EXPIRY", "EXPIRES", "EXP DATE", "BEST BEFORE", "BEST BY",
  "BB", "BBE", "USE BY", "UB", "CONSUME BY", "E:", "EXP:", "EXP."

EXTRACTION RULES (apply in order):
1. If multiple dates exist, prefer one near an EXP-style keyword above.
2. Otherwise prefer the LATEST (furthest in the future) date — manufacturing dates
   ("MFG", "MFD", "PROD", "PACKED ON") are always earlier than expiration.
3. If the date is stacked (two lines), the lower line is usually the EXP date.
4. If only month + year are given, use the LAST day of that month.
5. If only year is given, return null — that's not enough information.
6. Ambiguous DD/MM vs MM/DD: assume DD/MM (international), unless the first number
   is > 12 (then it's the day) or the product context strongly suggests US.
7. 2-digit years: assume 20YY (e.g., "26" -> 2026).
8. Output the final date in ISO YYYY-MM-DD form.

Return ONLY a JSON object, no markdown fences, no commentary:
{
  "date": "YYYY-MM-DD" or null,
  "confidence": 0.0 to 1.0,
  "raw_text": "the exact substring from the label that contains the date"
}

If no expiry-style date can be confidently extracted, return:
{"date": null, "confidence": 0.0, "raw_text": "<all text you read, even if no date>"}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/png"
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    console.log('AI Raw Response:', text);

    // Strip ```json fences if Gemini emitted any, then grab the first JSON object.
    let data;
    try {
      const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '');
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : cleaned;
      data = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON Parse Error:', text);
      throw new Error('AI returned invalid format: ' + text);
    }

    // Normalize: if the model returned only YYYY-MM, expand to last day of month.
    // If it emitted a non-ISO date string, try to parse and reformat.
    if (data && typeof data.date === 'string') {
      const isoDay = /^\d{4}-\d{2}-\d{2}$/;
      const isoMonth = /^(\d{4})-(\d{2})$/;
      if (isoMonth.test(data.date)) {
        const [, y, m] = data.date.match(isoMonth);
        const last = new Date(Number(y), Number(m), 0).getDate();
        data.date = `${y}-${m}-${String(last).padStart(2, '0')}`;
      } else if (!isoDay.test(data.date)) {
        const parsed = new Date(data.date);
        if (!isNaN(parsed.getTime())) {
          data.date = parsed.toISOString().slice(0, 10);
        } else {
          data.date = null;
        }
      }
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('AI Vision Error:', error);
    res.status(500).json({ 
      error: 'Failed to process image',
      details: error.message 
    });
  }
};
