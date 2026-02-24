<!-- src/components/game/StatusBar.vue -->
<template>
  <div class="status">
    <!-- Удаляем блок с названием уровня и стрелкой -->
    <!-- <div class="status__level">
      {{ store.level.title }}
      <svg width="12" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M11.8067 7.52646C11.8692 7.58844 11.9187 7.66217 11.9526 7.74341C11.9864 7.82465 12.0039 7.91179 12.0039 7.9998C12.0039 8.08781 11.9864 8.17494 11.9526 8.25618C11.9187 8.33742 11.8692 8.41116 11.8067 8.47313L6.47333 13.8065C6.41136 13.8689 6.33762 13.9185 6.25638 13.9524C6.17515 13.9862 6.08801 14.0037 6 14.0037C5.91199 14.0037 5.82485 13.9862 5.74362 13.9524C5.66238 13.9185 5.58864 13.8689 5.52667 13.8065C5.46418 13.7445 5.41459 13.6708 5.38074 13.5895C5.34689 13.5083 5.32947 13.4211 5.32947 13.3331C5.32947 13.2451 5.34689 13.158 5.38074 13.0767C5.41459 12.9955 5.46418 12.9218 5.52667 12.8598L10.3933 7.9998L5.52667 3.1398C5.40113 3.01426 5.33061 2.844 5.33061 2.66646C5.33061 2.48893 5.40113 2.31867 5.52667 2.19313C5.6522 2.0676 5.82247 1.99707 6 1.99707C6.17753 1.99707 6.3478 2.0676 6.47333 2.19313L11.8067 7.52646Z"
              fill="white"/>
      </svg>
    </div> -->

    <!-- Оставляем только счетчик прогресса (текущий/максимальный) -->
    <div class="status__score">
      <span class="current-score">{{ store.level.current }}</span>
      <span class="score-separator">/</span>
      <span class="max-score">{{ store.level.max }}</span>
    </div>
  </div>

  <div class="progress-container">
    <div class="progress-fill" :style="progressBarStyle"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, watchEffect } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { GameSettingsService } from '@/services/GameSettingsService'

const store = useGameStore()
const logger = inject('logger', console)

// Настройки для полосы прогресса
const progressSettings = ref({
  useCustomBackground: false,
  backgroundImage: '',
  backgroundColor: '',
  showNextLevelHint: false
})

// Вычисляемое свойство для полосы прогресса
const progressBarStyle = computed(() => {
  // Убедимся, что у нас есть валидное значение прогресса
  let progressValue = store.level.progress;

  // Защита от невалидных значений
  if (typeof progressValue !== 'number' || isNaN(progressValue)) {
    progressValue = 0;
    console.warn('[StatusBar] Невалидное значение прогресса, используем 0');
  }

  // Ограничиваем значение от 0 до 100
  progressValue = Math.min(Math.max(progressValue, 0), 100);

  // Логирование для отладки
  console.log(`[StatusBar] Применяем прогресс: ${progressValue}%`);

  // Настройка стилей элемента
  return {
    width: `${progressValue}%`,
    // Не меняем фон через стили, используем класс из CSS
  };
});

// Отслеживание изменений для отладки
watchEffect(() => {
  // Принудительно запрашиваем значения, чтобы Vue их отслеживал
  const progress = store.level.progress;
  const level = store.level.current;

  // Выводим в консоль для отладки
  logger.log('[StatusBar] Отслеживание - Прогресс:', progress, 'Уровень:', level);
});

// Загрузка настроек при монтировании
onMounted(async () => {
  try {
    // Загрузка настроек прогресс-бара
    const settings = await GameSettingsService.getSetting('statusBar.progress', null)
    if (settings && typeof settings === 'object') {
      progressSettings.value = {
        ...progressSettings.value,
        ...settings
      }
      logger.log('Загружены настройки прогресс-бара:', settings)
    }

    // Проверка актуальности уровней
    const customLevels = await GameSettingsService.getSetting('levelRequirements', null)
    if (customLevels && Array.isArray(customLevels) && customLevels.length > 0) {
      // Если настройки уровней еще не применены, применяем их
      if (customLevels.length !== store.level.levels.length) {
        logger.log('Обновляем настройки уровней из API')
        store.level.levels = customLevels
        store.updateLevel() // Обновляем уровень с новыми настройками
      }
    }

    // Логируем текущее состояние
    logger.log('[StatusBar] Инициализация завершена - Текущий уровень:', store.level.current, 'Прогресс:', store.level.progress);

    // Проверяем прогресс
    if (typeof store.level.progress !== 'number' || isNaN(store.level.progress)) {
      logger.warn('[StatusBar] При инициализации обнаружен невалидный прогресс, выполняем пересчет');
      store.updateLevel();
    }

    // Принудительно обновляем уровень для синхронизации
    store.updateLevel();
  } catch (error) {
    logger.error('Ошибка загрузки настроек статус-бара:', error)
  }
})
</script>

<style scoped>
.status {
  display: flex;
  justify-content: center; /* Меняем на центрирование, так как левый блок удален */
  font-size: 10px;
  color: white;
  margin-top: 10px;
  font-weight: 500;
  padding: 0 20px;
}

/* Сохраняем стили status__level для обратной совместимости */
.status__level {
  display: flex;
  align-items: center;
  gap: 4px;
}

.status__score {
  display: flex;
  gap: 3px;
}

.max-score {
  opacity: 0.5;
}

.progress-container {
  width: 92%;
  height: 12px;
  margin: 10px auto;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  position: relative; /* Добавляем позиционирование */
}

.progress-fill {
  position: absolute; /* Абсолютное позиционирование для точного контроля */
  top: 0;
  left: 0;
  height: 100%;
  width: 0%; /* Начальное значение */
  background: url('@/assets/images/progress.png');
  background-size: cover; /* Растягиваем изображение на весь элемент */
  background-repeat: no-repeat;
  background-position: left center;
  border-radius: 6px; /* Добавляем скругление для красивого отображения */
  transition: width 0.5s ease-in-out;
  will-change: width;
  transform-origin: left center; /* Элемент растет от левого края */
}
</style>