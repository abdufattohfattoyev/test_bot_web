// api/index.js - Barcha API endpoint lar bitta faylda
const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Database functions
async function initDB() {
  try {
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

    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
}

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

async function isAdmin(telegramId) {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1 AND is_admin = true',
      [telegramId]
    );
    return result.rows.length > 0;
  } catch (error) {
    return false;
  }
}

async function addAdmin(telegramId, username, fullName) {
  try {
    await pool.query(
      `INSERT INTO users (telegram_id, username, full_name, is_admin)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (telegram_id)
       DO UPDATE SET is_admin = true, username = EXCLUDED.username, full_name = EXCLUDED.full_name`,
      [telegramId, username, fullName]
    );

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

// Main handler
module.exports = async function handler(req, res) {
  const { method, url } = req;
  const urlPath = url.split('?')[0];

  try {
    // Health check
    if (urlPath === '/api/health' || urlPath === '/api/') {
      const result = await pool.query('SELECT NOW()');

      // Check tables
      const tables = await pool.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'
      `);

      const tableNames = tables.rows.map(row => row.table_name);
      const requiredTables = ['users', 'admins', 'tests', 'test_answers', 'students', 'student_answers'];
      const missingTables = requiredTables.filter(table => !tableNames.includes(table));

      return res.json({
        success: true,
        status: 'healthy',
        database: {
          connected: true,
          current_time: result.rows[0].now,
          tables: {
            existing: tableNames,
            missing: missingTables,
            all_required_exist: missingTables.length === 0
          }
        },
        api_version: '2.1.0',
        timestamp: new Date().toISOString()
      });
    }

    // Initialize database
    if (urlPath === '/api/init' && method === 'POST') {
      const success = await initDB();

      // Add main admin if successful
      if (success) {
        await addAdmin(973358587, 'FATTOYEVABDUFATTOH', 'АБДУФАТТОҲ ФАТТОЕВ');
      }

      return res.json({
        success,
        message: success ? 'Ma\'lumotlar bazasi muvaffaqiyatli sozlandi' : 'Ma\'lumotlar bazasini sozlashda xatolik'
      });
    }

    // Save user
    if (urlPath === '/api/save-user' && method === 'POST') {
      const { telegram_id, username, first_name, last_name, full_name, is_admin } = req.body;

      if (!telegram_id) {
        return res.status(400).json({ error: 'Telegram ID kerak' });
      }

      const user = await saveUser(telegram_id, username, first_name, last_name, full_name, is_admin);

      if (user) {
        return res.json({ success: true, user, message: 'Foydalanuvchi muvaffaqiyatli saqlandi' });
      } else {
        return res.status(400).json({ error: 'Foydalanuvchini saqlashda xatolik' });
      }
    }

    // Auth check
    if (urlPath === '/api/auth' && method === 'POST') {
      const { telegram_id } = req.body;

      if (!telegram_id) {
        return res.status(400).json({ error: 'Telegram ID kerak' });
      }

      const isAdminUser = await isAdmin(telegram_id);
      const userResult = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegram_id]);
      const user = userResult.rows[0];

      return res.json({
        is_admin: isAdminUser,
        user: user,
        message: isAdminUser ? 'Admin tasdiqlandi' : 'Oddiy foydalanuvchi'
      });
    }

    // Get user
    if (urlPath === '/api/get-user' && method === 'GET') {
      const telegram_id = req.query.telegram_id;

      if (!telegram_id) {
        return res.status(400).json({ error: 'Telegram ID kerak' });
      }

      const result = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegram_id]);
      const user = result.rows[0];

      if (user) {
        // Update activity
        await pool.query('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE telegram_id = $1', [telegram_id]);

        return res.json({ success: true, user, message: 'Foydalanuvchi ma\'lumotlari olindi' });
      } else {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
      }
    }

    // Create test
    if (urlPath === '/api/create-test' && method === 'POST') {
      const { telegram_id, code, title, open_questions_count, closed_questions_count, options_count } = req.body;

      const isAdminUser = await isAdmin(telegram_id);
      if (!isAdminUser) {
        return res.status(403).json({ error: 'Admin huquqlari kerak' });
      }

      try {
        const result = await pool.query(
          'INSERT INTO tests (code, title, admin_id, open_questions_count, closed_questions_count, options_count) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [code, title, telegram_id, open_questions_count, closed_questions_count, options_count]
        );

        return res.json({ success: true, test: result.rows[0] });
      } catch (error) {
        return res.status(400).json({ error: 'Test yaratishda xatolik' });
      }
    }

    // Save test answers
    if (urlPath === '/api/save-answers' && method === 'POST') {
      const { telegram_id, test_code, answers } = req.body;

      const isAdminUser = await isAdmin(telegram_id);
      if (!isAdminUser) {
        return res.status(403).json({ error: 'Admin huquqlari kerak' });
      }

      const testResult = await pool.query('SELECT * FROM tests WHERE code = $1', [test_code]);
      const test = testResult.rows[0];

      if (!test) {
        return res.status(404).json({ error: 'Test topilmadi' });
      }

      try {
        // Delete previous answers
        await pool.query('DELETE FROM test_answers WHERE test_id = $1', [test.id]);

        // Save new answers
        for (const [key, value] of Object.entries(answers)) {
          const [type, number] = key.split('-');
          await pool.query(
            'INSERT INTO test_answers (test_id, question_number, question_type, correct_answer) VALUES ($1, $2, $3, $4)',
            [test.id, parseInt(number), type, value]
          );
        }

        return res.json({ success: true, message: 'Javoblar saqlandi' });
      } catch (error) {
        return res.status(400).json({ error: 'Javoblarni saqlashda xatolik' });
      }
    }

    // Get test
    if (urlPath === '/api/get-test' && method === 'GET') {
      const code = req.query.code;

      if (!code) {
        return res.status(400).json({ error: 'Test kodi kerak' });
      }

      const result = await pool.query('SELECT * FROM tests WHERE code = $1 AND is_active = true', [code]);
      const test = result.rows[0];

      if (test) {
        return res.json({ success: true, test });
      } else {
        return res.status(404).json({ error: 'Test topilmadi' });
      }
    }

    // Submit test
    if (urlPath === '/api/submit-test' && method === 'POST') {
      const { telegram_id, full_name, test_code, answers } = req.body;

      // Get test
      const testResult = await pool.query('SELECT * FROM tests WHERE code = $1', [test_code]);
      const test = testResult.rows[0];

      if (!test) {
        return res.status(404).json({ error: 'Test topilmadi' });
      }

      // Save student
      const studentResult = await pool.query(
        'INSERT INTO students (telegram_id, full_name, test_code) VALUES ($1, $2, $3) RETURNING *',
        [telegram_id, full_name, test_code]
      );
      const student = studentResult.rows[0];

      // Get correct answers
      const correctAnswersResult = await pool.query(
        'SELECT * FROM test_answers WHERE test_id = $1 ORDER BY question_type, question_number',
        [test.id]
      );
      const correctAnswers = correctAnswersResult.rows;

      // Calculate score
      let score = 0;
      const totalQuestions = test.open_questions_count + test.closed_questions_count;

      for (const correctAnswer of correctAnswers) {
        const key = `${correctAnswer.question_type}-${correctAnswer.question_number}`;
        const studentAnswer = answers[key];

        if (studentAnswer) {
          let isCorrect = false;

          if (correctAnswer.question_type === 'open') {
            // Open question - exact match
            isCorrect = studentAnswer.toLowerCase().trim() === correctAnswer.correct_answer.toLowerCase().trim();
          } else {
            // Closed question - option selection
            isCorrect = studentAnswer === correctAnswer.correct_answer;
          }

          if (isCorrect) {
            score++;
          }

          // Save student answer
          await pool.query(
            'INSERT INTO student_answers (student_id, question_number, question_type, student_answer, is_correct) VALUES ($1, $2, $3, $4, $5)',
            [student.id, correctAnswer.question_number, correctAnswer.question_type, studentAnswer, isCorrect]
          );
        }
      }

      const percentage = Math.round((score / totalQuestions) * 100);

      // Update student result
      await pool.query(
        'UPDATE students SET completed_at = CURRENT_TIMESTAMP, score = $1, total_questions = $2, percentage = $3 WHERE id = $4',
        [score, totalQuestions, percentage, student.id]
      );

      return res.json({
        success: true,
        score,
        total: totalQuestions,
        percentage,
        message: 'Test muvaffaqiyatli topshirildi'
      });
    }

    // Get results
    if (urlPath === '/api/get-results' && method === 'GET') {
      const { code, telegram_id } = req.query;

      if (!code || !telegram_id) {
        return res.status(400).json({ error: 'Test kodi va Telegram ID kerak' });
      }

      const isAdminUser = await isAdmin(telegram_id);
      if (!isAdminUser) {
        return res.status(403).json({ error: 'Admin huquqlari kerak' });
      }

      const results = await pool.query(
        `SELECT s.*,
                COALESCE(s.score, 0) as score,
                COALESCE(s.total_questions, 0) as total_questions,
                COALESCE(s.percentage, 0) as percentage
         FROM students s
         WHERE s.test_code = $1 AND s.completed_at IS NOT NULL
         ORDER BY s.percentage DESC, s.completed_at ASC`,
        [code]
      );

      return res.json({ success: true, results: results.rows });
    }

    // Statistics
    if (urlPath === '/api/statistics' && method === 'GET') {
      const telegram_id = req.query.telegram_id;

      if (!telegram_id) {
        return res.status(400).json({ error: 'Telegram ID kerak' });
      }

      const isAdminUser = await isAdmin(telegram_id);
      if (!isAdminUser) {
        return res.status(403).json({ error: 'Admin huquqlari kerak' });
      }

      const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
      const totalAdmins = await pool.query('SELECT COUNT(*) FROM users WHERE is_admin = true');
      const totalTests = await pool.query('SELECT COUNT(*) FROM tests');
      const totalStudents = await pool.query('SELECT COUNT(*) FROM students WHERE completed_at IS NOT NULL');

      return res.json({
        success: true,
        statistics: {
          total_users: parseInt(totalUsers.rows[0].count),
          total_admins: parseInt(totalAdmins.rows[0].count),
          total_tests: parseInt(totalTests.rows[0].count),
          total_completed_tests: parseInt(totalStudents.rows[0].count)
        },
        message: 'Statistika olindi'
      });
    }

    // Default response
    return res.status(404).json({ error: 'Endpoint topilmadi' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Server xatosi', details: error.message });
  }
};