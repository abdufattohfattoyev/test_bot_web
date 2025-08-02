const { getStudentResults, isAdmin } = require('./database');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, telegram_id } = req.query;

    if (!code || !telegram_id) {
      return res.status(400).json({ error: 'Test kodi va Telegram ID kerak' });
    }

    // Admin ekanligini tekshirish
    const isAdminUser = await isAdmin(telegram_id);
    if (!isAdminUser) {
      return res.status(403).json({ error: 'Admin huquqlari kerak' });
    }

    const results = await getStudentResults(code);

    res.json({ success: true, results });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
}