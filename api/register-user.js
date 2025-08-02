// api/register-user.js
const { saveStudent } = require('./database');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { telegram_id, full_name } = req.body;

    if (!telegram_id || !full_name) {
      return res.status(400).json({ error: 'Malumotlar yetarli emas' });
    }

    const student = await saveStudent(telegram_id, full_name, "no-test"); // yoki default test_code
    res.json({ success: true, student });
  } catch (err) {
    console.error('Register user error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
}
