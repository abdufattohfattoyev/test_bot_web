const { saveUser, updateUserActivity } = require('./database');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      telegram_id,
      username,
      first_name,
      last_name,
      full_name,
      is_admin
    } = req.body;

    if (!telegram_id) {
      return res.status(400).json({ error: 'Telegram ID kerak' });
    }

    const user = await saveUser(
      telegram_id,
      username,
      first_name,
      last_name,
      full_name,
      is_admin || false
    );

    if (user) {
      res.json({
        success: true,
        user,
        message: 'Foydalanuvchi muvaffaqiyatli saqlandi'
      });
    } else {
      res.status(400).json({ error: 'Foydalanuvchini saqlashda xatolik' });
    }
  } catch (error) {
    console.error('Save user error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
}