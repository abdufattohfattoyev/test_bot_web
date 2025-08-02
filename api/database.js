// api/database.js - To'g'irlangan versiya
const { Pool } = require('pg');

// PostgreSQL connection (Supabase)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initDB() {
  try {
    // 1. Users jadvali (asosiy foydalanuvchilar)
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

    // 2. Admins jadvali
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        username VARCHAR(255),
        full_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Tests jadvali (admin_id ni telegram_id ga o'zgartirdim)
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

    // 4. Test javoblari jadvali
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

    // 5. Students jadvali
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

    // 6. Student javoblari jadvali
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

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// User functions
async function saveUser(telegramId, username, firstName, lastName, fullName, isAdmin = false) {
  try {
    const result = await pool.query(
      `INSERT INTO users (telegram_id, username, first_name, last_name, full_name, is_admin, last_active)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       ON CONFLICT (telegram_id)
       DO UPDATE SET
         username = EXCLUDED.username,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         full_name = EXCLUDED.full_name,
         is_admin = EXCLUDED.is_admin,
         last_active = CURRENT_TIMESTAMP
       RETURNING *`,
      [telegramId, username, firstName, lastName, fullName, isAdmin]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Save user error:', error);
    return null;
  }
}

async function getUser(telegramId) {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

async function updateUserActivity(telegramId) {
  try {
    await pool.query(
      'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE telegram_id = $1',
      [telegramId]
    );
    return true;
  } catch (error) {
    console.error('Update user activity error:', error);
    return false;
  }
}

// Admin functions
async function addAdmin(telegramId, username, fullName) {
  try {
    // Avval user ni admin qilib belgilaymiz
    await pool.query(
      `INSERT INTO users (telegram_id, username, full_name, is_admin)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (telegram_id)
       DO UPDATE SET is_admin = true, username = EXCLUDED.username, full_name = EXCLUDED.full_name`,
      [telegramId, username, fullName]
    );

    // Keyin admins jadvaliga qo'shamiz
    const adminResult = await pool.query(
      `INSERT INTO admins (telegram_id, username, full_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (telegram_id) DO NOTHING
       RETURNING *`,
      [telegramId, username, fullName]
    );

    return adminResult.rows[0] || { telegram_id: telegramId, username, full_name: fullName };
  } catch (error) {
    console.error('Add admin error:', error);
    return null;
  }
}

async function isAdmin(telegramId) {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1 AND is_admin = true',
      [telegramId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Check admin error:', error);
    return false;
  }
}

// Test functions - admin_id ni telegram_id sifatida ishlatamiz
async function createTest(code, title, adminTelegramId, openCount, closedCount, optionsCount) {
  try {
    const result = await pool.query(
      `INSERT INTO tests (code, title, admin_id, open_questions_count, closed_questions_count, options_count)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [code, title, adminTelegramId, openCount, closedCount, optionsCount]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Create test error:', error);
    return null;
  }
}

async function saveTestAnswers(testId, answers) {
  try {
    // Avvalgi javoblarni o'chirish
    await pool.query('DELETE FROM test_answers WHERE test_id = $1', [testId]);

    // Yangi javoblarni saqlash
    for (const [key, value] of Object.entries(answers)) {
      const [type, number] = key.split('-');
      await pool.query(
        'INSERT INTO test_answers (test_id, question_number, question_type, correct_answer) VALUES ($1, $2, $3, $4)',
        [testId, parseInt(number), type, value]
      );
    }
    return true;
  } catch (error) {
    console.error('Save test answers error:', error);
    return false;
  }
}

async function getTest(code) {
  try {
    const result = await pool.query(
      'SELECT * FROM tests WHERE code = $1 AND is_active = true',
      [code]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Get test error:', error);
    return null;
  }
}

async function getTestAnswers(testId) {
  try {
    const result = await pool.query(
      'SELECT * FROM test_answers WHERE test_id = $1 ORDER BY question_type, question_number',
      [testId]
    );
    return result.rows;
  } catch (error) {
    console.error('Get test answers error:', error);
    return [];
  }
}

// Student functions
async function saveStudent(telegramId, fullName, testCode) {
  try {
    const result = await pool.query(
      'INSERT INTO students (telegram_id, full_name, test_code) VALUES ($1, $2, $3) RETURNING *',
      [telegramId, fullName, testCode]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Save student error:', error);
    return null;
  }
}

async function saveStudentAnswers(studentId, answers, score, total) {
  try {
    // Student javoblarini saqlash
    for (const [key, value] of Object.entries(answers)) {
      const [type, number] = key.split('-');
      await pool.query(
        'INSERT INTO student_answers (student_id, question_number, question_type, student_answer) VALUES ($1, $2, $3, $4)',
        [studentId, parseInt(number), type, value]
      );
    }

    // Student natijasini yangilash
    const percentage = (score / total) * 100;
    await pool.query(
      'UPDATE students SET completed_at = CURRENT_TIMESTAMP, score = $1, total_questions = $2, percentage = $3 WHERE id = $4',
      [score, total, percentage, studentId]
    );

    return true;
  } catch (error) {
    console.error('Save student answers error:', error);
    return false;
  }
}

async function getStudentResults(testCode) {
  try {
    const result = await pool.query(
      `SELECT s.*,
              COALESCE(s.score, 0) as score,
              COALESCE(s.total_questions, 0) as total_questions,
              COALESCE(s.percentage, 0) as percentage
       FROM students s
       WHERE s.test_code = $1 AND s.completed_at IS NOT NULL
       ORDER BY s.percentage DESC, s.completed_at ASC`,
      [testCode]
    );
    return result.rows;
  } catch (error) {
    console.error('Get student results error:', error);
    return [];
  }
}

// Statistics functions
async function getStatistics() {
  try {
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
    const totalAdmins = await pool.query('SELECT COUNT(*) FROM users WHERE is_admin = true');
    const totalTests = await pool.query('SELECT COUNT(*) FROM tests');
    const totalStudents = await pool.query('SELECT COUNT(*) FROM students WHERE completed_at IS NOT NULL');

    return {
      total_users: parseInt(totalUsers.rows[0].count),
      total_admins: parseInt(totalAdmins.rows[0].count),
      total_tests: parseInt(totalTests.rows[0].count),
      total_completed_tests: parseInt(totalStudents.rows[0].count)
    };
  } catch (error) {
    console.error('Get statistics error:', error);
    return {
      total_users: 0,
      total_admins: 0,
      total_tests: 0,
      total_completed_tests: 0
    };
  }
}

module.exports = {
  pool,
  initDB,
  saveUser,
  getUser,
  updateUserActivity,
  addAdmin,
  isAdmin,
  createTest,
  saveTestAnswers,
  getTest,
  getTestAnswers,
  saveStudent,
  saveStudentAnswers,
  getStudentResults,
  getStatistics
};