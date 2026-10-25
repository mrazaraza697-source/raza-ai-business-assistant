
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
      error: "GEMINI_API_KEY Vercel mein set nahi hai."
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
        error: "Business name aur product zaroori hain."
      });
    }

    const prompt = `Write one ready-to-publish social media post.

Business: ${business.trim()}
Product/service: ${product.trim()}
Platform: ${platform || "Facebook"}
Tone: ${tone || "Professional"}
Instructions: ${details || "Keep it concise and engaging."}

Rules:
- Follow the user's instructions.
- Do not invent features, prices, or guarantees.
- Return only the finished post.
- Keep it concise unless a different length is requested.`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 300
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);

      return res.status(502).json({
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
        error: "Gemini ne koi post return nahi ki."
      });
    }

    return res.status(200).json({
      success: true,
      demo: false,
      text
    });

  } catch (error) {
    console.error("Generate post error:", error);

    const timedOut =
      error.name === "TimeoutError" ||
      error.name === "AbortError";

    return res.status(timedOut ? 504 : 500).json({
      success: false,
      error: timedOut
        ? "Gemini response mein 20 seconds se zyada lag rahe hain. Dobara try karein."
        : "AI post generate nahi hui. Dobara koshish karein."
    });
  }
}
