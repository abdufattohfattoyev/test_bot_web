const { getUser, updateUserActivity } = require('./database');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { telegram_id } = req.query;

    if (!telegram_id) {
      return res.status(400).json({ error: 'Telegram ID kerak' });
    }

    const user = await getUser(telegram_id);

    if (user) {
      // Foydalanuvchi faolligini yangilash
      await updateUserActivity(telegram_id);

      res.json({
        success: true,
        user,
        message: 'Foydalanuvchi ma\'lumotlari olindi'
      });
    } else {
      res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
}