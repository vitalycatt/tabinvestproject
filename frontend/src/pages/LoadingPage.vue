<!-- src/pages/LoadingPage.vue -->
<template>
  <div class="loading-container">
    <!-- Не добавляем никаких элементов поверх фона кроме прогресс-бара -->
    <div class="loading-progress">
      <div class="progress-bar">
        <div :style="{ width: `${progress}%` }" class="progress-fill"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {onMounted, onUnmounted, ref} from 'vue';
import {useRouter} from 'vue-router';
import {useGameStore} from '@/stores/gameStore';
import {useTelegram} from '@/composables/useTelegram';
import {ApiService} from '@/services/apiService';
import {GameSettingsService} from '@/services/GameSettingsService';

const router = useRouter();
const store = useGameStore();
const {tg, user, isAvailable, expandApp} = useTelegram();

const progress = ref(0);

// Переменные для хранения ID таймеров
let animationTimer;
let loadingTimeout;
let energyTimerId;
let passiveIncomeTimerId;
let saveStateTimerId;

const loadingDuration = 3000; // 3 секунды

// Инициализация приложения
async function initializeApp() {
  console.log('[LOADING] Инициализация приложения...');

  try {
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
        const totalImages = imageUrls.length;

        // Если нет изображений для предзагрузки, сразу резолвим промис
        if (totalImages === 0) {
          resolve();
          return;
        }

        imageUrls.forEach(url => {
          const img = new Image();
          img.onload = img.onerror = () => {
            loadedCount++;
            console.log(`Загружено изображение ${loadedCount}/${totalImages}: ${url}`);
            if (loadedCount === totalImages) {
              console.log('Все изображения загружены');
              resolve();
            }
          };
          img.src = url;
        });

        // На всякий случай резолвим промис через 5 секунд, даже если не все загрузились
        setTimeout(() => {
          if (loadedCount < totalImages) {
            console.log(`Тайм-аут загрузки изображений, загружено ${loadedCount}/${totalImages}`);
            resolve();
          }
        }, 5000);
      });
    };

    // Предзагрузка настроек игры
    console.log('Предзагрузка настроек игры...');
    const gameSettingsPromise = ApiService.getGameSettings()
        .then(gameSettings => {
          console.log('Предзагруженные настройки игры:', gameSettings);
          if (gameSettings?.data) {
            localStorage.setItem('preloadedGameSettings', JSON.stringify(gameSettings.data));
          }
        })
        .catch(error => {
          console.error('Ошибка предзагрузки настроек игры:', error);
        });

    // Инициализация Telegram Web App
    if (isAvailable.value && tg.value) {
      console.log('Telegram WebApp инициализирован');
      console.log('Пользователь Telegram:', user.value);

      if (user.value?.id) {
        // Сохраняем ID пользователя для WebSocket соединения
        localStorage.setItem('userId', user.value.id);

        // Инициализация игрового состояния
        await store.initializeGame(user.value.id);

        // Запускаем таймер для пассивного дохода
        store.startPassiveIncomeTimer();

        // Запускаем обновление энергии с сохранением ID таймера
        energyTimerId = setInterval(() => {
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
        console.error('Ошибка инициализации функций Telegram WebApp:', e);
      }
    } else {
      console.log('Запуск вне Telegram WebApp');

      // Для тестирования вне Telegram
      if (import.meta.env.DEV) {
        // Попытка загрузить настройки игры снова (на всякий случай)
        try {
          const gameSettings = await GameSettingsService.getSettings();
          console.log('Настройки игры в режиме DEV:', gameSettings);
        } catch (error) {
          console.error('Ошибка загрузки настроек в режиме DEV:', error);
        }

        try {
          await store.initializeGame(store.currentUser.id);
          store.startPassiveIncomeTimer();

          // Запускаем обновление энергии с сохранением ID таймера
          energyTimerId = setInterval(async () => {
            if (store.gameData.energy.current < store.gamedata.energy.max) {
              await store.regenerateEnergy(store.currentUser.id);
            }
          }, 1000);
        } catch (e) {
          console.error('Ошибка инициализации тестового режима:', e);
        }
      }
    }

    // Предзагрузка изображений параллельно с другими операциями
    console.log('Начинаем предзагрузку изображений');
    await Promise.all([gameSettingsPromise, preloadImages()]);
    console.log('Все ресурсы загружены');

    // Отмечаем, что приложение загружено
    localStorage.setItem('appLoaded', 'true');

    return true;
  } catch (error) {
    console.error('Ошибка инициализации приложения:', error);
    // В случае ошибки все равно считаем приложение загруженным, но с ошибкой
    localStorage.setItem('appLoaded', 'true');
    return false;
  }
}

function completeLoading() {
  console.log('[LOADING] Загрузка завершена');

  // Проверяем, завершен ли онбординг
  const onboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true';

  // Переходим или на онбординг, или сразу на главную
  if (onboardingCompleted) {
    console.log('[LOADING] Онбординг ранее пройден, переходим на главную');
    router.replace('/');
  } else {
    console.log('[LOADING] Онбординг не пройден, переходим на онбординг');
    router.replace('/onboarding');
  }
}

onMounted(async () => {
  console.log('[LOADING] Компонент загрузки смонтирован');

  // Запускаем анимацию прогресса независимо от инициализации приложения
  const startTime = Date.now();
  const endTime = startTime + loadingDuration;

  const updateProgress = () => {
    const now = Date.now();
    const elapsed = now - startTime;
    const percentage = Math.min(100, (elapsed / loadingDuration) * 100);

    progress.value = Math.floor(percentage);

    if (now < endTime) {
      // Продолжаем анимацию
      animationTimer = requestAnimationFrame(updateProgress);
    } else {
      // Анимация завершена, прогресс 100%
      progress.value = 100;
    }
  };

  // Параллельно инициализируем приложение
  initializeApp();

  // Запускаем анимацию прогресса
  animationTimer = requestAnimationFrame(updateProgress);

  // Устанавливаем таймер для завершения загрузки через фиксированное время
  loadingTimeout = setTimeout(() => {
    completeLoading();
  }, loadingDuration + 500); // Добавляем 500мс для завершения анимации
});

onUnmounted(() => {
  console.log('[LOADING] Компонент загрузки размонтирован');

  // Очищаем все таймеры
  clearTimeout(loadingTimeout);

  if (animationTimer) {
    cancelAnimationFrame(animationTimer);
  }

  // Очищаем таймеры игры
  if (energyTimerId) clearInterval(energyTimerId);
  if (passiveIncomeTimerId) clearInterval(passiveIncomeTimerId);
  if (saveStateTimerId) clearInterval(saveStateTimerId);

  console.log('[LOADING] Все таймеры очищены');
});
</script>

<style scoped>
.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: url('@/assets/loading_bg.png') center center no-repeat;
  background-size: cover;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  z-index: 1000;
}

.loading-progress {
  position: absolute;
  bottom: 220px;
  width: 60%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.progress-bar {
  width: 100%;
  height: 10px;
  background: rgba(100, 100, 100, 0.4);
  border-radius: 5px;
  overflow: hidden;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
}

.progress-fill {
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 5px;
  transition: width 0.2s ease;
}

/* На мобильных устройствах немного корректируем положение */
@media (max-width: 480px) {
  .loading-progress {
    bottom: 18.5vh;
    width: 60%;
  }
}
</style>