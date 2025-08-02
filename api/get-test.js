const { getTest } = require('./database');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Test kodi kerak' });
    }

    const test = await getTest(code);

    if (test) {
      res.json({ success: true, test });
    } else {
      res.status(404).json({ error: 'Test topilmadi' });
    }
  } catch (error) {
    console.error('Get test error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
}