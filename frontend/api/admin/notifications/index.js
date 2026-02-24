// pages/api/admin/notifications/index.js
import dbConnect from '@/lib/dbConnect'
import Notification from '@/models/Notification'
import User from '@/models/User'

export default async function handler(req, res) {
    await dbConnect()

    switch (req.method) {
        case 'GET':
            try {
                const notifications = await Notification.find({})
                    .sort({ createdAt: -1 })
                res.status(200).json({ success: true, data: notifications })
            } catch (error) {
                res.status(400).json({ success: false, error: error.message })
            }
            break

        case 'POST':
            try {
                const { type, message, important, conditions } = req.body

                // Находим целевых пользователей
                let targetQuery = {}
                if (type === 'level' && conditions.minLevel) {
                    targetQuery['gameData.level.current'] = { $gte: conditions.minLevel }
                }
                if (type === 'income' && conditions.minIncome) {
                    targetQuery['gameData.passiveIncome'] = { $gte: conditions.minIncome }
                }

                const targetUsers = await User.find(targetQuery).select('telegramId')
                const targetUserIds = targetUsers.map(user => user.telegramId)

                // Создаем уведомление
                const notification = await Notification.create({
                    type,
                    message,
                    important,
                    conditions,
                    stats: {
                        sentCount: targetUserIds.length,
                        readCount: 0,
                        targetUsers: targetUserIds
                    },
                    status: 'sent',
                    sentAt: new Date()
                })

                // Здесь можно добавить логику отправки уведомлений через Telegram Bot API
                // Пример:
                // await sendTelegramNotifications(targetUserIds, message)

                res.status(201).json({ success: true, data: notification })
            } catch (error) {
                res.status(400).json({ success: false, error: error.message })
            }
            break

        default:
            res.status(405).json({ success: false, message: 'Method not allowed' })
            break
    }
}

// pages/api/admin/notifications/[id].js
export default async function handler(req, res) {
    const { id } = req.query
    await dbConnect()

    switch (req.method) {
        case 'GET':
            try {
                const notification = await Notification.findById(id)
                if (!notification) {
                    return res.status(404).json({ success: false, message: 'Notification not found' })
                }
                res.status(200).json({ success: true, data: notification })
            } catch (error) {
                res.status(400).json({ success: false, error: error.message })
            }
            break

        case 'PUT':
            try {
                const notification = await Notification.findById(id)
                if (!notification) {
                    return res.status(404).json({ success: false, message: 'Notification not found' })
                }

                // Можно обновить только черновики или запланированные уведомления
                if (notification.status === 'sent') {
                    return res.status(400).json({
                        success: false,
                        message: 'Cannot update sent notification'
                    })
                }

                const updatedNotification = await Notification.findByIdAndUpdate(
                    id,
                    req.body,
                    { new: true }
                )
                res.status(200).json({ success: true, data: updatedNotification })
            } catch (error) {
                res.status(400).json({ success: false, error: error.message })
            }
            break

        case 'DELETE':
            try {
                const notification = await Notification.findById(id)
                if (!notification) {
                    return res.status(404).json({ success: false, message: 'Notification not found' })
                }

                if (notification.status === 'sent') {
                    return res.status(400).json({
                        success: false,
                        message: 'Cannot delete sent notification'
                    })
                }

                await notification.delete()
                res.status(200).json({ success: true, data: {} })
            } catch (error) {
                res.status(400).json({ success: false, error: error.message })
            }
            break

        default:
            res.status(405).json({ success: false, message: 'Method not allowed' })
            break
    }
}

// pages/api/admin/notifications/stats.js
export default async function handler(req, res) {
    await dbConnect()

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' })
    }

    try {
        const stats = await Notification.aggregate([
            {
                $group: {
                    _id: null,
                    totalSent: { $sum: '$stats.sentCount' },
                    totalRead: { $sum: '$stats.readCount' },
                    avgReadRate: {
                        $avg: {
                            $cond: [
                                { $gt: ['$stats.sentCount', 0] },
                                { $divide: ['$stats.readCount', '$stats.sentCount'] },
                                0
                            ]
                        }
                    }
                }
            }
        ])

        res.status(200).json({
            success: true,
            data: stats[0] || {
                totalSent: 0,
                totalRead: 0,
                avgReadRate: 0
            }
        })
    } catch (error) {
        res.status(400).json({ success: false, error: error.message })
    }
}