<template>
  <div v-if="(!isSynced && !isAdminRoute) && !isDev" class="loading-screen">
    <p>Загрузка...</p>
  </div>

  <div v-else>
    <NotificationsProvider>
      <div class="app">
        <router-view v-slot="{ Component }">
          <transition mode="out-in" name="fade">
            <component :is="Component"/>
          </transition>
        </router-view>

        <ProductNotification/>

        <ProductModal
            :product="selectedProduct"
            :show="showProductModal"
            @activate="handleProductActivation"
            @close="closeProductModal"
        />

        <TaskModal
            v-if="showTaskModal"
            :show="showTaskModal"
            :task="selectedTask"
            @close="closeTaskModal"
            @complete="handleTaskCompletion"
        />
      </div>
    </NotificationsProvider>
  </div>
</template>


<script setup>
import {computed, onMounted, provide, ref} from 'vue';
import {useRoute} from 'vue-router';
import {useGameStore} from '@/stores/gameStore';
import NotificationsProvider from '@/components/NotificationsProvider.vue';
import ProductNotification from '@/components/notifications/ProductNotification.vue';
import ProductModal from '@/components/modals/ProductModal.vue';
import TaskModal from '@/components/modals/TaskModal.vue';

console.log('Текущий режим:', import.meta.env.MODE);
console.log('isDev:', import.meta.env.DEV);
const isDev = import.meta.env.DEV;

const route = useRoute();
const store = useGameStore();

// Определяем userId в зависимости от режима
const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
const userId = isDev ? 5539208376 : tgUser?.id;

if (!userId) {
  console.warn('[APP WARN] Не удалось получить userId');
}

const isSynced = computed(() => store.isSynced); // предполагаем, что это обычное свойство, не ref
const isAdminRoute = computed(() => route.path.startsWith('/admin'));
const userExists = computed(() => !!store.currentUser);

const showProductModal = ref(false);
const selectedProduct = ref(null);

const showTaskModal = ref(false);
const selectedTask = ref(null);

const logger = {
  log: (...args) => {
    if (isDev) console.log('[APP]', ...args);
  },
  error: (...args) => {
    console.error('[APP ERROR]', ...args);
  },
  warn: (...args) => {
    console.warn('[APP WARN]', ...args);
  },
  debug: (...args) => {
    if (isDev) console.debug('[APP DEBUG]', ...args);
  }
};

provide('logger', logger);

const openTaskModal = (task) => {
  logger.log('Opening task modal for:', task);
  selectedTask.value = task;
  showTaskModal.value = true;
};

const closeTaskModal = () => {
  logger.log('Closing task modal');
  showTaskModal.value = false;
  setTimeout(() => {
    selectedTask.value = null;
  }, 300);
};

const handleTaskCompletion = (completedTask) => {
  logger.log('Task completed:', completedTask);
  if (completedTask?.reward) {
    store.balance += completedTask.reward;
  }
};

const openProductModal = (product) => {
  logger.log('Opening product modal for:', product);
  selectedProduct.value = product;
  showProductModal.value = true;
};

const closeProductModal = () => {
  logger.log('Closing product modal');
  showProductModal.value = false;
  setTimeout(() => {
    selectedProduct.value = null;
  }, 300);
};

const handleProductActivation = (activatedProduct) => {
  logger.log('Product activated:', activatedProduct);
};

provide('productModal', {
  open: openProductModal,
  close: closeProductModal,
});

provide('taskModal', {
  open: openTaskModal,
  close: closeTaskModal,
});

const showResetButton = computed(() => {
  return route.path !== '/loading' && route.path !== '/onboarding';
});

function resetProgress() {
  if (confirm('Вы уверены, что хотите сбросить весь прогресс?')) {
    localStorage.removeItem('onboardingCompleted');
    localStorage.removeItem('appLoaded');
    store.resetGame();
  }
}

onMounted(async () => {
  logger.log('App.vue mounted');

  if (isDev) {
    logger.log('DEV режим — эмулируем локального пользователя');
    await store.syncFromServer(userId);
    if (store._energyRegenTimerId === null) {
      logger.log('Запускаем таймер регенерации энергии');
      store.startPassiveIncomeTimer();
    }
    return;
  }

  // Production / реальная синхронизация через Telegram
  if (!userId) {
    logger.warn('Нет userId, синхронизация не выполнена');
    store.currentUser = {id: 'guest', name: 'Гость'}; // добавляем гостевого пользователя
    store.isSynced = true; // считаем, что синхронизация завершена
    return;
  }

  try {
    logger.log(`Запуск синхронизации с сервером для пользователя: ${userId}`);
    await store.syncFromServer(userId);
    logger.log('Синхронизация с сервером завершена');

    if (store._energyRegenTimerId === null) {
      logger.log('Запускаем таймер регенерации энергии');
      store.startPassiveIncomeTimer();
    }
  } catch (err) {
    logger.error('Ошибка при синхронизации с сервером:', err);
    store.isSynced = true; // даже при ошибке считаем, что загрузка завершена
  }
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

.reset-button {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 900;
}
</style>
