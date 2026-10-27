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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

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

    const prompt = `Create one persuasive advertisement for a business.

Business name: ${business.trim()}
Product or service: ${product.trim()}
Platform: ${platform || "Facebook"}
Tone: ${tone || "Professional"}
Additional details: ${details || "Create concise, engaging promotional copy."}

Requirements:
- Write an attention-grabbing headline.
- Explain the product or service using only provided facts.
- Include a clear call to action.
- Make the ad suitable for the selected platform.
- Do not invent prices, discounts, features, guarantees, or contact details.
- Return only the finished advertisement.`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 400
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini Advertisement API error:", data);

      return res.status(502).json({
        success: false,
        error: data.error?.message ||
          `Gemini API request failed (${response.status}).`
      });
    }

    const text = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!text) {
      return res.status(502).json({
        success: false,
        error: "Gemini ne advertisement return nahi ki. Dobara try karein."
      });
    }

    return res.status(200).json({
      success: true,
      demo: false,
      text
    });

  } catch (error) {
    console.error("Generate advertisement error:", error);

    const timedOut = error.name === "AbortError";

    return res.status(timedOut ? 504 : 500).json({
      success: false,
      error: timedOut
        ? "Gemini ko jawab dene mein zyada waqt laga. Dobara try karein."
        : "Advertisement request fail hui. Vercel Function Logs check karein."
    });

  } finally {
    clearTimeout(timeout);
  }
}
