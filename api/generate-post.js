
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
  const timeout = setTimeout(() => controller.abort(), 20000);

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
Product or service: ${product.trim()}
Platform: ${platform || "Facebook"}
Tone: ${tone || "Professional"}
Additional instructions: ${details || "Keep it concise and engaging."}

Rules:
- Follow the user's instructions carefully.
- Return only the finished post.
- Do not invent product features, prices, or guarantees.
- Keep the post concise unless another length is requested.`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
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
        error: data.error?.message ||
          `Gemini API request failed (${response.status}).`
      });
    }

    const text = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!text) {
      console.error("Gemini returned no text:", data);

      return res.status(502).json({
        success: false,
        error: "Gemini ne post return nahi ki. Dobara try karein."
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
      error.name === "AbortError" ||
      error.name === "TimeoutError";

    return res.status(timedOut ? 504 : 500).json({
      success: false,
      error: timedOut
        ? "Gemini ko jawab dene mein 20 seconds se zyada lage. Dobara try karein."
        : "Backend request fail hui. Vercel Function Logs check karein."
    });

  } finally {
    clearTimeout(timeout);
  }
}
