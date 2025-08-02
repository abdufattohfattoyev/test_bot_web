// api/auth.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = async function handler(req, res) {
  // CORS headers
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
    const { telegram_id } = req.body;

    if (!telegram_id) {
      return res.status(400).json({ error: 'Telegram ID kerak' });
    }

    // Check if admin
    const adminResult = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1 AND is_admin = true',
      [telegram_id]
    );
    const isAdminUser = adminResult.rows.length > 0;

    // Get user info
    const userResult = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegram_id]
    );
    const user = userResult.rows[0];

    res.json({
      is_admin: isAdminUser,
      user: user,
      message: isAdminUser ? 'Admin tasdiqlandi' : 'Oddiy foydalanuvchi'
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Server xatosi', details: error.message });
  }
};