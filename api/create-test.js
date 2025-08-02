module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { telegram_id, code, title } = req.body;

  // Check if admin (your ID: 973358587)
  if (telegram_id != 973358587) {
    return res.status(403).json({ error: 'Admin huquqlari kerak' });
  }

  res.json({
    success: true,
    test: { id: Date.now(), code, title },
    message: 'Test yaratildi'
  });
};