// src/services/userService.js
import { ApiService } from './apiService';

/**
 * Сервис для работы с пользователями
 */
export const UserService = {
    /**
     * Получение списка всех пользователей
     * @returns {Promise<Array>} - массив пользователей
     */
    async getAllUsers() {
        try {
            const response = await ApiService.getAllUsers();
            return response.users || [];
        } catch (error) {
            console.error('Error getting all users:', error);
            return [];
        }
    },

    /**
     * Получение данных пользователя по ID
     * @param {string} userId - ID пользователя
     * @returns {Promise<Object|null>} - данные пользователя или null в случае ошибки
     */
    async getUser(userId) {
        try {
            const response = await ApiService.getUser(userId);
            return response.data || null;
        } catch (error) {
            console.error(`Error getting user ${userId}:`, error);
            return null;
        }
    },

    /**
     * Блокировка/разблокировка пользователя
     * @param {string} userId - ID пользователя
     * @returns {Promise<boolean>} - результат операции
     */
    async toggleUserBlock(userId) {
        try {
            await ApiService.blockUser(userId);
            return true;
        } catch (error) {
            console.error(`Error toggling block for user ${userId}:`, error);
            return false;
        }
    },

    /**
     * Сброс прогресса пользователя
     * @param {string} userId - ID пользователя
     * @returns {Promise<boolean>} - результат операции
     */
    async resetUserProgress(userId) {
        try {
            await ApiService.resetUserProgress(userId);
            return true;
        } catch (error) {
            console.error(`Error resetting progress for user ${userId}:`, error);
            return false;
        }
    },

    /**
     * Обновление данных пользователя
     * @param {string} userId - ID пользователя
     * @param {Object} userData - новые данные пользователя
     * @returns {Promise<Object|null>} - обновленные данные пользователя или null в случае ошибки
     */
    async updateUser(userId, userData) {
        try {
            const response = await ApiService.updateUser(userId, userData);
            return response.data || null;
        } catch (error) {
            console.error(`Error updating user ${userId}:`, error);
            return null;
        }
    }
};

/**
 * Получение статистики пользователей
 * @param {Array} users - массив пользователей
 * @returns {Object} - объект статистики
 */
export const getUsersStats = (users) => {
    try {
        // Проверка, является ли users массивом
        if (!users || !Array.isArray(users)) {
            console.warn('getUsersStats: users is not an array', users);
            return {
                total: 0,
                activeToday: 0,
                newThisWeek: 0,
                totalIncome: 0
            };
        }

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);

        // Подсчет активных пользователей сегодня
        const activeToday = users.filter(user => {
            if (!user.lastLogin) return false;
            const lastLogin = new Date(user.lastLogin);
            return lastLogin >= todayStart;
        }).length;

        // Подсчет новых пользователей на этой неделе
        const newThisWeek = users.filter(user => {
            if (!user.registeredAt) return false;
            const registeredAt = new Date(user.registeredAt);
            return registeredAt >= weekAgo;
        }).length;

        // Расчет общего дохода
        const totalIncome = users.reduce((sum, user) => {
            return sum + (user.passiveIncome || 0);
        }, 0);

        return {
            total: users.length,
            activeToday,
            newThisWeek,
            totalIncome
        };
    } catch (error) {
        console.error('Error getting users stats:', error);
        return {
            total: 0,
            activeToday: 0,
            newThisWeek: 0,
            totalIncome: 0
        };
    }
};

/**
 * Поиск пользователей по запросу
 * @param {Array} users - массив пользователей
 * @param {string} query - поисковый запрос
 * @returns {Array} - отфильтрованный массив пользователей
 */
export const searchUsers = (users, query) => {
    if (!users || !Array.isArray(users) || !query) {
        return users || [];
    }

    const searchQuery = query.toLowerCase();

    return users.filter(user =>
        user.name?.toLowerCase().includes(searchQuery) ||
        user.id?.toString().includes(searchQuery) ||
        user.username?.toLowerCase().includes(searchQuery)
    );
};

/**
 * Форматирование денежных значений
 * @param {number} value - значение
 * @returns {string} - отформатированное значение
 */
export const formatMoney = (value) => {
    if (value === undefined || value === null) return '0';

    const num = Number(value);

    if (isNaN(num)) return '0';

    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    }

    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }

    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }

    return Math.floor(num).toString();
};