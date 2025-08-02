// api/database.js - Supabase uchun optimallashtirilgan
const { Pool } = require('pg');

// Supabase PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Supabase uchun connection pool sozlamalari
  max: 20, // maksimal connection
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Connection pool events
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// User functions
async function saveUser(telegramId, fullName, username = null) {
  const client = await pool.connect();
  try {
    // Avval mavjudligini tekshirish
    const existing = await client.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );

    if (existing.rows.length > 0) {
      // Mavjud foydalanuvchini yangilash
      const result = await client.query(
        'UPDATE users SET full_name = $2, username = $3 WHERE telegram_id = $1 RETURNING *',
        [telegramId, fullName, username]
      );
      return result.rows[0];
    }

    // Yangi foydalanuvchini qo'shish
    const result = await client.query(
      'INSERT INTO users (telegram_id, full_name, username) VALUES ($1, $2, $3) RETURNING *',
      [telegramId, fullName, username]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Save user error:', error);
    return null;
  } finally {
    client.release();
  }
}

// Admin functions
async function addAdmin(telegramId, username, fullName) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO admins (telegram_id, username, full_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (telegram_id)
       DO UPDATE SET username = EXCLUDED.username, full_name = EXCLUDED.full_name
       RETURNING *`,
      [telegramId, username, fullName]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Add admin error:', error);
    return null;
  } finally {
    client.release();
  }
}

async function isAdmin(telegramId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM admins WHERE telegram_id = $1',
      [telegramId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Check admin error:', error);
    return false;
  } finally {
    client.release();
  }
}

// Test functions
async function createTest(code, title, adminTelegramId, openCount, closedCount, optionsCount) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Admin ID ni topish
    const adminResult = await client.query(
      'SELECT id FROM admins WHERE telegram_id = $1',
      [adminTelegramId]
    );

    if (adminResult.rows.length === 0) {
      throw new Error('Admin topilmadi');
    }

    const adminId = adminResult.rows[0].id;

    // Test mavjudligini tekshirish
    const existingTest = await client.query(
      'SELECT * FROM tests WHERE code = $1',
      [code]
    );

    if (existingTest.rows.length > 0) {
      throw new Error('Bu kod bilan test allaqachon mavjud');
    }

    // Yangi test yaratish
    const result = await client.query(
      `INSERT INTO tests (code, title, admin_id, open_questions_count, closed_questions_count, options_count)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [code, title, adminId, openCount, closedCount, optionsCount]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create test error:', error);
    return null;
  } finally {
    client.release();
  }
}

async function saveTestAnswers(testId, answers) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Avvalgi javoblarni o'chirish
    await client.query('DELETE FROM test_answers WHERE test_id = $1', [testId]);

    // Yangi javoblarni saqlash
    for (const [key, value] of Object.entries(answers)) {
      const [type, number] = key.split('-');
      await client.query(
        'INSERT INTO test_answers (test_id, question_number, question_type, correct_answer) VALUES ($1, $2, $3, $4)',
        [testId, parseInt(number), type, value]
      );
    }

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Save test answers error:', error);
    return false;
  } finally {
    client.release();
  }
}

async function getTest(code) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM tests WHERE code = $1 AND is_active = true',
      [code]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Get test error:', error);
    return null;
  } finally {
    client.release();
  }
}

async function getTestAnswers(testId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM test_answers WHERE test_id = $1 ORDER BY question_type, question_number',
      [testId]
    );
    return result.rows;
  } catch (error) {
    console.error('Get test answers error:', error);
    return [];
  } finally {
    client.release();
  }
}

// Student functions
async function saveStudent(telegramId, fullName, testCode) {
  const client = await pool.connect();
  try {
    // Test mavjudligini tekshirish
    const testResult = await client.query(
      'SELECT * FROM tests WHERE code = $1 AND is_active = true',
      [testCode]
    );

    if (testResult.rows.length === 0) {
      throw new Error('Test topilmadi yoki faol emas');
    }

    // Studentni saqlash
    const result = await client.query(
      'INSERT INTO students (telegram_id, full_name, test_code) VALUES ($1, $2, $3) RETURNING *',
      [telegramId, fullName, testCode]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Save student error:', error);
    return null;
  } finally {
    client.release();
  }
}

async function saveStudentAnswers(studentId, answers, score, total) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Student javoblarini saqlash
    for (const [key, value] of Object.entries(answers)) {
      const [type, number] = key.split('-');
      await client.query(
        'INSERT INTO student_answers (student_id, question_number, question_type, student_answer) VALUES ($1, $2, $3, $4)',
        [studentId, parseInt(number), type, value]
      );
    }

    // Student natijasini yangilash
    const percentage = total > 0 ? (score / total) * 100 : 0;
    await client.query(
      'UPDATE students SET completed_at = CURRENT_TIMESTAMP, score = $1, total_questions = $2, percentage = $3 WHERE id = $4',
      [score, total, percentage, studentId]
    );

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Save student answers error:', error);
    return false;
  } finally {
    client.release();
  }
}

async function getStudentResults(testCode) {
  const client = await pool.connect();
  try {
    const result = await client.query(
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
  } finally {
    client.release();
  }
}

// Statistics functions
async function getTestStats(testCode) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
        COUNT(*) as total_participants,
        AVG(percentage) as average_percentage,
        MAX(percentage) as max_percentage,
        MIN(percentage) as min_percentage,
        COUNT(CASE WHEN percentage >= 70 THEN 1 END) as passed_count
       FROM students
       WHERE test_code = $1 AND completed_at IS NOT NULL`,
      [testCode]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Get test stats error:', error);
    return null;
  } finally {
    client.release();
  }
}

// Database health check
async function checkDatabaseHealth() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW()');
    return { healthy: true, timestamp: result.rows[0].now };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { healthy: false, error: error.message };
  } finally {
    client.release();
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  pool.end(() => {
    console.log('Database pool has ended');
    process.exit(0);
  });
});

module.exports = {
  pool,
  saveUser,
  addAdmin,
  isAdmin,
  createTest,
  saveTestAnswers,
  getTest,
  getTestAnswers,
  saveStudent,
  saveStudentAnswers,
  getStudentResults,
  getTestStats,
  checkDatabaseHealth
};