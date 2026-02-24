import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

function flattenGameData(prefix, obj, result = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const path = `${prefix}.${key}`;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      flattenGameData(path, value, result);
    } else {
      result[path] = value;
    }
  }
  return result;
}

export default async function handler(req, res) {
  await dbConnect();

  const { telegramId } = req.query;

  if (!telegramId) {
    return res.status(400).json({ success: false, error: 'Не передан telegramId' });
  }

  try {
    if (req.method === 'GET') {
      const user = await User.findOne({ telegramId });
      if (!user) {
        return res.status(404).json({ success: false, error: 'Пользователь не найден' });
      }
      return res.status(200).json({ success: true, data: user });
    }

    if (req.method === 'PATCH') {
      const { gameData } = req.body;

      if (!gameData || typeof gameData !== 'object') {
        return res.status(400).json({ success: false, error: 'Недостаточные параметры' });
      }

      const updateFields = flattenGameData('gameData', gameData);
      updateFields['gameData.forceReload'] = true;

      if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ success: false, error: 'Нет данных для обновления' });
      }

      const updatedUser = await User.findOneAndUpdate(
        { telegramId },
        { $set: updateFields },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ success: false, error: 'Пользователь не найден' });
      }

      return res.status(200).json({
        success: true,
        message: 'Данные пользователя обновлены',
        data: updatedUser.gameData
      });
    }

    return res.status(405).json({ success: false, error: 'Метод не поддерживается' });
  } catch (error) {
    console.error('Ошибка в /api/admin/users/[telegramId]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
