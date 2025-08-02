module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const code = req.query.code;

  if (!code) {
    return res.status(400).json({ error: 'Test kodi kerak' });
  }

  // Temporary test data
  res.json({
    success: true,
    test: {
      id: 1,
      code: code,
      title: "Test " + code,
      open_questions_count: 3,
      closed_questions_count: 7,
      options_count: 4
    }
  });
};