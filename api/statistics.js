const { getStatistics, isAdmin } = require('./database');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { telegram_id } = req.query;

    if (!telegram_id) {
      return res.status(400).json({ error: 'Telegram ID kerak' });
    }

    // Admin ekanligini tekshirish
    const isAdminUser = await isAdmin(telegram_id);
    if (!isAdminUser) {
      return res.status(403).json({ error: 'Admin huquqlari kerak' });
    }

    const stats = await getStatistics();

    res.json({
      success: true,
      statistics: stats,
      message: 'Statistika olindi'
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
}