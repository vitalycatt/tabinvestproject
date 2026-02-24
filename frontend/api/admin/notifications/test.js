// pages/api/notifications/test.js
import dbConnect from '@/lib/dbConnect'
import { bot } from '@/services/telegramBot'
import Notification from '@/models/Notification'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        await dbConnect();

        const { message, important, button, testUserId } = req.body;

        if (!testUserId) {
            return res.status(400).json({
                success: false,
                message: 'Test user ID is required'
            });
        }

        // Создаем тестовое уведомление в базе
        const notification = await Notification.create({
            type: 'test',
            message,
            important,
            button,
            testUserId,
            status: 'sending'
        });

        // Форматируем сообщение
        let formattedMessage = '[TEST] ';
        if (important) {
            formattedMessage += '🔔 ВАЖНО!\n\n';
        }
        formattedMessage += message;

        // Подготавливаем опции для отправки
        const options = {
            parse_mode: 'HTML'
        };

        if (button && button.text && button.url) {
            options.reply_markup = {
                inline_keyboard: [[
                    {
                        text: button.text,
                        url: button.url
                    }
                ]]
            };
        }

        // Отправляем тестовое уведомление
        await bot.sendMessage(testUserId, formattedMessage, options);

        // Обновляем статус уведомления
        await Notification.findByIdAndUpdate(notification._id, {
            status: 'sent',
            sentAt: new Date(),
            'stats.sentCount': 1
        });

        res.status(200).json({
            success: true,
            data: {
                notificationId: notification._id,
                message: 'Test notification sent successfully'
            }
        });
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}