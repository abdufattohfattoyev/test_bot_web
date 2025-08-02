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