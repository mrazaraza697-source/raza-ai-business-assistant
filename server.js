require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

function buildFallbackPost({ business, product, platform, tone, details }) {
  const safeBusiness = business || 'Your Business';
  const safeProduct = product || 'your product';
  const safePlatform = platform || 'Social Media';
  const safeTone = tone || 'Professional';
  const safeDetails = details || 'We help businesses grow with smarter strategies and modern digital solutions.';

  const opening =
    safeTone === 'Friendly'
      ? 'Good things start with the right choice!'
      : safeTone === 'Promotional'
        ? '✨ Discover something made for you!'
        : 'Discover a smarter way to move forward.';

  return `${opening}\n\n${safeBusiness} is here to help you with ${safeProduct}.\n\n${safeDetails}\n\nPerfect for ${safePlatform} growth and business visibility.\n\nGet in touch to learn more!\n\n#${safeBusiness.replace(/[^a-zA-Z0-9]/g, '')} #Business #Growth`;
}

async function generateWithHuggingFace({ business, product, platform, tone, details }) {
  const token = process.env.HF_TOKEN;
  if (!token) {
    return { source: 'demo', text: buildFallbackPost({ business, product, platform, tone, details }) };
  }

  const prompt = `Write a short, professional social media post for a business called ${business || 'My Business'} promoting ${product || 'a product'} on ${platform || 'social media'}. Tone: ${tone || 'Professional'}. Details: ${details || 'Quality service and clear communication'}.`;

  const response = await fetch('https://api-inference.huggingface.co/models/google/flan-t5-small', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: prompt })
  });

  if (!response.ok) {
    throw new Error(`HF request failed with status ${response.status}`);
  }

  const result = await response.json();
  const text = Array.isArray(result)
    ? result[0]?.generated_text || result[0]?.text
    : result.generated_text || result.output || result.text;

  return {
    source: 'huggingface',
    text: text || buildFallbackPost({ business, product, platform, tone, details })
  };
}

app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'RAZA AI Business Assistant backend is running.' });
});

app.post('/api/generate', async (req, res) => {
  const { business, product, platform, tone, details } = req.body || {};

  if (!business || !product) {
    return res.status(400).json({
      ok: false,
      error: 'Business and product are required.'
    });
  }

  try {
    const result = await generateWithHuggingFace({ business, product, platform, tone, details });
    return res.json({ ok: true, ...result });
  } catch (error) {
    const fallback = buildFallbackPost({ business, product, platform, tone, details });
    return res.json({
      ok: true,
      source: 'demo-fallback',
      text: fallback,
      warning: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`RAZA AI backend running on http://localhost:${PORT}`);
});
