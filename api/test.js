export default function handler(req, res) {
  res.json({
    success: true,
    message: "API ishlayapti!",
    timestamp: new Date().toISOString()
  });
}