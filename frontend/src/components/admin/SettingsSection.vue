<!-- src/components/admin/SettingsSection.vue -->
<template>
  <div class="section-container">
  <div class="settings-section">
    <div class="section-header">
      <h2>Настройки игры</h2>
      <BaseButton type="primary" @click="saveSettings" :disabled="saving">
        {{ saving ? 'Сохранение...' : 'Сохранить настройки' }}
      </BaseButton>
    </div>

    <div class="settings-layout">
      <!-- Основные настройки -->
      <BaseCard>
        <h3>Основные настройки</h3>
        <div class="settings-grid">
          <FormGroup label="Базовая стоимость клика">
            <input
                type="number"
                v-model.number="settings.tapValue"
                class="form-input"
                min="1"
                step="1"
            />
          </FormGroup>

          <FormGroup label="Базовая энергия">
            <input
                type="number"
                v-model.number="settings.baseEnergy"
                class="form-input"
                min="100"
                step="100"
            />
          </FormGroup>

          <FormGroup label="Скорость восстановления энергии">
            <input
                type="number"
                v-model.number="settings.energyRegenRate"
                class="form-input"
                min="0.1"
                step="0.1"
            />
          </FormGroup>

          <FormGroup label="Множитель дохода">
            <input
                type="number"
                v-model.number="settings.incomeMultiplier"
                class="form-input"
                min="0.1"
                step="0.1"
            />
          </FormGroup>

          <FormGroup label="Множитель опыта">
            <input
                type="number"
                v-model.number="settings.expMultiplier"
                class="form-input"
                min="0.1"
                step="0.1"
            />
          </FormGroup>
        </div>
      </BaseCard>

            <!-- Курс монеты -->
      <BaseCard>
        <h3>Курс монеты YES</h3>
        <div class="settings-grid">
          <FormGroup label="Значение курса (пример: 10.000Y - 1)">
            <input
              type="text"
              v-model="coinRate"
              class="form-input"
            />
          </FormGroup>
        </div>
      </BaseCard>


      <!-- Настройки бустов -->
      <BaseCard>
        <h3>Настройки бустов</h3>
        <div class="settings-grid">
          <FormGroup label="Стоимость буста x3">
            <input
                type="number"
                v-model.number="boosts.tap3xCost"
                class="form-input"
                min="1000"
                step="1000"
            />
          </FormGroup>

          <FormGroup label="Стоимость буста x5">
            <input
                type="number"
                v-model.number="boosts.tap5xCost"
                class="form-input"
                min="1000"
                step="1000"
            />
          </FormGroup>

          <FormGroup label="Длительность бустов (часы)">
            <input
                type="number"
                v-model.number="boostDurationHours"
                class="form-input"
                min="1"
                step="1"
            />
          </FormGroup>
        </div>
      </BaseCard>

      <!-- Настройки инвестиций -->
      <BaseCard>
        <h3>Настройки инвестиций</h3>
        <div class="settings-grid">
          <FormGroup label="Базовая доходность инвестиций">
            <input
                type="number"
                v-model.number="investments.baseReturn"
                class="form-input"
                min="0.1"
                step="0.1"
            />
          </FormGroup>

          <FormGroup label="Множитель уровня для инвестиций">
            <input
                type="number"
                v-model.number="investments.levelMultiplier"
                class="form-input"
                min="0.1"
                step="0.1"
            />
          </FormGroup>
        </div>
      </BaseCard>

      <!-- Требования к уровням -->
      <BaseCard>
        <div class="card-header">
          <h3>Требования к уровням</h3>
          <BaseButton type="secondary" @click="addLevelRequirement">
            Добавить уровень
          </BaseButton>
        </div>

        <div class="level-requirements">
          <div
              v-for="(level, index) in levelRequirements"
              :key="index"
              class="level-item"
          >
            <div class="level-header">
              <strong>Уровень {{ level.level }}</strong>
              <button
                  v-if="index > 0"
                  class="delete-btn"
                  @click="removeLevelRequirement(index)"
              >
                &times;
              </button>
            </div>

            <FormGroup label="Название уровня">
              <input
                  type="text"
                  v-model="level.title"
                  class="form-input"
              />
            </FormGroup>

            <FormGroup label="Необходимый доход">
              <input
                  type="number"
                  v-model.number="level.income"
                  class="form-input"
                  min="0"
                  step="1000"
              />
            </FormGroup>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, watch } from 'vue';
import { useAdminStore } from '../../stores/adminStore';
import BaseCard from '../ui/BaseCard.vue';
import BaseButton from '../ui/BaseButton.vue';
import FormGroup from '../ui/FormGroup.vue';
import { ApiService } from '../../services/apiService';
import { GameSettingsService } from '@/services/GameSettingsService'

const coinRate = ref("10.000Y - 1");

const adminStore = useAdminStore();
const notifications = inject('notifications', {
  addNotification: () => {
    console.warn('Notifications provider not available');
  }
});

// Создаем отдельные реактивные переменные для каждой группы настроек
// Это предотвратит ошибки при доступе к вложенным свойствам
const settings = ref({
  tapValue: 1,
  baseEnergy: 100,
  energyRegenRate: 1,
  incomeMultiplier: 1,
  expMultiplier: 1
});

const boosts = ref({
  tap3xCost: 8000,
  tap5xCost: 25000,
  duration: 86400000 // 24 часа в миллисекундах
});

const investments = ref({
  baseReturn: 1.5,
  levelMultiplier: 1.2
});

const levelRequirements = ref([
  { level: 1, income: 0, title: 'Новичок' }
]);

const saving = ref(false);
const loading = ref(true);

// Преобразование длительности буста из миллисекунд в часы и обратно
// с защитой от null и undefined
const boostDurationHours = computed({
  get() {
    if (!boosts.value || typeof boosts.value.duration !== 'number') {
      return 24; // Возвращаем дефолтное значение
    }
    return boosts.value.duration / (1000 * 60 * 60);
  },
  set(value) {
    if (!boosts.value) boosts.value = {};
    boosts.value.duration = value * 1000 * 60 * 60;
  }
});

// Объединяем все настройки в один объект для сохранения
const getAllSettings = () => {
  return {
    ...settings.value,
    boosts: { ...boosts.value },
    investments: { ...investments.value },
    levelRequirements: [...levelRequirements.value],
    coinRate: coinRate.value // ✅ добавляем курс монеты
  };
};


// Загрузка настроек
const loadSettings = async () => {
  try {
    loading.value = true;

    // Пытаемся получить настройки с сервера
    const response = await ApiService.getGameSettings();

    // Проверяем разные форматы ответа API
    let settingsData = {};
    if (response && response.data) {
      settingsData = response.data;
    } else if (response && typeof response === 'object') {
      settingsData = response;
    }

    // Обновляем основные настройки
    if (settingsData) {
      // Основные настройки
      settings.value = {
        tapValue: settingsData.tapValue || 1,
        baseEnergy: settingsData.baseEnergy || 100,
        energyRegenRate: settingsData.energyRegenRate || 1,
        incomeMultiplier: settingsData.incomeMultiplier || 1,
        expMultiplier: settingsData.expMultiplier || 1
      };

      // Бусты
      if (settingsData.boosts) {
        boosts.value = {
          tap3xCost: settingsData.boosts.tap3xCost || 8000,
          tap5xCost: settingsData.boosts.tap5xCost || 25000,
          duration: settingsData.boosts.duration || 86400000
        };
      }

      // Курс монеты
if (settingsData.coinRate) {
  coinRate.value = settingsData.coinRate;
}


      // Инвестиции
      if (settingsData.investments) {
        investments.value = {
          baseReturn: settingsData.investments.baseReturn || 1.5,
          levelMultiplier: settingsData.investments.levelMultiplier || 1.2
        };
      }

      // Уровни
      if (Array.isArray(settingsData.levelRequirements) && settingsData.levelRequirements.length > 0) {
        levelRequirements.value = settingsData.levelRequirements;
      }

      // Обновляем админский стор
      try {
        if (adminStore && typeof adminStore.updateGameSettings === 'function') {
          adminStore.updateGameSettings(getAllSettings());
        }
      } catch (storeError) {
        console.error('Error updating admin store:', storeError);
      }
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    notifications.addNotification({
      message: 'Ошибка при загрузке настроек',
      type: 'error'
    });
  } finally {
    loading.value = false;
  }
};

// Сохранение настроек
const saveSettings = async () => {
  try {
    saving.value = true;

    // Сортируем требования к уровням по возрастанию
    levelRequirements.value.sort((a, b) => a.level - b.level);

    // Собираем все настройки в единый объект
    const allSettings = getAllSettings();

    // Отправляем на сервер
    await ApiService.updateGameSettings(allSettings);

    // после успешного PUT-запроса
    GameSettingsService.clearCache();

    // Обновляем админский стор
    try {
      if (adminStore && typeof adminStore.updateGameSettings === 'function') {
        adminStore.updateGameSettings(allSettings);
      }
    } catch (storeError) {
      console.warn('Error updating admin store:', storeError);
    }

    notifications.addNotification({
      message: 'Настройки успешно сохранены',
      type: 'success'
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    notifications.addNotification({
      message: 'Ошибка при сохранении настроек',
      type: 'error'
    });
  } finally {
    saving.value = false;
  }
};

// Добавление нового требования к уровню
const addLevelRequirement = () => {
  const nextLevel = levelRequirements.value.length + 1;
  const lastLevel = levelRequirements.value[levelRequirements.value.length - 1];

  levelRequirements.value.push({
    level: nextLevel,
    income: lastLevel?.income ? lastLevel.income * 2 : 1000, // Удваиваем доход от предыдущего уровня или ставим 1000
    title: `Уровень ${nextLevel}`
  });
};

// Удаление требования к уровню
const removeLevelRequirement = (index) => {
  if (index > 0) { // Нельзя удалить первый уровень
    levelRequirements.value.splice(index, 1);

    // Пересчитываем номера уровней
    levelRequirements.value.forEach((level, i) => {
      level.level = i + 1;
    });
  }
};

// Загрузка данных при монтировании
onMounted(async () => {
  try {
    await loadSettings();
  } catch (error) {
    console.error('Error during component initialization:', error);
    notifications.addNotification({
      message: 'Ошибка при инициализации компонента настроек',
      type: 'error'
    });
  }
});
</script>

<style scoped>


.settings-section {
  padding: 20px;
  max-height: 90vh;
  overflow-y: scroll;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.settings-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;

}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.level-requirements {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.level-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.level-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.delete-btn {
  background: #f44336;
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-input:focus {
  border-color: var(--primary-color, #8C60E3);
  outline: none;
}

@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>