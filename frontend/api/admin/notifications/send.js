// pages/api/notifications/send.js
import dbConnect from '@/lib/dbConnect'
import User from '@/models/User'
import Notification from '@/models/Notification'
import { bot } from '@/services/telegramBot'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        })
    }

    try {
        await dbConnect()

        const { type, message, important, conditions } = req.body

        // Находим целевых пользователей
        let query = {}
        if (type === 'level' && conditions?.minLevel) {
            query['gameData.level.current'] = { $gte: conditions.minLevel }
        }
        if (type === 'income' && conditions?.minIncome) {
            query['gameData.passiveIncome'] = { $gte: conditions.minIncome }
        }

        const users = await User.find(query).select('telegramId')

        // Создаем запись о уведомлении
        const notification = await Notification.create({
            type,
            message,
            important,
            conditions,
            stats: {
                targetCount: users.length,
                sentCount: 0,
                readCount: 0
            }
        })

        // Отправляем уведомления через Telegram
        let successCount = 0
        let failedCount = 0

        for (const user of users) {
            try {
                // Форматируем сообщение
                let formattedMessage = important ? '🔔 ВАЖНО!\n\n' : ''
                formattedMessage += message

                // Отправляем сообщение
                await bot.sendMessage(user.telegramId, formattedMessage, {
                    parse_mode: 'HTML'
                })
                successCount++
            } catch (error) {
                console.error(`Failed to send notification to ${user.telegramId}:`, error)
                failedCount++
            }

            // Добавляем небольшую задержку между отправками
            await new Promise(resolve => setTimeout(resolve, 50))
        }

        // Обновляем статистику
        await Notification.findByIdAndUpdate(notification._id, {
            'stats.sentCount': successCount,
            'stats.failedCount': failedCount,
            status: 'sent'
        })

        res.status(200).json({
            success: true,
            data: {
                notificationId: notification._id,
                targetCount: users.length,
                successCount,
                failedCount
            }
        })
    } catch (error) {
        console.error('Error sending notifications:', error)
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
}