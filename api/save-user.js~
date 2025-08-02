import { saveUser, saveStudent } from './database';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { telegram_id, username, first_name, last_name, full_name, is_admin, test_code, type } = req.body;

    if (!telegram_id || !full_name) {
      return res.status(400).json({ error: 'Telegram ID va to‘liq ism kerak' });
    }

    // Foydalanuvchi turi bo‘yicha logika
    if (type === 'student') {
      // Talaba sifatida ro‘yxatdan o‘tkazish
      const student = await saveStudent(telegram_id, full_name, test_code || 'no-test');
      if (student) {
        return res.json({
          success: true,
          student,
          message: 'Talaba muvaffaqiyatli ro‘yxatdan o‘tkazildi'
        });
      } else {
        return res.status(400).json({ error: 'Talabani ro‘yxatdan o‘tkazishda xatolik' });
      }
    } else {
      // Oddiy foydalanuvchi sifatida saqlash
      const user = await saveUser(
        telegram_id,
        username,
        first_name,
        last_name,
        full_name,
        is_admin || false
      );

      if (user) {
        return res.json({
          success: true,
          user,
          message: 'Foydalanuvchi muvaffaqiyatli saqlandi'
        });
      } else {
        return res.status(400).json({ error: 'Foydalanuvchini saqlashda xatolik' });
      }
    }
  } catch (error) {
    console.error('Save user/student error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
}