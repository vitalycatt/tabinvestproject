<!-- src/App.vue (обновленный) -->
<template>
  <NotificationsProvider>
    <div class="app">
      <!-- Компонент загрузки -->
      <Loading v-if="isLoading" @loading-complete="finishLoading"/>

      <!-- Компонент онбординга -->
      <Onboarding v-else-if="showOnboarding" @finish="finishOnboarding"/>

      <!-- Основное содержимое приложения -->
      <div v-if="!isLoading && !showOnboarding">
        <router-view v-slot="{ Component }">
          <transition mode="out-in" name="fade">
            <component :is="Component"/>
          </transition>
        </router-view>
      </div>
    </div>
  </NotificationsProvider>
</template>

<script setup>
import {onMounted, provide, ref} from 'vue';
import {useRouter} from 'vue-router';
import {useGameStore} from '../../stores/gameStore';
import {useTelegram} from '../../composables/useTelegram';
import {ApiService} from '../../services/apiService.js';
import {GameSettingsService} from '../../services/GameSettingsService.js';
import NotificationsProvider from '../../components/NotificationsProvider.vue';
import Loading from '../../components/Loading.vue';
import Onboarding from '../../components/onboarding/Onboarding.vue';

// Состояния для загрузки и онбординга
const isLoading = ref(true);
const showOnboarding = ref(false);

// Получение экземпляра хранилища
const store = useGameStore();
const router = useRouter();
const {tg, user, isAvailable, expandApp} = useTelegram();

function resetProgress() {
  if (confirm('Вы уверены, что хотите сбросить весь прогресс?')) {
    // Удаляем информацию о прохождении онбординга
    localStorage.removeItem('onboardingCompleted');

    // Вызываем метод resetGame(), который не только удаляет данные,
    // но и делает reload страницы для гарантированного сброса
    store.resetGame();
  }
}

function finishLoading() {
  isLoading.value = false;

  // Проверяем, видел ли пользователь онбординг
  const onboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true';

  if (!onboardingCompleted) {
    showOnboarding.value = true;
  }
}

function finishOnboarding() {
  console.log('Onboarding завершен, переход на главную...');
  showOnboarding.value = false;
  localStorage.setItem('onboardingCompleted', 'true');

  // Принудительно перенаправляем на главную страницу
  setTimeout(() => {
    router.push('/')
        .then(() => console.log('Успешный переход на главную'))
        .catch(err => {
          console.error('Ошибка перехода на главную:', err);
        });
  }, 100);
}

// Предоставляем логгер для отладки
const logger = {
  log: (...args) => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },
  error: (...args) => {
    console.error(...args);
  }
};

provide('logger', logger);

// Инициализация приложения
onMounted(async () => {
  // Предзагрузка ресурсов и изображений
  const preloadImages = () => {
    return new Promise((resolve) => {
      const imageUrls = [
        '/images/onboarding/1.jpg',
        '/images/onboarding/2.jpg',
        '/images/onboarding/3.jpg',
        '/images/onboarding/4.jpg',
        '/images/bg.jpg',
        '/images/bg-2.jpg',
        '/images/coin.png',
      ];

      let loadedCount = 0;

      imageUrls.forEach(url => {
        const img = new Image();
        img.onload = img.onerror = () => {
          loadedCount++;
          if (loadedCount === imageUrls.length) {
            resolve();
          }
        };
        img.src = url;
      });
    });
  };

  // Предзагрузка настроек игры
  try {
    logger.log('Предзагрузка настроек игры...');
    const gameSettings = await ApiService.getGameSettings();
    logger.log('Предзагруженные настройки игры:', gameSettings);
    if (gameSettings?.data) {
      localStorage.setItem('preloadedGameSettings', JSON.stringify(gameSettings.data));
    }
  } catch (error) {
    logger.error('Ошибка предзагрузки настроек игры:', error);
  }

  // Инициализация Telegram Web App
  if (isAvailable.value && tg.value) {
    logger.log('Telegram WebApp инициализирован');
    logger.log('Пользователь Telegram:', user.value);

    if (user.value?.id) {
      // Сохраняем ID пользователя для WebSocket соединения
      localStorage.setItem('userId', user.value.id);

      // Инициализация игрового состояния
      await store.initializeGame(user.value.id);

      // Запускаем таймер для пассивного дохода
      store.startPassiveIncomeTimer();

      // Запускаем обновление энергии
      setInterval(() => {
        store.regenerateEnergy(store.currentUser.id);
      }, 1000); // Обновление каждую секунду
    }

    // Безопасное использование методов Telegram WebApp
    try {
      // Расширяем приложение
      expandApp();

      // Безопасно пытаемся включить подтверждение закрытия
      if (tg.value && typeof tg.value.enableClosingConfirmation === 'function') {
        tg.value.enableClosingConfirmation();
      }

      // Обработка темы
      if (tg.value && tg.value.colorScheme === 'dark') {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    } catch (e) {
      logger.error('Ошибка инициализации функций Telegram WebApp:', e);
    }
  } else {
    logger.log('Запуск вне Telegram WebApp');

    // Для тестирования вне Telegram
    if (import.meta.env.DEV) {
      // Попытка загрузить настройки игры снова (на всякий случай)
      try {
        const gameSettings = await GameSettingsService.getSettings();
        logger.log('Настройки игры в режиме DEV:', gameSettings);
      } catch (error) {
        logger.error('Ошибка загрузки настроек в режиме DEV:', error);
      }

      const testUserId = '12345';
      localStorage.setItem('userId', testUserId);

      try {
        await store.initializeGame(testUserId);
        store.startPassiveIncomeTimer();

        setInterval(() => {
          store.regenerateEnergy(store.currentUser.id);
        }, 1000);
      } catch (e) {
        logger.error('Ошибка инициализации тестового режима:', e);
      }
    }
  }

  // Предзагрузка изображений
  await preloadImages();

  // После всех инициализаций через 1.5 секунды завершаем загрузку
  // Это имитация минимального времени загрузки, чтобы пользователь успел увидеть анимацию
  setTimeout(() => {
    finishLoading();
  }, 1500);
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap');

:root {
  --primary-color: #8C60E3;
  --background-color: #08070d;
  --menu-bg: #211b30;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Roboto", sans-serif;
  font-optical-sizing: auto;
  font-style: normal;
}

html, body {
  height: 100vh;
  width: 100%;
  font-family: 'Roboto', sans-serif;
  background: var(--background-color);
}

.app {
  min-height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  background: url('@/assets/images/bg.jpg') center top no-repeat;
  background-attachment: fixed;
  background-size: cover;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-input:focus {
  border-color: var(--primary-color);
  outline: none;
}

/* Стили для тёмной темы */
.dark-theme {
  --background-color: #08070d;
  --text-color: white;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --card-bg: #211b30;
  --input-bg: #333;
  --input-border: #444;
}
</style>