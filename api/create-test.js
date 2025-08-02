const { createTest, isAdmin } = require('./database');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      telegram_id,
      code,
      title,
      open_questions_count,
      closed_questions_count,
      options_count
    } = req.body;

    // Admin ekanligini tekshirish
    const isAdminUser = await isAdmin(telegram_id);
    if (!isAdminUser) {
      return res.status(403).json({ error: 'Admin huquqlari kerak' });
    }

    const test = await createTest(
      code,
      title,
      telegram_id,
      open_questions_count,
      closed_questions_count,
      options_count
    );

    if (test) {
      res.json({ success: true, test });
    } else {
      res.status(400).json({ error: 'Test yaratishda xatolik' });
    }
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
}