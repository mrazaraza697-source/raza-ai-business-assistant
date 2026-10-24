
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  return res.status(200).json({
    success: true,
    message: "RAZA TECHNOLOGIES AI backend is connected.",
    demo: true,
    post: "Welcome to RAZA TECHNOLOGIES AI — BUILD SMART. THINK BIG. Your Business Assistant API is working."
  });
}
