<!-- src/components/notifications/NotificationsContainer.vue -->
<template>
  <div class="notifications-container">
    <transition-group name="notification">
      <div
          v-for="notification in notifications.items"
          :key="notification.id"
          class="notification"
          :class="getNotificationClass(notification.type)"
          @click="removeNotification(notification.id)"
      >
        <div class="notification-icon">
          <svg v-if="notification.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <svg v-else-if="notification.type === 'error'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <svg v-else-if="notification.type === 'warning'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </div>
        <div class="notification-text">{{ notification.message }}</div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { inject } from 'vue'

// Получаем сервис уведомлений из контекста
const notifications = inject('notifications')

// Получение класса для уведомления в зависимости от типа
const getNotificationClass = (type) => {
  const classes = {
    success: 'notification-success',
    error: 'notification-error',
    warning: 'notification-warning',
    info: 'notification-info'
  }

  return classes[type] || classes.info
}

// Удаление уведомления
const removeNotification = (id) => {
  notifications.removeNotification(id)
}
</script>

<style scoped>
.notifications-container {
  position: fixed;
  top: 20px;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

.notification {
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 250px;
  max-width: 320px;
  display: flex;
  align-items: center;
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.3s ease;
}

.notification:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.notification-icon {
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
}

.notification-success {
  background: rgba(82, 196, 26, 0.9);
  color: white;
}

.notification-error {
  background: rgba(255, 77, 79, 0.9);
  color: white;
}

.notification-warning {
  background: rgba(250, 173, 20, 0.9);
  color: white;
}

.notification-info {
  background: rgba(24, 144, 255, 0.9);
  color: white;
}

/* Анимации для уведомлений */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100px);
}
</style>