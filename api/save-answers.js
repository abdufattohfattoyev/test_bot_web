const { saveTestAnswers, getTest, isAdmin } = require('./database');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { telegram_id, test_code, answers } = req.body;

    // Admin ekanligini tekshirish
    const isAdminUser = await isAdmin(telegram_id);
    if (!isAdminUser) {
      return res.status(403).json({ error: 'Admin huquqlari kerak' });
    }

    const test = await getTest(test_code);
    if (!test) {
      return res.status(404).json({ error: 'Test topilmadi' });
    }

    const success = await saveTestAnswers(test.id, answers);

    if (success) {
      res.json({ success: true, message: 'Javoblar saqlandi' });
    } else {
      res.status(400).json({ error: 'Javoblarni saqlashda xatolik' });
    }
  } catch (error) {
    console.error('Save answers error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
}