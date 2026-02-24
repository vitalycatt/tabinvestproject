<!-- src/components/NotificationsProvider.vue -->
<template>
  <div class="notifications-wrapper">
    <TransitionGroup
        name="game-notification"
        tag="div"
        class="notifications-container"
    >
      <div
          v-for="(notification, index) in visibleNotifications"
          :key="notification.id"
          class="notification"
          :class="notification.type"
          @click="removeNotification(index)"
      >
        <div class="notification-content">
          <div class="notification-icon">
            <span :class="getNotificationIcon(notification.type)"></span>
          </div>
          <div class="notification-message">{{ notification.message }}</div>
        </div>
      </div>
    </TransitionGroup>
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, provide, inject, computed } from 'vue';

const notifications = ref([]);
const logger = inject('logger', console);
const MAX_NOTIFICATIONS = 3;

// Генератор уникальных ID
let notificationIdCounter = 0;
const generateId = () => `notification-${notificationIdCounter++}`;

// Только видимые уведомления (максимум MAX_NOTIFICATIONS)
const visibleNotifications = computed(() => {
  return notifications.value.slice(-MAX_NOTIFICATIONS);
});

const addNotification = (notification) => {
  // Устанавливаем тип по умолчанию, если не указан
  if (!notification.type) {
    notification.type = 'info';
  }

  // Добавляем уникальный ID и время создания
  const notificationWithId = {
    ...notification,
    id: generateId(),
    createdAt: Date.now()
  };

  logger.log('Adding notification:', notificationWithId);

  // Если превышен лимит, удаляем самое старое уведомление
  if (notifications.value.length >= MAX_NOTIFICATIONS) {
    notifications.value.shift();
  }

  // Добавляем уведомление в массив
  notifications.value.push(notificationWithId);

  // Автоматическое удаление через duration миллисекунд или 4000мс по умолчанию
  const duration = notification.duration || 3000;
  if (notification.type !== 'error' || duration > 0) {
    setTimeout(() => {
      removeNotificationById(notificationWithId.id);
    }, duration);
  }
};

const removeNotification = (index) => {
  if (index > -1 && index < notifications.value.length) {
    notifications.value.splice(index, 1);
  }
};

const removeNotificationById = (id) => {
  const index = notifications.value.findIndex(n => n.id === id);
  if (index > -1) {
    notifications.value.splice(index, 1);
  }
};

const getNotificationIcon = (type) => {
  switch (type) {
    case 'success':
      return '🎯';
    case 'error':
      return '⚠️';
    case 'warning':
      return '⚡';
    case 'reward':
      return '💰';
    default:
      return 'ℹ️';
  }
};

// Переопределяем notifications из App.vue
provide('notifications', {
  addNotification,
  removeNotification
});
</script>

<style scoped>
.notifications-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.notifications-container {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  max-width: 90%;
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.notification {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  background: linear-gradient(140.83deg, rgba(111, 95, 242, 0.8) 0%, rgba(73, 51, 131, 0.8) 100%);
  backdrop-filter: blur(8px);
  color: white;
  font-weight: 500;
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.notification:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.6);
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.notification-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.notification-message {
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
}

.notification.success {
  background: linear-gradient(140.83deg, rgba(72, 187, 120, 0.8) 0%, rgba(56, 161, 105, 0.8) 100%);
}

.notification.error {
  background: linear-gradient(140.83deg, rgba(245, 101, 101, 0.8) 0%, rgba(229, 62, 62, 0.8) 100%);
}

.notification.warning {
  background: linear-gradient(140.83deg, rgba(246, 173, 85, 0.8) 0%, rgba(237, 137, 54, 0.8) 100%);
}

.notification.reward {
  background: linear-gradient(140.83deg, rgba(246, 213, 92, 0.8) 0%, rgba(237, 185, 46, 0.8) 100%);
}

/* Анимации */
.game-notification-enter-active {
  animation: bounceIn 0.5s cubic-bezier(0.215, 0.610, 0.355, 1.000);
}

.game-notification-leave-active {
  animation: fadeOut 0.3s ease forwards;
  position: absolute;
  width: 100%;
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(-20px);
  }
  50% {
    opacity: 1;
    transform: scale(1.05) translateY(0);
  }
  70% {
    transform: scale(0.95) translateY(0);
  }
  100% {
    transform: scale(1) translateY(0);
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-20px);
  }
}

@media (max-width: 768px) {
  .notifications-container {
    width: 90%;
    max-width: 300px;
  }
}
</style>