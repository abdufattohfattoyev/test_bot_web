module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const telegram_id = req.query.telegram_id;

  // Check if admin
  if (telegram_id != 973358587) {
    return res.status(403).json({ error: 'Admin huquqlari kerak' });
  }

  res.json({
    success: true,
    statistics: {
      total_users: 25,
      total_admins: 1,
      total_tests: 5,
      total_completed_tests: 47
    }
  });
};