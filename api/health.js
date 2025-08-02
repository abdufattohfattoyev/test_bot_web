const { pool } = require('./database');

export default async function handler(req, res) {
  try {
    // Ma'lumotlar bazasi bilan bog'lanishni tekshirish
    const result = await pool.query('SELECT NOW()');

    // Jadvallar mavjudligini tekshirish
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

    const tableNames = tables.rows.map(row => row.table_name);
    const requiredTables = ['users', 'admins', 'tests', 'test_answers', 'students', 'student_answers'];
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));

    res.json({
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

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}