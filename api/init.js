const { initDB } = require('./database');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await initDB();

    res.json({
      success: true,
      message: 'Ma\'lumotlar bazasi muvaffaqiyatli sozlandi'
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({
      success: false,
      error: 'Ma\'lumotlar bazasini sozlashda xatolik',
      details: error.message
    });
  }
}
