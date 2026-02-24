// src/services/storage.js

/**
 * Сервис для работы с localStorage
 */
export const StorageService = {
  /**
   * Сохранение состояния в localStorage
   * @param {Object} state - состояние для сохранения
   */
  saveState(state) {
    try {
      // Проверяем и исправляем состояние перед сохранением
      const validatedState = this._validateState(state);

      const stateString = JSON.stringify(validatedState);
      localStorage.setItem("gameState", stateString);

      // Создаем минимальную резервную копию
      const fallbackState = {
        balance: validatedState.balance || 0,
        passiveIncome: validatedState.passiveIncome || 0,
        energy: {
          current: validatedState.energy?.current || 0,
          max: validatedState.energy?.max || 1000,
          regenRate: validatedState.energy?.regenRate || 1,
          lastRegenTime: validatedState.energy?.lastRegenTime || Date.now(),
        },
        userId: validatedState.userId || validatedState.currentUser,
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem("gameStateFallback", JSON.stringify(fallbackState));

      return true;
    } catch (error) {
      console.error("Error saving state to localStorage:", error);

      // Пытаемся сохранить только минимальные данные в случае ошибки
      try {
        const minimalState = {
          balance: state?.balance || 0,
          userId: state?.userId || state?.currentUser,
          lastSaved: new Date().toISOString(),
        };
        localStorage.setItem("gameStateFallback", JSON.stringify(minimalState));
      } catch (e) {
        console.error("Critical error saving minimal state:", e);
      }

      return false;
    }
  },

  /**
   * Загрузка состояния из localStorage
   * @returns {Object|null} - загруженное состояние или null в случае ошибки
   */
  loadState() {
    try {
      const stateString = localStorage.getItem("gameState");
      if (!stateString) return null;

      const state = JSON.parse(stateString);

      // Проверяем корректность загруженных данных
      if (typeof state !== "object" || state === null) {
        console.warn("Некорректные данные в localStorage:", state);
        return this._loadFallbackState();
      }

      // Проверяем и исправляем критические поля
      return this._validateState(state);
    } catch (error) {
      console.error("Error loading state from localStorage:", error);
      return this._loadFallbackState();
    }
  },

  /**
   * Загрузка резервной копии состояния
   * @returns {Object|null} - резервная копия состояния или null
   * @private
   */
  _loadFallbackState() {
    try {
      const fallbackString = localStorage.getItem("gameStateFallback");
      if (fallbackString) {
        console.log("Попытка восстановления из резервной копии");
        const fallbackState = JSON.parse(fallbackString);
        return this._validateState(fallbackState);
      }
    } catch (e) {
      console.error("Ошибка загрузки из резервной копии:", e);
    }
    return null;
  },

  /**
   * Очистка состояния в localStorage
   */
  clearState() {
    try {
      localStorage.removeItem("gameState");
      localStorage.removeItem("gameStateFallback");
      console.log("Данные состояния игры успешно удалены");
      return true;
    } catch (error) {
      console.error("Error clearing state from localStorage:", error);
      return false;
    }
  },

  /**
   * Сохранение данных пользователя для админ-панели
   * @param {Object} userData - данные пользователя для сохранения
   */
  saveAdminUser(userData) {
    try {
      localStorage.setItem("isAdmin", "true");
      localStorage.setItem("adminUser", JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error("Error saving admin user to localStorage:", error);
      return false;
    }
  },

  /**
   * Загрузка данных пользователя для админ-панели
   * @returns {Object|null} - данные пользователя или null в случае ошибки
   */
  loadAdminUser() {
    try {
      const isAdmin = localStorage.getItem("isAdmin");
      if (isAdmin !== "true") return null;

      const userString = localStorage.getItem("adminUser");
      if (!userString) return { isAdmin: true };

      return { ...JSON.parse(userString), isAdmin: true };
    } catch (error) {
      console.error("Error loading admin user from localStorage:", error);
      return null;
    }
  },

  /**
   * Очистка данных пользователя для админ-панели
   */
  clearAdminUser() {
    try {
      localStorage.removeItem("isAdmin");
      localStorage.removeItem("adminUser");
      return true;
    } catch (error) {
      console.error("Error clearing admin user from localStorage:", error);
      return false;
    }
  },

  /**
   * Сохранение настроек игры
   * @param {Object} settings - настройки игры
   */
  saveSettings(settings) {
    try {
      localStorage.setItem("gameSettings", JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error("Error saving settings to localStorage:", error);
      return false;
    }
  },

  /**
   * Загрузка настроек игры
   * @returns {Object|null} - настройки игры или null в случае ошибки
   */
  loadSettings() {
    try {
      const settingsString = localStorage.getItem("gameSettings");
      if (!settingsString) return null;
      return JSON.parse(settingsString);
    } catch (error) {
      console.error("Error loading settings from localStorage:", error);
      return null;
    }
  },

  /**
   * Проверяет и исправляет критические поля в состоянии
   * @param {Object} state - состояние для проверки
   * @returns {Object} - исправленное состояние
   * @private
   */
  _validateState(state) {
    if (!state) return {};

    const validatedState = { ...state };

    // Проверяем данные энергии
    if (validatedState.energy) {
      // Проверяем lastRegenTime на корректность
      if (
        !validatedState.energy.lastRegenTime ||
        isNaN(validatedState.energy.lastRegenTime) ||
        validatedState.energy.lastRegenTime > Date.now() + 60000
      ) {
        // Не более минуты в будущее
        console.warn(
          "Некорректное значение lastRegenTime, устанавливаем текущее время",
        );
        validatedState.energy.lastRegenTime = Date.now();
      }

      // Проверяем другие поля энергии
      validatedState.energy.current =
        Number(validatedState.energy.current) || 0;
      validatedState.energy.max = Number(validatedState.energy.max) || 1000;
      validatedState.energy.regenRate =
        Number(validatedState.energy.regenRate) || 1;
    } else {
      validatedState.energy = {
        current: 1000,
        max: 1000,
        regenRate: 1,
        lastRegenTime: Date.now(),
      };
    }

    // Проверяем инвестиции
    if (validatedState.investments) {
      if (!Array.isArray(validatedState.investments.purchased)) {
        validatedState.investments.purchased = [];
      }

      validatedState.investments.activeIncome =
        Number(validatedState.investments.activeIncome) || 0;

      if (
        !validatedState.investments.lastCalculation ||
        isNaN(validatedState.investments.lastCalculation)
      ) {
        validatedState.investments.lastCalculation = Date.now();
      }
    }

    // Проверяем числовые значения
    validatedState.balance = Number(validatedState.balance) || 0;
    validatedState.passiveIncome = Number(validatedState.passiveIncome) || 0;

    // Проверяем уровень
    if (validatedState.level) {
      validatedState.level.current = Number(validatedState.level.current) || 1;
      validatedState.level.max = Number(validatedState.level.max) || 10;
      validatedState.level.progress = Math.min(
        Math.max(Number(validatedState.level.progress) || 0, 0),
        100,
      );

      if (!validatedState.level.title) {
        validatedState.level.title = "Пацан";
      }

      if (!Array.isArray(validatedState.level.levels)) {
        validatedState.level.levels = [];
      }
    }

    // Проверяем статистику
    if (!validatedState.stats || typeof validatedState.stats !== "object") {
      validatedState.stats = {
        totalClicks: 0,
        totalEarned: 0,
        maxPassiveIncome: 0,
      };
    }

    // Добавляем timestamp последнего сохранения, если отсутствует
    if (!validatedState.lastSaved) {
      validatedState.lastSaved = new Date().toISOString();
    }

    return validatedState;
  },
};
