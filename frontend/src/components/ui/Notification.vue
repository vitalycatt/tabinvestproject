<!-- src/components/ui/Notification.vue -->
<template>
  <Teleport to="body">
    <div v-if="notifications.length" class="notifications-container">
      <TransitionGroup name="notification">
        <div
            v-for="notification in notifications"
            :key="notification.id"
            class="notification"
            :class="notification.type"
        >
          {{ notification.message }}
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

const notifications = ref([])
let nextId = 0

const addNotification = ({ message, type = 'info', duration = 3000 }) => {
  const id = nextId++
  const notification = {
    id,
    message,
    type
  }

  notifications.value.push(notification)

  if (duration > 0) {
    setTimeout(() => {
      removeNotification(id)
    }, duration)
  }
}

const removeNotification = (id) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index !== -1) {
    notifications.value.splice(index, 1)
  }
}

defineExpose({
  addNotification,
  removeNotification
})
</script>

<style scoped>
.notifications-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}

.notification {
  background: rgba(27, 20, 38, 0.95);
  border: 1px solid rgba(140, 96, 227, 0.3);
  border-radius: 16px;
  padding: 1rem;
  color: white;
  text-align: center;
  pointer-events: auto;
  min-width: 280px;
  backdrop-filter: blur(4px);
}

.notification.success {
  border-color: #4CAF50;
}

.notification.error {
  border-color: #F44336;
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>