// api/init.js
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
    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        username VARCHAR(255),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        full_name VARCHAR(255),
        is_admin BOOLEAN DEFAULT false,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        username VARCHAR(255),
        full_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tests (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        admin_id BIGINT NOT NULL,
        open_questions_count INTEGER DEFAULT 0,
        closed_questions_count INTEGER DEFAULT 0,
        options_count INTEGER DEFAULT 4,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_answers (
        id SERIAL PRIMARY KEY,
        test_id INTEGER NOT NULL,
        question_number INTEGER NOT NULL,
        question_type VARCHAR(10) CHECK (question_type IN ('open', 'closed')),
        correct_answer TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT,
        full_name VARCHAR(255) NOT NULL,
        test_code VARCHAR(50) NOT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        score INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 0,
        percentage NUMERIC(5,2) DEFAULT 0
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_answers (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL,
        question_number INTEGER NOT NULL,
        question_type VARCHAR(10),
        student_answer TEXT NOT NULL,
        is_correct BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add main admin
    await pool.query(
      `INSERT INTO users (telegram_id, username, full_name, is_admin)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (telegram_id) 
       DO UPDATE SET is_admin = true, username = EXCLUDED.username, full_name = EXCLUDED.full_name`,
      [973358587, 'FATTOYEVABDUFATTOH', 'АБДУФАТТОҲ ФАТТОЕВ']
    );

    await pool.query(
      `INSERT INTO admins (telegram_id, username, full_name) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (telegram_id) DO NOTHING`,
      [973358587, 'FATTOYEVABDUFATTOH', 'АБДУФАТТОҲ ФАТТОЕВ']
    );

    res.json({ 
      success: true, 
      message: 'Ma\'lumotlar bazasi muvaffaqiyatli sozlandi'
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ma\'lumotlar bazasini sozlashda xatolik',
      details: error.message
    });
  }
};