export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: "GEMINI_API_KEY Vercel environment mein set nahi hai." });
  }

  const { message, history = [] } = req.body || {};
  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ success: false, error: "Message likhna zaroori hai." });
  }

  const contents = [];
  if (Array.isArray(history)) {
    for (const item of history.slice(-12)) {
      if (!item || typeof item.text !== "string") continue;
      const role = item.role === "assistant" ? "model" : "user";
      contents.push({ role, parts: [{ text: item.text.slice(0, 6000) }] });
    }
  }
  contents.push({ role: "user", parts: [{ text: message.trim().slice(0, 6000) }] });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        signal: controller.signal,
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 700 }
        })
      }
    );
    const data = await response.json();
    if (!response.ok) {
      console.error("Gemini chat API error:", data);
      return res.status(502).json({
        success: false,
        error: data.error?.message || `Gemini API request failed (${response.status}).`
      });
    }
    const text = data.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
    if (!text) {
      return res.status(502).json({ success: false, error: "Gemini ne jawab return nahi kiya. Dobara try karein." });
    }
    return res.status(200).json({ success: true, text });
  } catch (error) {
    console.error("Gemini chat error:", error);
    const timedOut = error.name === "AbortError" || error.name === "TimeoutError";
    return res.status(timedOut ? 504 : 500).json({
      success: false,
      error: timedOut ? "Gemini ko jawab dene mein zyada waqt laga. Dobara try karein." : "Chat backend request fail hui. Vercel Function Logs check karein."
    });
  } finally {
    clearTimeout(timeout);
  }
}
