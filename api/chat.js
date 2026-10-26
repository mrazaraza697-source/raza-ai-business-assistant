
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { message, history = [] } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing in Vercel settings."
      });
    }

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Please enter a message."
      });
    }

    const contents = [];

    if (Array.isArray(history)) {
      for (const item of history.slice(-10)) {
        if (!item) continue;

        const role = item.role === "assistant" || item.role === "model"
          ? "model"
          : "user";

        const content = String(item.content || item.text || "").trim();

        if (content) {
          contents.push({
            role,
            parts: [{ text: content }]
          });
        }
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: message.trim() }]
    });

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({ contents })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Gemini API request failed."
      });
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("") || "";

    return res.status(200).json({
      reply: reply || "Gemini se jawab nahi mila."
    });
  } catch (error) {
    console.error("Gemini Chat error:", error);

    return res.status(500).json({
      error: "Server error while contacting Gemini."
    });
  }
}
