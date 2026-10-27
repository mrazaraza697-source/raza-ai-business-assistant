
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      text: "Method not allowed"
    });
  }

  try {
    const { business, product, platform, tone, details } = req.body || {};

    if (!business || !product) {
      return res.status(400).json({
        success: false,
        text: "Please enter your business name and product."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        text: "GEMINI_API_KEY is missing in Vercel Environment Variables."
      });
    }

    const prompt = `You are a professional advertising copywriter for small businesses.

Create a compelling advertisement using these details:
Business: ${business}
Product or service: ${product}
Platform: ${platform || "Social media"}
Tone: ${tone || "Professional"}
Extra details: ${details || "None"}

Write a ready-to-publish advertisement with:
- An attention-grabbing headline
- Persuasive but truthful promotional copy
- A clear call to action
- Relevant hashtags

Do not invent prices, discounts, guarantees, or product claims.
Return only the advertisement text.`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
        encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini advertisement API error:", data);
      return res.status(response.status).json({
        success: false,
        text: data.error?.message || "Gemini API request failed."
      });
    }

    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("\n")
        .trim() || "";

    if (!text) {
      return res.status(502).json({
        success: false,
        text: "Gemini returned an empty advertisement. Please try again."
      });
    }

    return res.status(200).json({
      success: true,
      text
    });
  } catch (error) {
    console.error("Advertisement API error:", error);
    return res.status(500).json({
      success: false,
      text: "Advertisement generation failed. Please try again."
    });
  }
}
