
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: "GEMINI_API_KEY Vercel environment mein set nahi hai."
    });
  }

  try {
    const { business, product, platform, tone, details } =
      req.body || {};

    if (!business?.trim() || !product?.trim()) {
      return res.status(400).json({
        success: false,
        error: "Business name aur product zaroori hain."
      });
    }

    const prompt = `
You are a professional AI marketing copywriter.

Create an original, ready-to-publish social media post.

Business name: ${business}
Product or service: ${product}
Platform: ${platform || "Facebook"}
Tone: ${tone || "Professional"}
Additional instructions: ${details || "No extra instructions."}

IMPORTANT RULES:
- Follow the additional instructions carefully.
- Do not copy the instructions themselves into the post.
- Do not invent product features, prices, guarantees, or claims.
- Respect requested length, phrases, language, and hashtag preferences.
- Return only the finished post, without explanations or labels.
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
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
            maxOutputTokens: 700
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res.status(response.status >= 500 ? 502 : response.status)
        .json({
          success: false,
          error:
            data.error?.message ||
            "Gemini API request failed."
        });
    }

    const text = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!text) {
      return res.status(502).json({
        success: false,
        error: "Gemini ne koi text return nahi kiya."
      });
    }

    return res.status(200).json({
      success: true,
      demo: false,
      text
    });

  } catch (error) {
    console.error("Generate post error:", error);

    return res.status(500).json({
      success: false,
      error: "AI post generate nahi hui. Dobara koshish karein."
    });
  }
}
