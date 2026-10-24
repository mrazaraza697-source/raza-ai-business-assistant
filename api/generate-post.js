
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: "Gemini API key is not configured in Vercel."
    });
  }

  try {
    const body = req.body || {};
    const prompt =
      body.prompt ||
      body.topic ||
      body.description ||
      body.name;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        success: false,
        message: "Please enter a topic for your post."
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "You are RAZA TECHNOLOGIES AI Business Assistant. Generate original, professional social media content based on the user's request. Never repeat the prompt as the post. Include a strong call to action and relevant hashtags. Return only the finished post."
            }]
          },
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data.error?.message);

      return res.status(502).json({
        success: false,
        message: "Gemini could not generate the post. Check API access and model availability."
      });
    }

    const post = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!post) {
      return res.status(502).json({
        success: false,
        message: "Gemini returned an empty response."
      });
    }

    return res.status(200).json({
      success: true,
      demo: false,
      post
    });

  } catch (error) {
    console.error("Generate post error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not generate post. Please try again."
    });
  }
}
