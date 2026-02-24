// pages/api/stats/index.js
import dbConnect from '@/lib/dbConnect'
import User from '@/models/User'

export default async function handler(req, res) {
    await dbConnect()

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' })
    }

    try {
        // Получаем базовую статистику
        const totalUsers = await User.countDocuments()
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)

        // Активные пользователи сегодня
        const activeToday = await User.countDocuments({
            lastLogin: { $gte: today }
        })

        // Новые пользователи за неделю
        const newThisWeek = await User.countDocuments({
            registeredAt: { $gte: weekAgo }
        })

        // Общий пассивный доход всех игроков
        const totalPassiveIncome = await User.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: '$gameData.passiveIncome' }
                }
            }
        ])

        // Топ игроков по пассивному доходу
        const topPlayers = await User.find({}, {
            telegramId: 1,
            first_name: 1,
            last_name: 1,
            'gameData.passiveIncome': 1,
            'gameData.level': 1
        })
            .sort({ 'gameData.passiveIncome': -1 })
            .limit(10)

        // Средний уровень игроков
        const averageLevel = await User.aggregate([
            {
                $group: {
                    _id: null,
                    avgLevel: { $avg: '$gameData.level.current' }
                }
            }
        ])

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                activeToday,
                newThisWeek,
                totalPassiveIncome: totalPassiveIncome[0]?.total || 0,
                averageLevel: averageLevel[0]?.avgLevel || 1,
                topPlayers
            }
        })
    } catch (error) {
        res.status(400).json({ success: false, error: error.message })
    }
}