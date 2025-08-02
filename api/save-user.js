module.exports = function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { telegram_id, username, first_name, last_name, full_name } = req.body;

    if (!telegram_id) {
      return res.status(400).json({ error: 'Telegram ID kerak' });
    }

    // Temporary success response
    res.json({ 
      success: true, 
      user: { telegram_id, username, first_name, full_name },
      message: 'Foydalanuvchi saqlandi (test mode)'
    });
  } catch (error) {
    console.error('Save user error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
};