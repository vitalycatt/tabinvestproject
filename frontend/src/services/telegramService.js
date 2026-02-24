// services/telegramService.js
import TelegramBot from 'node-telegram-bot-api'
import dotenv from 'dotenv'

dotenv.config()

const token = process.env.TELEGRAM_BOT_TOKEN
const bot = new TelegramBot(token, { polling: false })

export const TelegramService = {
    async sendNotification(userId, message, options = {}) {
        try {
            const defaultOptions = {
                parse_mode: 'HTML',
                disable_web_page_preview: true
            }

            const messageOptions = { ...defaultOptions, ...options }

            await bot.sendMessage(userId, message, messageOptions)
            return true
        } catch (error) {
            console.error(`Error sending notification to user ${userId}:`, error)
            return false
        }
    },

    async sendBulkNotifications(userIds, message, options = {}) {
        const results = {
            success: 0,
            failed: 0,
            failures: []
        }

        for (const userId of userIds) {
            try {
                await this.sendNotification(userId, message, options)
                results.success++
            } catch (error) {
                results.failed++
                results.failures.push({
                    userId,
                    error: error.message
                })
            }

            // Добавляем небольшую задержку между отправками, чтобы не превысить лимиты API
            await new Promise(resolve => setTimeout(resolve, 50))
        }

        return results
    },

    async sendNotificationWithKeyboard(userId, message, keyboard) {
        try {
            const options = {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: keyboard
                }
            }

            await bot.sendMessage(userId, message, options)
            return true
        } catch (error) {
            console.error(`Error sending notification with keyboard to user ${userId}:`, error)
            return false
        }
    },

    formatMessage(notification) {
        let message = ''

        if (notification.important) {
            message += '🔔 <b>ВАЖНО!</b>\n\n'
        }

        message += notification.message

        if (notification.button) {
            message += `\n\n<a href="${notification.button.url}">${notification.button.text}</a>`
        }

        return message
    }
}