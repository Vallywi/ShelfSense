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

    const prompt = `You are an assistant that extracts expiration dates from product images.

Return ONLY a JSON object in this format:
{
"date": "YYYY-MM-DD",
"raw_text": "original detected text",
"confidence": 0-1
}

Rules:
* Detect expiration date (EXP, Best Before, Use By)
* If multiple dates exist, choose the expiration date (not manufacturing)
* If month is text (e.g., JUL), convert it correctly
* If unsure, return null date with low confidence
* Do not include explanations`;

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
