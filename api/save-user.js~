// api/save-user.js
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
    const {
      telegram_id,
      username,
      first_name,
      last_name,
      full_name,
      is_admin
    } = req.body;

    if (!telegram_id) {
      return res.status(400).json({ error: 'Telegram ID kerak' });
    }

    const result = await pool.query(
      `INSERT INTO users (telegram_id, username, first_name, last_name, full_name, is_admin, last_active)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       ON CONFLICT (telegram_id)
       DO UPDATE SET
         username = EXCLUDED.username,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         full_name = EXCLUDED.full_name,
         last_active = CURRENT_TIMESTAMP
       RETURNING *`,
      [telegram_id, username, first_name, last_name, full_name, is_admin || false]
    );

    const user = result.rows[0];

    if (user) {
      res.json({ 
        success: true, 
        user,
        message: 'Foydalanuvchi muvaffaqiyatli saqlandi'
      });
    } else {
      res.status(400).json({ error: 'Foydalanuvchini saqlashda xatolik' });
    }
  } catch (error) {
    console.error('Save user error:', error);
    res.status(500).json({ error: 'Server xatosi', details: error.message });
  }
};