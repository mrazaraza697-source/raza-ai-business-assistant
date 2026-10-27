export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      text: "Method not allowed"
    });
  }

  try {
    const { business, product, platform, tone, details } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (!business?.trim() || !product?.trim()) {
      return res.status(400).json({
        success: false,
        text: "Business name aur product zaroori hain."
      });
    }

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        text: "GEMINI_API_KEY Vercel Environment Variables mein set nahi hai."
      });
    }

    const prompt = `Write a professional advertisement.
Business: ${business}
Product: ${product}
Platform: ${platform || "Facebook"}
Tone: ${tone || "Professional"}
Details: ${details || "None"}

Include an engaging headline, truthful promotional copy, a call to action, and relevant hashtags. Do not invent prices, discounts, guarantees, or product claims. Return only the advertisement.`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        text: data.error?.message || "Gemini API request failed."
      });
    }

    const text = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("\n")
      .trim();

    if (!text) {
      return res.status(502).json({
        success: false,
        text: "Gemini ne advertisement return nahi ki."
      });
    }

    return res.status(200).json({ success: true, text });
  } catch (error) {
    console.error("Advertisement error:", error);
    return res.status(500).json({
      success: false,
      text: "Advertisement request fail hui."
    });
  }
}
