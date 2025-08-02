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