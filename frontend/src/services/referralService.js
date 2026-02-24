// src/services/referralService.js
import { ApiService } from './apiService';

/**
 * Сервис для работы с рефералами
 */
export const ReferralService = {
    /**
     * Получить список рефералов пользователя
     * @param {string} userId - ID пользователя
     * @returns {Promise<Array>} - список рефералов
     */
    async getReferrals(userId) {
        try {
            const response = await ApiService.getReferrals(userId);
            return response.data || [];
        } catch (error) {
            console.error('Error getting referrals:', error);
            return [];
        }
    },

    /**
     * Обновить данные реферала
     * @param {string} referralId - ID реферала
     * @param {Object} updateData - данные для обновления
     * @returns {Promise<boolean>} - результат обновления
     */
    async updateReferral(referralId, updateData) {
        try {
            await ApiService.updateReferral(referralId, updateData);
            return true;
        } catch (error) {
            console.error('Error updating referral:', error);
            return false;
        }
    },

    /**
     * Создать реферальную ссылку
     * @param {string} userId - ID пользователя
     * @param {string} botUsername - имя бота
     * @returns {string} - реферальная ссылка
     */
    createReferralLink(userId, botUsername) {
        const startCommand = `ref_${userId}`;
        return `https://t.me/${botUsername}?start=${startCommand}`;
    },

    /**
     * Создать сообщение для приглашения друга
     * @param {string} userId - ID пользователя
     * @param {string} botUsername - имя бота
     * @returns {string} - текст сообщения
     */
    createInviteMessage(userId, botUsername) {
        const referralLink = this.createReferralLink(userId, botUsername);
        return `Привет! У меня есть кое-что крутое для тебя - первая игра генерирующая пассивный доход\n\nПрисоединяйся, будем генерить доход вместе: ${referralLink}`;
    }
};