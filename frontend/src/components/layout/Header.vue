<!-- src/components/layout/Header.vue -->
<template>
  <div class="header-wrapper">
    <header class="header">
      <!-- Курс монеты -->
      <div class="coin-rate">
        <div class="coin-rate__line">Курс монеты YES:</div>
        <div class="coin-rate__line">
          {{ coinRate }}
          <img src="@/assets/images/diamond.png" alt="diamond" class="coin-rate__icon">
        </div>
      </div>

      <!-- Профиль (по центру) -->
      <div class="profile-center">
        <div class="profile__avatar">
          <img
            v-if="user?.photo_url"
            :src="user.photo_url"
            alt="avatar"
            class="avatar-image"
          >
          <svg v-else viewBox="0 0 32 33" fill="none">
            <rect width="32" height="33" rx="8" fill="#423361" />
            <path
              d="M16.5 16.5C15.3312 16.5 14.3307 16.0839 13.4984 15.2516C12.6661 14.4193 12.25 13.4187 12.25 12.25C12.25 11.0812 12.6661 10.0807 13.4984 9.24844C14.3307 8.41615 15.3312 8 16.5 8C17.6687 8 18.6693 8.41615 19.5016 9.24844C20.3339 10.0807 20.75 11.0812 20.75 12.25C20.75 13.4187 20.3339 14.4193 19.5016 15.2516C18.6693 16.0839 17.6687 16.5 16.5 16.5Z"
              fill="#8776AA"
            />
          </svg>
        </div>
      </div>

      <!-- Доход -->
      <div class="income">
        <div>
          <div class="income__label">{{ customStrings.passiveIncome || 'Пассивный доход в месяц' }}</div>
          <div class="income__amount">{{ store.formattedPassiveIncome }}</div>
        </div>
        <img src="@/assets/images/safe.png" alt="Доход" class="income__icon">
      </div>
    </header>

    <!-- Статус и прогресс -->
    <!-- <StatusBar v-if="showStatusBar" /> -->
  </div>
</template>

<script setup>
import { ref, onMounted, inject, computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useTelegram } from '@/composables/useTelegram'
import { GameSettingsService } from '@/services/GameSettingsService';
import StatusBar from '@/components/game/StatusBar.vue'

const coinRate = ref("10.000Y - 1");

const store = useGameStore()
const { tg, user } = useTelegram()
const logger = inject('logger', console)

// Настраиваемые параметры
const customStrings = ref({
  passiveIncome: 'Пассивный доход в месяц'
})
const showStatusBar = ref(true)
const useTitlePrefix = ref(false)
const titlePrefix = ref('')

// Функция загрузки курса монеты
const loadCoinRate = async () => {
  try {
    // Чистим кэш перед загрузкой, чтобы подхватить актуальный курс
    GameSettingsService.clearCache();
    const rate = await GameSettingsService.getSetting('coinRate', '10.000Y - 1');
    coinRate.value = rate;
    logger.log('Загружен курс монеты YES:', rate);
  } catch (error) {
    logger.error('Ошибка загрузки курса монеты:', error);
  }
};

// Загрузка настроек при монтировании
onMounted(async () => {
  await loadCoinRate();

  // Подписка на обновление курса из админки
  window.addEventListener('coinRateUpdated', async () => {
    await loadCoinRate();
  });

  if (!tg.value) return;
  logger.log('Данные пользователя Telegram:', user.value);

  // Загрузка кастомных строк
  try {
    const headerStrings = await GameSettingsService.getSetting('header.strings', null);
    if (headerStrings && typeof headerStrings === 'object') {
      customStrings.value = { ...customStrings.value, ...headerStrings };
      logger.log('Загружены кастомные строки для шапки:', headerStrings);
    }
  } catch (error) {
    logger.error('Ошибка загрузки кастомных строк для шапки:', error);
  }

  // Настройка отображения статус-бара
  try {
    const statusBarVisible = await GameSettingsService.getSetting('header.showStatusBar', true);
    showStatusBar.value = statusBarVisible;
  } catch (error) {
    logger.error('Ошибка загрузки настройки отображения статус-бара:', error);
  }

  // Настройка префикса для уровня
  try {
    useTitlePrefix.value = await GameSettingsService.getSetting('header.useTitlePrefix', false);
    titlePrefix.value = await GameSettingsService.getSetting('header.titlePrefix', '');
  } catch (error) {
    logger.error('Ошибка загрузки префикса уровня:', error);
  }
});


// Отображаемое имя пользователя
const userName = computed(() => {
  if (user.value) {
    const firstName = user.value.first_name || ''
    const lastName = user.value.last_name || ''
    return `${firstName} ${lastName}`.trim()
  }
  return 'Игрок'
})

// Отображаемый заголовок уровня с учетом настроек
const displayedTitle = computed(() => {
  if (useTitlePrefix.value && titlePrefix.value) {
    return `${titlePrefix.value} ${store.level.title}`
  }
  return store.level.title
})
</script>

<style scoped>
.header-wrapper {
  width: 100%;
  margin-top: 10px;
}

.header {
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: white;
}

.profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-right: 0.5rem; /* Добавлен отступ справа */
}

.profile__avatar {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile__name {
  font-size: 14px;
  font-weight: 700;
}

.profile__level {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.income {
  display: flex;
  align-items: center;
  text-align: center;
  padding-left: 0.5rem; /* Добавлен отступ слева */
}

.income__label {
  font-size: 8px;
  font-weight: 500;
  opacity: 0.5;
}

.income__amount {
  font-size: 16px;
  font-weight: 600;
  line-height: 22px;
}

.income__icon {
  width: 40px;
  height: 40px;
  margin-left: 10px;
}

.coin-rate {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background: rgba(66, 51, 97, 0.8); /* фон плашки */
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
}

.coin-rate__text {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.9;
}


.coin-rate__icon {
  width: 14px;
  height: 14px;
}

.profile-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.coin-rate__line {
  display: flex;
  align-items: center;
  gap: 4px;
}


</style>