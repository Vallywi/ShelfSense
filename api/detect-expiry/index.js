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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Clean base64 string
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `You are an assistant that extracts expiration dates from product labels.
      Look at the image and find the expiration date. 
      Common formats include:
      - DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (e.g., 10.04.2026)
      - DD MMM YYYY (e.g., 21 JUL 2026)
      - MM/YYYY (e.g., 12/2026)
      
      IMPORTANT:
      - If you see multiple dates, look for keywords like "EXP", "EXPIRY", "BEST BEFORE", "USE BY", or "E:".
      - DO NOT confuse with "MFG" or "PROD" (manufacturing) dates. Manufacturing dates are usually earlier than expiration dates.
      - In the image, if you see dates stacked, usually the bottom one is EXP.
      
      Return ONLY a JSON object:
      {
        "date": "YYYY-MM-DD",
        "confidence": 0.0 to 1.0,
        "raw_text": "the text you found containing the date"
      }
      If no date is found, return {"date": null, "confidence": 0.0, "raw_text": "no date found"}.`;

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
    
    // Improved JSON extraction
    let data;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : text;
      data = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON Parse Error:', text);
      throw new Error('AI returned invalid format: ' + text);
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
