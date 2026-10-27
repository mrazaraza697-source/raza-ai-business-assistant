
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      text: "Method not allowed"
    });
  }

  try {
    const { business, product, platform, tone, details } =
      req.body || {};

    if (
      typeof business !== "string" ||
      !business.trim() ||
      typeof product !== "string" ||
      !product.trim()
    ) {
      return res.status(400).json({
        success: false,
        text: "Business name aur product zaroori hain."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        text: "GEMINI_API_KEY Vercel Environment Variables mein set nahi hai."
      });
    }

    const prompt = `You are a professional social media copywriter.

Create one ready-to-publish social media post.

Business: ${business.trim()}
Product or service: ${product.trim()}
Platform: ${platform || "Facebook"}
Tone: ${tone || "Professional"}
Extra details: ${details || "None"}

Requirements:
- Write an engaging opening.
- Promote the product using only the supplied facts.
- Include a clear call to action.
- Add relevant hashtags.
- Do not invent prices, discounts, guarantees or product claims.
- Return only the finished post.`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini Generate Post error:", data);

      return res.status(502).json({
        success: false,
        text: data.error?.message ||
          "Gemini API request failed."
      });
    }

    const text = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("\n")
      .trim();

    if (!text) {
      return res.status(502).json({
        success: false,
        text: "Gemini ne post return nahi ki. Dobara try karein."
      });
    }

    return res.status(200).json({
      success: true,
      text
    });

  } catch (error) {
    console.error("Generate Post error:", error);

    return res.status(500).json({
      success: false,
      text: "Post generate nahi hui. Vercel Function Logs check karein."
    });
  }
};
