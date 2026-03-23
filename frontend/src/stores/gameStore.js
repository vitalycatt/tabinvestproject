// src/stores/gameStore.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { StorageService } from "@/services/storage";
import { ApiService, fetchUserFromServer } from "@/services/apiService";
import { GameSettingsService } from "@/services/GameSettingsService";

export const useGameStore = defineStore("game", {
  state: () => {
    const currentUser = ref({ id: null });
    const gameData = ref(null);
    const gameSettings = ref(null);

    // Дефолтные настройки из сервиса
    const tapValue = GameSettingsService.getSettingSync("tapValue", 1);
    const baseEnergy = GameSettingsService.getSettingSync("baseEnergy", 100);
    const incomeMultiplier = GameSettingsService.getSettingSync(
      "incomeMultiplier",
      1
    );
    const levelRequirements = GameSettingsService.getSettingSync(
      "levelRequirements",
      [
        { level: 1, income: 0, title: "Пацан" },
        { level: 2, income: 10000, title: "Курьер" },
        { level: 3, income: 70000, title: "Темщик" },
        { level: 4, income: 150000, title: "Продавец" },
        { level: 5, income: 300000, title: "Сотрудник" },
        { level: 6, income: 800000, title: "Менеджер" },
        { level: 7, income: 1800000, title: "Владелец" },
        { level: 8, income: 20000000, title: "Аристократ" },
        { level: 9, income: 200000000, title: "Инвестор" },
        { level: 10, income: 2500000000, title: "Миллиардер" },
      ]
    );

    return {
      // Основная валюта
      balance: 0,
      passiveIncome: 0,
      tutorialCompleted: false,

      // Состояние синхронизации
      isSynced: false, // <--- вот сюда

      // Система энергии
      energy: {
        current: baseEnergy,
        max: baseEnergy,
        lastRegenTime: Date.now(),
      },

      // Система уровней
      level: {
        current: 1,
        max: 10,
        progress: 0,
        title: levelRequirements[0].title,
        levels: levelRequirements,
      },

      // Множители и бусты
      multipliers: {
        tapValue: tapValue,
        tapMultiplier: 1,
        incomeBoost: incomeMultiplier,
      },

      // Настройки бустов
      boostSettings: {
        tap3xCost: GameSettingsService.getSettingSync("boosts.tap3xCost", 8000),
        tap5xCost: GameSettingsService.getSettingSync(
          "boosts.tap5xCost",
          25000
        ),
        duration: GameSettingsService.getSettingSync(
          "boosts.duration",
          24 * 60 * 60 * 1000
        ),
      },

      // Активные бусты
      boosts: {
        tap3x: {
          active: false,
          endTime: null,
        },
        tap5x: {
          active: false,
          endTime: null,
        },
      },

      // Инвестиции
      investments: {
        purchased: [],
        activeIncome: 0,
        lastCalculation: Date.now(),
      },

      // Статистика
      stats: {
        totalClicks: 0,
        totalEarned: 0,
        maxPassiveIncome: 0,
      },

      // Данные пользователя и настройки игры
      currentUser,
      gameData,
      gameSettings,

      // Таймеры
      _passiveIncomeTimerId: null,
      _updateLevelTimerId: null,
      _autoSaveTimerId: null,
    };
  },

  getters: {
    // Безопасное получение ID пользователя (currentUser может быть ref или объект/число)
    currentUserId: (state) => {
      const u = state.currentUser?.value ?? state.currentUser;
      if (u == null) return null;
      if (typeof u === "object" && u !== null && "id" in u && u.id != null)
        return u.id;
      if (typeof u === "number") return u;
      return null;
    },
    formattedBalance: (state) => {
      return state.formatBigNumber(state.balance);
    },
    formattedPassiveIncome: (state) => {
      return "+" + state.formatBigNumber(state.passiveIncome) + "/мес";
    },
    formattedEnergy: (state) => {
      return `${Math.max(0, Math.floor(state.energy.current))} / ${state.energy.max}`;
    },
    effectiveTapValue: (state) => {
      return state.multipliers.tapValue * state.multipliers.tapMultiplier;
    },
    canTap: (state) => {
      return state.energy.current >= 1;
    },
  },

  actions: {
    async syncFromServer(userId) {
      try {
        const fresh = await fetchUserFromServer(userId);
        const gd = fresh.gameData;
        if (!gd || typeof gd !== "object") {
          throw new Error("Некорректные данные с сервера");
        }

        console.log(`Sync from server user-id: ${userId}`);
        this.currentUser = { id: userId };

        // Обновляем состояние из сервера
        this.balance = Number(gd.balance ?? this.balance ?? 0);
        this.passiveIncome = Number(
          gd.passiveIncome ?? this.passiveIncome ?? 0
        );

        if (gd.energy) Object.assign(this.energy, gd.energy);
        if (gd.investments) Object.assign(this.investments, gd.investments);

        // Сохраняем локально
        const stateToSave = {
          userId,
          balance: this.balance,
          passiveIncome: this.passiveIncome,
          energy: this.energy,
          investments: this.investments,
          lastSaved: new Date().toISOString(),
        };

        StorageService.saveState(stateToSave);
        this.isSynced = true;

        console.log("Синхронизация с сервером успешна:", this.balance);
      } catch (e) {
        console.error("Ошибка синхронизации с сервером:", e);

        const savedState = StorageService.loadState();
        if (savedState) {
          this.balance = Number(savedState.balance ?? this.balance);
          this.passiveIncome = Number(
            savedState.passiveIncome ?? this.passiveIncome
          );

          if (savedState.energy) Object.assign(this.energy, savedState.energy);
          if (savedState.investments)
            Object.assign(this.investments, savedState.investments);
        }

        this.isSynced = false;
      }
    },

    // Опционально: метод для ручного сохранения
    saveToLocalStorage() {
      const userId = this.currentUserId;
      if (!userId) {
        console.error(
          "Невозможно сохранить состояние: пользователь не определен"
        );
        return;
      }
      const stateToSave = {
        userId,
        balance: this.balance,
        passiveIncome: this.passiveIncome,
        energy: this.energy,
        investments: this.investments,
        lastSaved: new Date().toISOString(),
      };
      StorageService.saveState(stateToSave);
    },

    // Обработка нажатия (тапа) - добавляем этот метод, он отсутствовал
    async handleTap(userId) {
      // Проверяем, достаточно ли энергии
      if (this.energy.current < 1) {
        console.log("[handleTap] Недостаточно энергии");
        return 0;
      }

      const gameData = await ApiService.tap(userId);

      console.log(gameData);

      this.energy = gameData.energy;
      if (this.energy.current < 0) this.energy.current = 0;
      this.balance = gameData.balance;

      // // Уменьшаем энергию на 1
      // this.energy.current -= 1;
      //
      // // Рассчитываем награду
      const reward = gameData.multipliers.tapValue;
      //
      // // Увеличиваем баланс
      // this.balance += reward;
      //
      // // Увеличиваем счетчики статистики
      this.stats.totalClicks++;
      this.stats.totalEarned += reward;
      //
      // // Логируем изменения
      // console.log(`[handleTap] Клик выполнен. Получено ${reward} монет. Баланс: ${this.balance}, энергия: ${this.energy.current}`);
      //
      // // Сохраняем состояние
      // this.saveState();

      return reward;
    },

    completeTutorial() {
      this.tutorialCompleted = true;
      this.saveState();
    },

    // Обновленный метод initializeGame
    async initializeGame(userId) {
      if (!userId) {
        console.warn("No user ID provided for game initialization");
        return;
      }

      try {
        console.log("Initializing game for user:", userId);

        // Загружаем настройки игры
        try {
          const gameSettings = await GameSettingsService.getSettings();
          console.log("Loaded game settings:", gameSettings);
          this.gameSettings = gameSettings;

          // Применяем настройки
          this.applyGameSettings(gameSettings);
        } catch (error) {
          console.error("Error loading game settings:", error);
        }

        // Проверяем сначала локальное хранилище - приоритет на локальные данные для офлайн игры
        const savedState = StorageService.loadState();

        if (savedState?.userId === userId) {
          console.log(
            "Found matching state in localStorage with balance:",
            savedState.balance
          );
          this.loadFromState(savedState);
          console.log(
            "After loading from localStorage - Balance:",
            this.balance
          );

          // Сохраняем текущего пользователя
          this.currentUser = userId;

          // Обрабатываем офлайн-прогресс
          this.processOfflineProgress();

          // Запускаем автосохранение
          await this.saveState();

          // Очень важно - запускаем таймеры перед выходом из метода
          this.startPassiveIncomeTimer();

          // Дополнительный запрос на синхронизацию с сервером (в фоне)
          this.syncWithServer(userId).catch((error) => {
            console.error(
              "Error syncing with server (continuing offline):",
              error
            );
          });

          return; // Возвращаемся, если нашли данные в localStorage
        }

        // Если в localStorage ничего не нашли, загружаем с сервера
        const userData = await ApiService.getUser(userId);
        console.log("Loaded user data from server:", userData);

        if (userData?.gameData) {
          console.log(
            "User data contains gameData with balance:",
            userData.gameData.balance
          );

          // Используем данные из базы как источник правды
          this.loadFromState(userData.gameData);

          // Проверяем корректность lastRegenTime
          if (!this.energy?.lastRegenTime || isNaN(this.energy.lastRegenTime)) {
            console.warn(
              "lastRegenTime некорректно, сбрасываем на текущее время"
            );
            this.energy.lastRegenTime = Date.now();
          }

          console.log(
            "After loading from server - Balance:",
            this.balance,
            "Passive Income:",
            this.passiveIncome,
            "Energy lastRegenTime:",
            new Date(this.energy.lastRegenTime).toISOString()
          );

          // Сохраняем в localStorage для офлайн доступа
          const localStorageData = {
            ...userData.gameData,
            userId,
            lastSaved: new Date().toISOString(),
          };

          // Убедимся, что данные всегда правильно структурированы перед сохранением
          if (!localStorageData.energy) {
            localStorageData.energy = {
              current: this.energy.current,
              max: this.energy.max,
              lastRegenTime: this.energy.lastRegenTime,
            };
          }

          if (!localStorageData.stats) {
            localStorageData.stats = this.stats;
          }

          const savedToLocal = StorageService.saveState(localStorageData);
          console.log(
            "Saved to localStorage:",
            savedToLocal ? "success" : "failed"
          );
        } else {
          console.warn("No gameData in user data or user data is empty");

          // Используем дефолтные значения и сохраняем их
          this.currentUser = userId;
          await this.saveState();

          console.log("Created new user data with defaults");
        }

        this.currentUser = userId;
        this.processOfflineProgress();
        await this.saveState();
      } catch (error) {
        console.error("Error initializing game:", error);
        // Попробуем использовать данные из localStorage если есть
        const savedState = StorageService.loadState();
        if (savedState?.userId === userId) {
          this.loadFromState(savedState);
        }
      }
    },

    // Добавляем метод для синхронизации с сервером
    async syncWithServer(userId) {
      try {
        // Получаем данные с сервера
        const userData = await ApiService.getUser(userId);

        if (userData?.gameData) {
          // Сравниваем баланс и пассивный доход для принятия решения о синхронизации
          const serverBalance = Number(userData.gameData.balance || 0);
          const serverPassiveIncome = Number(
            userData.gameData.passiveIncome || 0
          );

          console.log(
            "Server data check - Balance:",
            serverBalance,
            "Local:",
            this.balance
          );
          console.log(
            "Server data check - Income:",
            serverPassiveIncome,
            "Local:",
            this.passiveIncome
          );

          // Если разница значительная и сервер имеет больше, используем серверные данные
          if (
            serverBalance > this.balance + 1000 ||
            serverPassiveIncome > this.passiveIncome + 1000
          ) {
            console.log(
              "Server data is significantly better, syncing from server"
            );
            this.loadFromState(userData.gameData);
            await this.saveState();
          } else if (
            this.balance > serverBalance + 1000 ||
            this.passiveIncome > serverPassiveIncome + 1000
          ) {
            // Если локальные данные лучше, отправляем их на сервер
            console.log(
              "Local data is significantly better, syncing to server"
            );
            await this.saveState();
          }
        }
      } catch (error) {
        console.error("Error syncing with server:", error);
      }
    },

    resetState() {
      console.log("Сброс состояния...");

      // Используем правильный ключ для localStorage
      StorageService.clearState?.(); // Это вызовет очистку через StorageService
      localStorage.removeItem("gameState"); // Теперь используем правильный ключ

      // Сброс состояния Pinia
      this.$reset();

      console.log("Прогресс сброшен");
    },

    // Обновленный метод saveState
    async saveState() {
      if (!this.currentUser) {
        console.warn(
          "Невозможно сохранить состояние: пользователь не определен"
        );
        return false;
      }

      try {
        // Экономим трафик и предотвращаем частые запросы
        const now = Date.now();
        if (this._lastSaveTime && now - this._lastSaveTime < 3000) {
          // Уменьшаем до 3 секунд
          console.log("Сохранение пропущено: слишком частый вызов");
          return false;
        }
        this._lastSaveTime = now;

        // Убедимся, что данные энергии корректны
        if (!this.energy.lastRegenTime || isNaN(this.energy.lastRegenTime)) {
          this.energy.lastRegenTime = now;
        }

        console.log(
          "Сохранение состояния. Текущий баланс:",
          this.balance,
          "Пассивный доход:",
          this.passiveIncome,
          "Энергия:",
          this.energy.current
        );

        // Создаем упрощенную структуру для сохранения в БД
        const minimalData = {
          gameData: {
            balance: Number(this.balance) || 0,
            passiveIncome: Number(this.passiveIncome) || 0,
            energy: {
              current: Number(this.energy.current) || 0,
              max: Number(this.energy.max) || 100,
              lastRegenTime: Number(this.energy.lastRegenTime) || Date.now(),
            },
            level: {
              current: Number(this.level.current) || 1,
              progress: Number(this.level.progress) || 0,
              title: String(this.level.title || "Новичок"),
            },
            // Включаем важные статистические данные
            stats: {
              totalClicks: Number(this.stats.totalClicks) || 0,
              totalEarned: Number(this.stats.totalEarned) || 0,
            },
            // Включаем урезанную версию инвестиций (только список без деталей)
            investments: {
              purchased: this.investments.purchased.map((item) => ({
                id: item.id,
                type: item.type,
                level: item.level,
                income: item.income,
              })),
              activeIncome: Number(this.investments.activeIncome) || 0,
              lastCalculation: this.investments.lastCalculation || Date.now(),
            },
          },
          lastLogin: new Date().toISOString(),
        };

        // Создаем структуру для сохранения в localStorage
        const localStorageData = {
          balance: Number(this.balance) || 0,
          passiveIncome: Number(this.passiveIncome) || 0,
          energy: {
            current: Number(this.energy.current) || 0,
            max: Number(this.energy.max) || 100,
            lastRegenTime: Number(this.energy.lastRegenTime) || Date.now(),
          },
          level: {
            current: Number(this.level.current) || 1,
            max: Number(this.level.max) || 10,
            progress: Number(this.level.progress) || 0,
            title: String(this.level.title || "Новичок"),
            levels: this.level.levels || [],
          },
          multipliers: this.multipliers,
          boosts: this.boosts,
          investments: {
            purchased: JSON.parse(
              JSON.stringify(this.investments.purchased || [])
            ),
            activeIncome: Number(this.investments.activeIncome) || 0,
            lastCalculation: Date.now(),
          },
          stats: this.stats,
          userId: this.currentUser,
          lastSaved: new Date().toISOString(),
        };

        // Сохраняем в localStorage с проверкой успешности
        const localSaved = StorageService.saveState(localStorageData);
        console.log(
          "Сохранение в localStorage:",
          localSaved ? "успешно" : "ошибка",
          "Баланс:",
          localStorageData.balance
        );

        // Добавляем резервное сохранение на случай ошибки
        if (!localSaved) {
          console.warn(
            "Основное сохранение не удалось, используем резервное сохранение"
          );
          try {
            localStorage.setItem(
              "gameStateFallback",
              JSON.stringify({
                balance: this.balance,
                passiveIncome: this.passiveIncome,
                energy: this.energy,
                userId: this.currentUser, // Добавляем userId в резервную копию
                lastSaved: new Date().toISOString(),
              })
            );
          } catch (e) {
            console.error("Ошибка резервного сохранения:", e);
          }
        }

        // Сохраняем только самое необходимое на сервер
        const userId = this.currentUserId;
        if (!userId) {
          console.warn("Сохранение на сервер пропущено: userId не определен");
          return localSaved;
        }
        try {
          // Используем прямой подход для простоты отладки
          const API_BASE = import.meta.env.DEV
            ? ""
            : import.meta.env.VITE_API_BASE || "https://tabinvestproject.ru";
          const response = await fetch(
            `${API_BASE}/api/admin/users/${userId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(minimalData),
            }
          );

          if (response.ok) {
            console.log(
              "Базовые данные успешно сохранены на сервере. Баланс:",
              minimalData.gameData.balance
            );
            return true;
          } else {
            const errorText = await response.text();
            console.error("Ошибка сохранения:", errorText);
            return false;
          }
        } catch (error) {
          console.error("Критическая ошибка при сохранении на сервер:", error);

          // Но в любом случае локальное сохранение прошло успешно, возвращаем true
          return localSaved;
        }
      } catch (error) {
        console.error("Критическая ошибка при сохранении:", error);
        // Пытаемся сохранить fallback данные при критической ошибке
        try {
          localStorage.setItem(
              "gameStateFallback",
              JSON.stringify({
                balance: this.balance,
                passiveIncome: this.passiveIncome,
                energy: {
                  current: this.energy.current,
                  max: this.energy.max,
                  lastRegenTime: Date.now(),
                },
                userId: this.currentUser,
                lastSaved: new Date().toISOString(),
              })
            );
        } catch (e) {
          console.error("Ошибка резервного сохранения:", e);
        }
        return false;
      }
    },

    async fullSave() {
      // Этот метод вызывается реже и сохраняет все данные, включая инвестиции
      const userId = this.currentUserId;
      if (!userId) return false;

      console.log(
        "Выполняется полное сохранение данных. Текущий баланс:",
        this.balance
      );

      try {
        const fullData = {
          gameData: {
            balance: Number(this.balance) || 0,
            passiveIncome: Number(this.passiveIncome) || 0,
            energy: {
              current: Number(this.energy.current) || 0,
              max: Number(this.energy.max) || 100,
              lastRegenTime: Number(this.energy.lastRegenTime) || Date.now(),
            },
            level: {
              current: Number(this.level.current) || 1,
              progress: Number(this.level.progress) || 0,
              title: String(this.level.title || "Новичок"),
            },
            investments: {
              purchased: JSON.parse(
                JSON.stringify(this.investments.purchased || [])
              ),
              activeIncome: Number(this.investments.activeIncome) || 0,
              lastCalculation: Date.now(),
            },
            stats: this.stats,
          },
          lastLogin: new Date().toISOString(),
        };

        // Сохраняем также в localStorage
        StorageService.saveState({
          balance: this.balance,
          passiveIncome: this.passiveIncome,
          energy: this.energy,
          level: this.level,
          multipliers: this.multipliers,
          boosts: this.boosts,
          investments: {
            purchased: JSON.parse(
              JSON.stringify(this.investments.purchased || [])
            ),
            activeIncome: Number(this.investments.activeIncome) || 0,
            lastCalculation: Date.now(),
          },
          stats: this.stats,
          userId: this.currentUser,
          lastSaved: new Date().toISOString(),
        });

        const API_BASE = import.meta.env.DEV
          ? ""
          : import.meta.env.VITE_API_BASE || "https://tabinvestproject.ru";
        const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(fullData),
        });

        if (response.ok) {
          console.log(
            "Полное сохранение успешно. Баланс:",
            fullData.gameData.balance
          );
          return true;
        } else {
          console.error("Ошибка полного сохранения на сервер");
          return false;
        }
      } catch (error) {
        console.error("Ошибка полного сохранения:", error);
        return false;
      }
    },

    // Метод для прямого сохранения базовых данных
    async directSaveBasics() {
      const userId = this.currentUserId;
      if (!userId) {
        console.warn("Невозможно сохранить данные: пользователь не определен");
        return false;
      }

      try {
        console.log("Выполняем прямое сохранение базовых данных...");

        // Сохраняем в localStorage всегда
        StorageService.saveState({
          balance: this.balance,
          passiveIncome: this.passiveIncome,
          energy: this.energy,
          level: this.level,
          multipliers: this.multipliers,
          boosts: this.boosts,
          investments: {
            purchased: JSON.parse(
              JSON.stringify(this.investments.purchased || [])
            ),
            activeIncome: Number(this.investments.activeIncome) || 0,
            lastCalculation: Date.now(),
          },
          stats: this.stats,
          userId: this.currentUser,
          lastSaved: new Date().toISOString(),
        });

        // Супер-минимальный объект без investments
        const basicData = {
          gameData: {
            balance: Number(this.balance) || 0,
            passiveIncome: Number(this.passiveIncome) || 0,
            level: {
              current: Number(this.level.current) || 1,
              progress: Number(this.level.progress) || 0,
              title: String(this.level.title || "Новичок"),
            },
            // Важно: НЕ включаем investments вообще
          },
          lastLogin: new Date().toISOString(),
        };

        // Прямой запрос к серверу, минуя ApiService (в dev — относительный URL через прокси)
        const API_BASE = import.meta.env.DEV
          ? ""
          : import.meta.env.VITE_API_BASE || "https://tabinvestproject.ru";
        const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(basicData),
        });

        // Проверяем ответ
        if (response.ok) {
          console.log("Базовые данные успешно сохранены через прямой запрос");
          return true;
        } else {
          const errorText = await response.text();
          console.error("Ошибка прямого сохранения:", errorText);
          return false;
        }
      } catch (error) {
        console.error("Критическая ошибка при прямом сохранении:", error);
        return false;
      }
    },

    // Добавляем метод saveGameData для совместимости с нашими предыдущими изменениями
    async saveGameData() {
      // Первым делом сохраняем текущее состояние
      const localSaved = await this.saveState();

      // Затем делаем полное сохранение с небольшой задержкой
      setTimeout(() => {
        this.fullSave();
      }, 300);

      return localSaved;
    },

    // Обновленный метод loadFromState
    loadFromState(state) {
      console.log("Loading state with data:", state);

      try {
        // Устанавливаем значения с проверкой типов
        this.balance = Number(state.balance) || 0;
        this.passiveIncome = Number(state.passiveIncome) || 0;

        // Обновляем остальные данные, если они есть
        if (state.energy) {
          // Проверяем lastRegenTime на корректность
          const lastRegenTime = Number(state.energy.lastRegenTime);

          const NEW_MAX_ENERGY = 100;
          let loadedMax = Number(state.energy.max) || this.energy.max;
          let loadedCurrent = Number(state.energy.current) || this.energy.current;

          if (loadedMax > NEW_MAX_ENERGY) {
            loadedMax = NEW_MAX_ENERGY;
          }
          if (loadedCurrent > loadedMax) {
            loadedCurrent = loadedMax;
          }

          this.energy = {
            current: Math.max(0, loadedCurrent),
            max: loadedMax,
            lastRegenTime:
              !isNaN(lastRegenTime) && lastRegenTime <= Date.now()
                ? lastRegenTime
                : Date.now(),
          };
        }

        if (state.level) {
          this.level = {
            current: Number(state.level.current) || this.level.current,
            max: Number(state.level.max) || this.level.max,
            progress: Number(state.level.progress) || this.level.progress,
            title: state.level.title || this.level.title,
            levels: state.level.levels || this.level.levels,
          };
        }

        if (state.multipliers) this.multipliers = state.multipliers;
        if (state.boosts) this.boosts = state.boosts;

        // Глубокое копирование для инвестиций
        if (state.investments) {
          this.investments = {
            purchased: state.investments.purchased
              ? JSON.parse(JSON.stringify(state.investments.purchased))
              : [],
            activeIncome: Number(state.investments.activeIncome) || 0,
            lastCalculation:
              Number(state.investments.lastCalculation) || Date.now(),
          };
        }

        if (state.stats) this.stats = state.stats;

        // Если передан userId, сохраняем его в currentUser
        if (state.userId) {
          this.currentUser = state.userId;
        }

        console.log(
          "State loaded successfully, balance:",
          this.balance,
          "passive income:",
          this.passiveIncome,
          "energy lastRegenTime:",
          new Date(this.energy.lastRegenTime).toISOString(),
          "currentUser:",
          this.currentUser
        );
      } catch (error) {
        console.error("Error in loadFromState:", error);
        // В случае ошибки обеспечиваем корректные значения по умолчанию
        if (!this.energy || !this.energy.lastRegenTime) {
          this.energy = this.energy || {};
          this.energy.lastRegenTime = Date.now();
        }
      }
    },

    resetToDefault() {
      const baseEnergy = GameSettingsService.getSettingSync("baseEnergy", 100);
      const tapValue = GameSettingsService.getSettingSync("tapValue", 1);
      const levelRequirements = GameSettingsService.getSettingSync(
        "levelRequirements",
        []
      );

      this.balance = 0;
      this.passiveIncome = 0;
      this.energy = {
        current: baseEnergy,
        max: baseEnergy,
        lastRegenTime: Date.now(),
      };
      this.level = {
        current: 1,
        max: 10,
        progress: 0,
        title:
          levelRequirements.length > 0 ? levelRequirements[0].title : "Пацан",
        levels: levelRequirements,
      };
      this.multipliers = {
        tapValue: tapValue,
        tapMultiplier: 1,
        incomeBoost: GameSettingsService.getSettingSync("incomeMultiplier", 1),
      };
      this.boosts = {
        tap3x: { active: false, endTime: null },
        tap5x: { active: false, endTime: null },
      };
      this.investments = {
        purchased: [],
        activeIncome: 0,
        lastCalculation: Date.now(),
      };
      this.stats = {
        totalClicks: 0,
        totalEarned: 0,
        maxPassiveIncome: 0,
      };
    },

    // Применение настроек из API
    applyGameSettings(settings) {
      if (!settings) return;

      // Применяем основные настройки
      if (settings.tapValue !== undefined) {
        this.multipliers.tapValue = settings.tapValue;
      }

      if (settings.baseEnergy !== undefined) {
        this.energy.max = settings.baseEnergy;
        if (this.energy.current > this.energy.max) {
          this.energy.current = this.energy.max;
        }
      }

      if (settings.incomeMultiplier !== undefined) {
        this.multipliers.incomeBoost = settings.incomeMultiplier;
      }

      // Применяем настройки бустов
      if (settings.boosts) {
        this.boostSettings = {
          ...this.boostSettings,
          ...settings.boosts,
        };
      }

      // Применяем уровни, если они определены в настройках
      if (settings.levelRequirements && settings.levelRequirements.length > 0) {
        this.level.levels = settings.levelRequirements;
        // Обновляем текущий уровень и заголовок на основе новых требований
        this.updateLevel();
      }
    },

    formatBigNumber(num) {
      if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + "B";
      }
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + "M";
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K";
      }
      return Math.floor(num).toString();
    },

    // Обновленный метод обработки пассивного дохода
    processPassiveIncome() {
      if (this.passiveIncome > 0) {
        const monthInSeconds = 30 * 24 * 60 * 60;
        const incomePerSecond = this.passiveIncome / monthInSeconds;

        // Сохраняем предыдущее значение для проверки изменения
        const previousBalance = this.balance;

        // Начисляем доход (10 раз в секунду)
        this.balance += incomePerSecond / 10;

        // Периодически обновляем уровень, но не каждый тик для производительности
        // Обновляем каждые 5 секунд или при значительном изменении баланса
        const now = Date.now();
        if (
          !this._lastPassiveUpdate ||
          now - this._lastPassiveUpdate > 5000 ||
          Math.abs(this.balance - previousBalance) > 1000
        ) {
          this.updateLevel();
          this._lastPassiveUpdate = now;
        }
      }
    },

    // Обновленный метод запуска таймера пассивного дохода
    // Модифицируем метод startPassiveIncomeTimer в gameStore.js, добавив таймер для восстановления энергии

    startPassiveIncomeTimer() {
      // Очищаем предыдущие таймеры, если они были
      if (this._passiveIncomeTimerId) clearInterval(this._passiveIncomeTimerId);
      if (this._updateLevelTimerId) clearInterval(this._updateLevelTimerId);
      if (this._autoSaveTimerId) clearInterval(this._autoSaveTimerId);

      // Сразу вызываем updateLevel при запуске таймера
      this.updateLevel();

      // Проверяем суточную регенерацию энергии при старте
      this.checkDailyEnergyRegen();

      // Запускаем обработку пассивного дохода и сохраняем ID
      this._passiveIncomeTimerId = setInterval(() => {
        this.processPassiveIncome();
      }, 100);

      // Обновляем уровень каждые 10 секунд
      this._updateLevelTimerId = setInterval(() => {
        this.updateLevel();
      }, 10000);

      // Автосохранение каждые 30 секунд
      this._autoSaveTimerId = setInterval(() => {
        this.saveState();
      }, 30000);

      console.log("Запущены таймеры пассивного дохода");
    },

    // Метод остановки таймеров
    // Также нужно модифицировать метод stopPassiveIncomeTimer, чтобы он останавливал таймер энергии

    stopPassiveIncomeTimer() {
      if (this._passiveIncomeTimerId) {
        clearInterval(this._passiveIncomeTimerId);
        this._passiveIncomeTimerId = null;
      }

      if (this._updateLevelTimerId) {
        clearInterval(this._updateLevelTimerId);
        this._updateLevelTimerId = null;
      }

      if (this._autoSaveTimerId) {
        clearInterval(this._autoSaveTimerId);
        this._autoSaveTimerId = null;
      }

      console.log("Остановлены таймеры пассивного дохода");
    },

    async buyInvestment(userId, investmentId) {
      const data = await ApiService.buyInvestment(userId, investmentId);

      this.passiveIncome = data.passiveIncome;
      this.balance = data.balance;

      return data;
    },

    checkDailyEnergyRegen() {
      const now = Date.now();
      const REGEN_INTERVAL = 24 * 60 * 60 * 1000;
      const elapsed = now - (this.energy.lastRegenTime || 0);

      if (elapsed >= REGEN_INTERVAL) {
        console.log("[checkDailyEnergyRegen] Прошло 24+ часа, пополняем энергию до максимума");
        this.energy.current = this.energy.max;
        this.energy.lastRegenTime = now;
      }
    },

    applyBoost(type, customDuration = null) {
      const now = Date.now();
      // Используем продолжительность из настроек или предоставленную продолжительность
      const duration =
        customDuration || this.boostSettings?.duration || 24 * 60 * 60 * 1000;
      const endTime = now + duration;

      switch (type) {
        case "tap3x":
          this.multipliers.tapMultiplier = 3;
          this.boosts.tap3x.active = true;
          this.boosts.tap3x.endTime = endTime;
          break;
        case "tap5x":
          this.multipliers.tapMultiplier = 5;
          this.boosts.tap5x.active = true;
          this.boosts.tap5x.endTime = endTime;
          break;
      }

      setTimeout(() => {
        this.removeBoost(type);
      }, duration);

      this.saveState();
    },

    removeBoost(type) {
      switch (type) {
        case "tap3x":
          this.boosts.tap3x.active = false;
          this.boosts.tap3x.endTime = null;
          break;
        case "tap5x":
          this.boosts.tap5x.active = false;
          this.boosts.tap5x.endTime = null;
          break;
      }

      if (!this.boosts.tap3x.active && !this.boosts.tap5x.active) {
        this.multipliers.tapMultiplier = 1;
      }

      this.saveState();
    },

    upgradeEnergy(newMax) {
      this.energy.max = newMax;
      this.energy.current = newMax;
      this.saveState();
    },

    // Получение стоимости буста из настроек
    getBoostCost(type) {
      if (type === "tap3x") {
        return this.boostSettings?.tap3xCost || 8000;
      }
      if (type === "tap5x") {
        return this.boostSettings?.tap5xCost || 25000;
      }
      return 0;
    },

    // Функция для расчета следующей стоимости инвестиции (добавляем, но не используем в покупке)
    calculateNextCost(investment) {
      // Базовая стоимость
      const baseCost = investment.cost || 0;
      // Коэффициент роста цены (можно настроить)
      const costMultiplier = investment.costMultiplier || 1.5;
      // Текущий уровень
      const currentLevel = investment.level || 1;
      // Рассчитываем стоимость для следующего уровня
      return Math.round(baseCost * Math.pow(costMultiplier, 1));
    },

    // Используем рабочий метод покупки инвестиций
    purchaseInvestment(investment, calculatedIncome) {
      if (this.balance < investment.cost) {
        return false;
      }

      this.balance -= investment.cost;

      // Используем множитель дохода из настроек
      const incomeMultiplier = this.multipliers.incomeBoost || 1;
      const adjustedIncome = calculatedIncome * incomeMultiplier;

      // Проверяем существование инвестиции с таким же типом и ID
      const existingIndex = this.investments.purchased.findIndex(
        (item) => item.type === investment.type && item.id === investment.id
      );

      if (existingIndex >= 0) {
        // Обновляем существующую инвестицию
        const existingInvestment = this.investments.purchased[existingIndex];

        // Обновляем уровень и доход
        this.investments.purchased[existingIndex] = {
          ...existingInvestment,
          level: (existingInvestment.level || 1) + 1,
          income: (existingInvestment.income || 0) + adjustedIncome,
          // Обновляем дату последнего обновления
          lastUpdate: Date.now(),
        };
      } else {
        // Добавляем новую инвестицию
        this.investments.purchased.push({
          id: investment.id,
          level: investment.level,
          income: adjustedIncome,
          purchaseDate: Date.now(),
          type: investment.type,
        });
      }

      const previousPassiveIncome = this.passiveIncome;
      this.passiveIncome += adjustedIncome;

      console.log(
        `[purchaseInvestment] Пассивный доход изменен: ${previousPassiveIncome} -> ${this.passiveIncome}`
      );

      // Пересчитываем инвестиции с актуальным доходом
      this.recalculateInvestmentIncome();

      // Принудительно обновляем уровень после изменения пассивного дохода
      this.updateLevel();

      // Сохраняем состояние
      this.saveState();
      return true;
    },

    recalculateInvestmentIncome() {
      // Запоминаем предыдущее значение дохода
      const previousIncome = this.passiveIncome;

      // Пересчитываем доход
      let totalIncome = 0;
      if (this.investments && Array.isArray(this.investments.purchased)) {
        this.investments.purchased.forEach((investment) => {
          if (investment && typeof investment.income === "number") {
            totalIncome += investment.income;
          }
        });
      }

      this.passiveIncome = totalIncome;

      if (totalIncome > this.stats.maxPassiveIncome) {
        this.stats.maxPassiveIncome = totalIncome;
      }

      this.investments.activeIncome = totalIncome;
      this.investments.lastCalculation = Date.now();

      // Проверяем, изменился ли доход
      if (previousIncome !== totalIncome) {
        console.log(
          `[recalculateInvestmentIncome] Пассивный доход изменен: ${previousIncome} -> ${totalIncome}`
        );
        // Если доход изменился, обновляем уровень
        this.updateLevel();
      }
    },

    // Используем рабочий метод updateLevel
    updateLevel() {
      try {
        // Проверка на наличие данных об уровнях
        if (
          !this.level.levels ||
          !Array.isArray(this.level.levels) ||
          this.level.levels.length === 0
        ) {
          console.warn(
            "Отсутствуют данные об уровнях или некорректный формат, невозможно обновить уровень"
          );
          this.level.progress = 0; // Сбрасываем прогресс в случае ошибки
          return;
        }

        console.log(
          `[updateLevel] Начато обновление уровня. Пассивный доход: ${this.passiveIncome}`
        );

        // Устанавливаем максимальный уровень
        this.level.max = this.level.levels.length;

        // Определяем текущий уровень на основе пассивного дохода
        let newLevel = 1;
        let currentLevelIndex = 0;

        // Перебираем все уровни и находим последний, требования которого выполнены
        for (let i = 0; i < this.level.levels.length; i++) {
          // Защита от некорректных данных
          if (
            !this.level.levels[i] ||
            typeof this.level.levels[i].income !== "number"
          ) {
            console.warn(
              `[updateLevel] Некорректные данные уровня ${i + 1}:`,
              this.level.levels[i]
            );
            continue;
          }

          if (this.passiveIncome >= this.level.levels[i].income) {
            newLevel = i + 1;
            currentLevelIndex = i;
          } else {
            // Прерываем цикл, как только найден первый непройденный порог
            break;
          }
        }

        // Обновляем текущий уровень и заголовок, если уровень изменился
        if (newLevel !== this.level.current) {
          console.log(
            `[updateLevel] Уровень изменен: ${this.level.current} -> ${newLevel} (${this.level.levels[currentLevelIndex].title})`
          );
          this.level.current = newLevel;

          // Проверка наличия заголовка
          if (
            this.level.levels[currentLevelIndex] &&
            this.level.levels[currentLevelIndex].title
          ) {
            this.level.title = this.level.levels[currentLevelIndex].title;
          } else {
            this.level.title = `Уровень ${newLevel}`;
          }
        }

        // Расчет прогресса до следующего уровня
        // Если это не максимальный уровень
        if (newLevel < this.level.levels.length) {
          // Защита от выхода за границы массива
          if (
            currentLevelIndex >= 0 &&
            currentLevelIndex + 1 < this.level.levels.length
          ) {
            const currentThreshold =
              this.level.levels[currentLevelIndex].income;
            const nextThreshold =
              this.level.levels[currentLevelIndex + 1].income;
            const range = nextThreshold - currentThreshold;

            console.log(
              `[updateLevel] Расчет прогресса: доход ${this.passiveIncome}, порог текущего уровня ${currentThreshold}, порог следующего уровня ${nextThreshold}`
            );

            // Проверка на корректность порогов
            if (range <= 0) {
              console.warn(
                "[updateLevel] Ошибка в порогах уровней: текущий >= следующий"
              );
              this.level.progress = 0;
            } else {
              // Расчет процента прогресса
              const rawProgress =
                ((this.passiveIncome - currentThreshold) / range) * 100;
              // Ограничиваем значение от 0 до 100
              this.level.progress = Math.min(Math.max(rawProgress, 0), 100);
              console.log(
                `[updateLevel] Рассчитанный прогресс: ${this.level.progress.toFixed(
                  2
                )}%`
              );
            }
          } else {
            console.warn(
              "[updateLevel] Индекс уровня вне диапазона:",
              currentLevelIndex
            );
            this.level.progress = 0;
          }
        } else {
          // Если достигнут максимальный уровень
          this.level.progress = 100;
          console.log(
            "[updateLevel] Достигнут максимальный уровень, прогресс установлен на 100%"
          );
        }

        // Гарантируем, что прогресс - валидное число
        if (isNaN(this.level.progress) || this.level.progress === undefined) {
          console.warn(
            "[updateLevel] Прогресс имеет невалидное значение, сбрасываем на 0"
          );
          this.level.progress = 0;
        }

        // Сохраняем обновленное состояние, но с ограничением частоты вызовов
        // Для обновления уровня используем отдельный таймер, чтобы не конфликтовать с другими saveState вызовами
        const now = Date.now();
        if (
          !this._lastLevelUpdateSave ||
          now - this._lastLevelUpdateSave > 3000
        ) {
          console.log(
            `[updateLevel] Сохраняем состояние: уровень ${this.level.current}, прогресс ${this.level.progress}%`
          );
          this._lastLevelUpdateSave = now;
          this.saveState();
        } else {
          console.log(
            `[updateLevel] Пропускаем сохранение из-за частых вызовов`
          );
        }
      } catch (error) {
        console.error("[updateLevel] Ошибка при обновлении уровня:", error);
        // Пытаемся восстановить корректное состояние
        if (!this.level.current || isNaN(this.level.current)) {
          this.level.current = 1;
        }
        if (!this.level.progress || isNaN(this.level.progress)) {
          this.level.progress = 0;
        }
      }
    },

    // Используем рабочий метод обработки оффлайн-прогресса
    processOfflineProgress() {
      const now = Date.now();
      const lastUpdate = this.investments.lastCalculation;
      const offlineTime = (now - lastUpdate) / 1000;

      console.log(
        `[processOfflineProgress] Расчет оффлайн-прогресса: ${Math.floor(
          offlineTime
        )} сек. с момента последнего обновления`
      );

      // Начисляем офлайн доход
      const offlineIncome = Math.floor(
        (this.passiveIncome / (30 * 24 * 60 * 60)) * offlineTime
      );
      if (offlineIncome > 0) {
        this.balance += offlineIncome;
        console.log(
          `[processOfflineProgress] Начислен оффлайн-доход: ${offlineIncome} монет`
        );
      }

      // Восстанавливаем энергию, если прошло 24+ часа с последнего пополнения
      const REGEN_INTERVAL = 24 * 60 * 60 * 1000;
      const energyElapsed = now - (this.energy.lastRegenTime || 0);
      if (energyElapsed >= REGEN_INTERVAL) {
        this.energy.current = this.energy.max;
        this.energy.lastRegenTime = now;
        console.log("[processOfflineProgress] Энергия восстановлена (прошло 24+ часа)");
      }

      // Проверяем бусты
      Object.keys(this.boosts).forEach((boostKey) => {
        const boost = this.boosts[boostKey];
        if (boost.active && boost.endTime < now) {
          this.removeBoost(boostKey);
        }
      });

      this.investments.lastCalculation = now;

      // Выполняем сохранение состояния после офлайн-прогресса
      this.saveState();

      return {
        time: Math.floor(offlineTime),
        income: offlineIncome,
      };
    },

    // Метод сброса игры
    resetGame() {
      console.log("Запуск полного сброса прогресса...");

      try {
        // Остановка всех таймеров перед сбросом
        this.stopPassiveIncomeTimer();

        // 1. Сначала очищаем все данные в localStorage
        StorageService.clearState?.();
        localStorage.removeItem("gameState"); // Теперь используем правильный ключ
        localStorage.removeItem("gameStateFallback"); // Удаляем также резервную копию
        localStorage.removeItem("preloadedGameSettings");

        // 2. Сбрасываем состояние хранилища
        this.$reset();

        // 3. Если пользователь авторизован, отправляем запрос на сервер для сброса прогресса
        const userId = this.currentUserId;
        if (userId) {
          try {
            ApiService.resetUserProgress(userId);
            console.log("Отправлен запрос на сброс данных на сервере");
          } catch (e) {
            console.error("Ошибка при сбросе данных на сервере:", e);
            // Продолжаем сброс локальных данных даже при ошибке на сервере
          }
        }

        console.log("Прогресс успешно сброшен. Перезагрузка страницы...");
      } catch (e) {
        console.error("Ошибка при сбросе прогресса:", e);
      }

      // 5. Перезагружаем страницу для применения изменений
      window.location.reload();
    },
  },
});
