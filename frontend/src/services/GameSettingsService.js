// src/services/GameSettingsService.js
import { ApiService } from './apiService';

/**
 * Сервис для работы с настройками игры
 */
export const GameSettingsService = {
    /**
     * Кэш настроек для предотвращения лишних запросов
     */
    _settings: null,

    /**
     * Дефолтные настройки (используются при ошибке сервера)
     */
_defaultSettings: {
    tapValue: 1,
    baseEnergy: 1000,
    energyRegenRate: 1,
    incomeMultiplier: 1,
    expMultiplier: 1,
    boosts: { 
        tap3xCost: 8000,
        tap5xCost: 25000,
        duration: 86400000
    },
    investments: { 
        baseReturn: 1.5,
        levelMultiplier: 1.2
    },
    levelRequirements: [ 
        { level: 1, income: 0, title: 'Пацан' },
        { level: 2, income: 10000, title: 'Курьер' },
        { level: 3, income: 70000, title: 'Темщик' },
        { level: 4, income: 150000, title: 'Продавец' },
        { level: 5, income: 300000, title: 'Сотрудник' },
        { level: 6, income: 800000, title: 'Менеджер' },
        { level: 7, income: 1800000, title: 'Владелец' },
        { level: 8, income: 20000000, title: 'Аристократ' },
        { level: 9, income: 200000000, title: 'Инвестор' },
        { level: 10, income: 2500000000, title: 'Миллиардер' }
    ],
    coinRate: '10.000Y - 1' // ✅ добавляем курс монеты
},


    /**
     * Получение настроек игры из API
     * @returns {Promise<Object>} - настройки игры
     */
    async getSettings() {
        try {
            // Если настройки уже были загружены, используем их
            if (this._settings) {
                return this._settings;
            }

            // Пытаемся загрузить предварительно загруженные настройки из localStorage
            const preloaded = localStorage.getItem('preloadedGameSettings');
            if (preloaded) {
                try {
                    this._settings = JSON.parse(preloaded);
                    return this._settings;
                } catch (e) {
                    console.error('Error parsing preloaded settings:', e);
                }
            }

            // Загружаем настройки из API
            const response = await ApiService.getGameSettings();
            if (response && response.data) {
                this._settings = response.data;
                localStorage.setItem('preloadedGameSettings', JSON.stringify(this._settings));
                return this._settings;
            }

            throw new Error('Invalid settings response format');
        } catch (error) {
            console.error('Error loading game settings:', error);
            // Возвращаем дефолтные настройки в случае ошибки
            return {...this._defaultSettings};
        }
    },

    /**
     * Сброс кэша настроек (для обновления)
     */
    clearCache() {
        this._settings = null;
        localStorage.removeItem('preloadedGameSettings');
    },

    /**
     * Получение значения определенной настройки
     * @param {string} path - Путь к настройке (например, "boosts.tap3xCost")
     * @param {any} defaultValue - Значение по умолчанию, если настройка не найдена
     * @returns {Promise<any>} - Значение настройки
     */
    async getSetting(path, defaultValue = null) {
        const settings = await this.getSettings();
        const pathParts = path.split('.');

        let current = settings;
        for (const part of pathParts) {
            if (current === undefined || current === null) {
                return defaultValue;
            }
            current = current[part];
        }

        return current !== undefined ? current : defaultValue;
    },

    /**
     * Синхронное получение значения настройки (использует кэш)
     * @param {string} path - Путь к настройке (например, "boosts.tap3xCost")
     * @param {any} defaultValue - Значение по умолчанию, если настройка не найдена
     * @returns {any} - Значение настройки
     */
    getSettingSync(path, defaultValue = null) {
        try {
            // Пытаемся использовать кэш
            if (this._settings) {
                const pathParts = path.split('.');
                let current = this._settings;

                for (const part of pathParts) {
                    if (current === undefined || current === null) {
                        return defaultValue;
                    }
                    current = current[part];
                }

                return current !== undefined ? current : defaultValue;
            }

            // Если кэш пуст, используем локальное хранилище
            const preloaded = localStorage.getItem('preloadedGameSettings');
            if (preloaded) {
                try {
                    const settings = JSON.parse(preloaded);
                    const pathParts = path.split('.');
                    let current = settings;

                    for (const part of pathParts) {
                        if (current === undefined || current === null) {
                            return defaultValue;
                        }
                        current = current[part];
                    }

                    return current !== undefined ? current : defaultValue;
                } catch (e) {
                    // В случае ошибки парсинга, используем значение по умолчанию
                }
            }

            // Если все методы не сработали, ищем в дефолтных настройках
            const pathParts = path.split('.');
            let current = this._defaultSettings;

            for (const part of pathParts) {
                if (current === undefined || current === null) {
                    return defaultValue;
                }
                current = current[part];
            }

            return current !== undefined ? current : defaultValue;
        } catch (error) {
            console.error('Error getting sync setting:', error);
            return defaultValue;
        }
    }
};

export default GameSettingsService;