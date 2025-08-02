const { isAdmin, getUser } = require('./database');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { telegram_id } = req.body;

    if (!telegram_id) {
      return res.status(400).json({ error: 'Telegram ID kerak' });
    }

    const isAdminUser = await isAdmin(telegram_id);
    const user = await getUser(telegram_id);

    res.json({
      is_admin: isAdminUser,
      user: user,
      message: isAdminUser ? 'Admin tasdiqlandi' : 'Oddiy foydalanuvchi'
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
}