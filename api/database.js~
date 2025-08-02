// api/database.js
const { Pool } = require('pg');

// PostgreSQL connection (Vercel Postgres yoki Supabase)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initDB() {
  try {
    // Adminlar jadvali
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        username VARCHAR(255),
        full_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Testlar jadvali
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tests (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        admin_id INTEGER REFERENCES admins(id),
        open_questions_count INTEGER DEFAULT 0,
        closed_questions_count INTEGER DEFAULT 0,
        options_count INTEGER DEFAULT 4,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Test javoblari jadvali (admin kiritgan to'g'ri javoblar)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_answers (
        id SERIAL PRIMARY KEY,
        test_id INTEGER REFERENCES tests(id),
        question_number INTEGER NOT NULL,
        question_type VARCHAR(10) CHECK (question_type IN ('open', 'closed')),
        correct_answer TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // O'quvchilar jadvali
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
        percentage DECIMAL(5,2) DEFAULT 0
      )
    `);

    // O'quvchi javoblari jadvali
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_answers (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id),
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
  }
}

// Admin functions
async function addAdmin(telegramId, username, fullName) {
  try {
    const result = await pool.query(
      'INSERT INTO admins (telegram_id, username, full_name) VALUES ($1, $2, $3) RETURNING *',
      [telegramId, username, fullName]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Add admin error:', error);
    return null;
  }
}

async function isAdmin(telegramId) {
  try {
    const result = await pool.query(
      'SELECT * FROM admins WHERE telegram_id = $1',
      [telegramId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Check admin error:', error);
    return false;
  }
}

// Test functions
async function createTest(code, title, adminId, openCount, closedCount, optionsCount) {
  try {
    const result = await pool.query(
      `INSERT INTO tests (code, title, admin_id, open_questions_count, closed_questions_count, options_count)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [code, title, adminId, openCount, closedCount, optionsCount]
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

module.exports = {
  pool,
  initDB,
  addAdmin,
  isAdmin,
  createTest,
  saveTestAnswers,
  getTest,
  getTestAnswers,
  saveStudent,
  saveStudentAnswers,
  getStudentResults
};// api/auth.js - Admin autentifikatsiya
const { isAdmin } = require('./database');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { telegram_id } = req.body;

    if (!telegram_id) {
      return res.status(400).json({ error: 'Telegram ID kerak' });
    }

    const isAdminUser = await isAdmin(telegram_id);

    res.json({
      is_admin: isAdminUser,
      message: isAdminUser ? 'Admin tasdiqlandi' : 'Admin emas'
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
}

// api/create-test.js - Test yaratish
const { createTest, isAdmin } = require('./database');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      telegram_id,
      code,
      title,
      open_questions_count,
      closed_questions_count,
      options_count
    } = req.body;

    // Admin ekanligini tekshirish
    const isAdminUser = await isAdmin(telegram_id);
    if (!isAdminUser) {
      return res.status(403).json({ error: 'Admin huquqlari kerak' });
    }

    const test = await createTest(
      code,
      title,
      telegram_id,
      open_questions_count,
      closed_questions_count,
      options_count
    );

    if (test) {
      res.json({ success: true, test });
    } else {
      res.status(400).json({ error: 'Test yaratishda xatolik' });
    }
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
}

// api/save-answers.js - Admin javoblarini saqlash
const { saveTestAnswers, getTest, isAdmin } = require('./database');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { telegram_id, test_code, answers } = req.body;

    // Admin ekanligini tekshirish
    const isAdminUser = await isAdmin(telegram_id);
    if (!isAdminUser) {
      return res.status(403).json({ error: 'Admin huquqlari kerak' });
    }

    const test = await getTest(test_code);
    if (!test) {
      return res.status(404).json({ error: 'Test topilmadi' });
    }

    const success = await saveTestAnswers(test.id, answers);

    if (success) {
      res.json({ success: true, message: 'Javoblar saqlandi' });
    } else {
      res.status(400).json({ error: 'Javoblarni saqlashda xatolik' });
    }
  } catch (error) {
    console.error('Save answers error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
}

// api/get-test.js - Test ma'lumotlarini olish
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

// api/submit-test.js - Student test topshirish
const {
  getTest,
  getTestAnswers,
  saveStudent,
  saveStudentAnswers
} = require('./database');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { telegram_id, full_name, test_code, answers } = req.body;

    // Testni topish
    const test = await getTest(test_code);
    if (!test) {
      return res.status(404).json({ error: 'Test topilmadi' });
    }

    // O'quvchini saqlash
    const student = await saveStudent(telegram_id, full_name, test_code);
    if (!student) {
      return res.status(400).json({ error: 'O\'quvchini saqlashda xatolik' });
    }

    // To'g'ri javoblarni olish
    const correctAnswers = await getTestAnswers(test.id);

    // Javoblarni tekshirish
    let score = 0;
    let totalQuestions = test.open_questions_count + test.closed_questions_count;

    for (const correctAnswer of correctAnswers) {
      const key = `${correctAnswer.question_type}-${correctAnswer.question_number}`;
      const studentAnswer = answers[key];

      if (studentAnswer) {
        let isCorrect = false;

        if (correctAnswer.question_type === 'open') {
          // Ochiq savol - aniq mos kelishi kerak
          isCorrect = studentAnswer.toLowerCase().trim() === correctAnswer.correct_answer.toLowerCase().trim();
        } else {
          // Yopiq savol - variant tanlash
          isCorrect = studentAnswer === correctAnswer.correct_answer;
        }

        if (isCorrect) {
          score++;
        }
      }
    }

    // Natijani saqlash
    const success = await saveStudentAnswers(student.id, answers, score, totalQuestions);

    if (success) {
      const percentage = Math.round((score / totalQuestions) * 100);
      res.json({
        success: true,
        score,
        total: totalQuestions,
        percentage,
        message: 'Test muvaffaqiyatli topshirildi'
      });
    } else {
      res.status(400).json({ error: 'Test natijasini saqlashda xatolik' });
    }
  } catch (error) {
    console.error('Submit test error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
}

// api/get-results.js - Test natijalarini olish
const { getStudentResults, isAdmin } = require('./database');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, telegram_id } = req.query;

    if (!code || !telegram_id) {
      return res.status(400).json({ error: 'Test kodi va Telegram ID kerak' });
    }

    // Admin ekanligini tekshirish
    const isAdminUser = await isAdmin(telegram_id);
    if (!isAdminUser) {
      return res.status(403).json({ error: 'Admin huquqlari kerak' });
    }

    const results = await getStudentResults(code);

    res.json({ success: true, results });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
}

// api/export-results.js - Natijalarni CSV formatda export qilish
const { getStudentResults, isAdmin } = require('./database');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, telegram_id } = req.query;

    if (!code || !telegram_id) {
      return res.status(400).json({ error: 'Test kodi va Telegram ID kerak' });
    }

    // Admin ekanligini tekshirish
    const isAdminUser = await isAdmin(telegram_id);
    if (!isAdminUser) {
      return res.status(403).json({ error: 'Admin huquqlari kerak' });
    }

    const results = await getStudentResults(code);

    // CSV yaratish
    let csv = 'Ism Familiya,Telegram ID,Boshlagan vaqt,Tugatgan vaqt,To\'g\'ri javoblar,Umumiy savollar,Foiz\n';

    results.forEach(result => {
      csv += `"${result.full_name}",${result.telegram_id},"${result.started_at}","${result.completed_at}",${result.score},${result.total_questions},${result.percentage}%\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=test_${code}_results.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export results error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
}