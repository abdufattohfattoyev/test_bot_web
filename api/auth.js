// api/auth.js
export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { telegram_id } = req.body;

    if (!telegram_id) {
      return res.status(400).json({ error: 'Telegram ID kerak' });
    }

    // Check if admin (your ID: 973358587)
    const isAdminUser = telegram_id == 973358587;

    res.json({
      is_admin: isAdminUser,
      user: { telegram_id, is_admin: isAdminUser },
      message: isAdminUser ? 'Admin tasdiqlandi' : 'Oddiy foydalanuvchi'
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
}