<!-- src/components/NotificationPopup.vue -->
<template>
  <Teleport to="body">
    <TransitionGroup
      name="notification"
      tag="div"
      class="notifications-container"
    >
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['notification', { important: notification.important }]"
      >
        <div class="notification-content">
          <div class="notification-message" v-html="notification.message"></div>

          <!-- Кнопка из админки -->
          <a
            v-if="notification.button"
            :href="notification.button.url"
            target="_blank"
            class="action-button"
          >
            {{ notification.button.text }}
          </a>

          <!-- Кнопка закрытия -->
          <button
            class="close-button"
            @click="closeNotification(notification.id)"
          >
            Закрыть
          </button>
        </div>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useTelegram } from "@/composables/useTelegram";

const { user } = useTelegram();
const notifications = ref([]);
const ws = ref(null);

const connectWebSocket = () => {
  if (!user.value?.id) return;

  const wsBase = (
    import.meta.env.VITE_WS_URL || "wss://tabinvestproject.ru"
  ).replace(/^https?:/, (m) => (m === "https:" ? "wss:" : "ws:"));
  const wsUrl = `${wsBase}?userId=${user.value.id}`;
  console.log("Подключение к WebSocket:", wsUrl);

  try {
    ws.value = new WebSocket(wsUrl);

    ws.value.onopen = () => {
      console.log("WebSocket соединение установлено");
    };

    ws.value.onmessage = (event) => {
      console.log("Получено WebSocket сообщение:", event.data);
      try {
        const data = JSON.parse(event.data);
        if (data.type === "notification") {
          addNotification({
            id: Date.now(),
            message: data.message,
            important: data.important,
            button: data.button, // Сохраняем данные кнопки из админки
          });
        }
      } catch (error) {
        console.error("Ошибка обработки сообщения:", error);
      }
    };

    ws.value.onerror = (error) => {
      console.error("WebSocket ошибка:", error);
    };

    ws.value.onclose = () => {
      console.log("WebSocket соединение закрыто");
      setTimeout(connectWebSocket, 5000);
    };
  } catch (error) {
    console.error("Ошибка создания WebSocket:", error);
  }
};

const addNotification = (notification) => {
  notifications.value.push(notification);
};

const closeNotification = (id) => {
  notifications.value = notifications.value.filter((n) => n.id !== id);
};

onMounted(() => {
  connectWebSocket();
});

onUnmounted(() => {
  if (ws.value) {
    ws.value.close();
  }
});
</script>

<style scoped>
.notifications-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  pointer-events: none;
}

.notification {
  pointer-events: auto;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 20px;
  border-radius: 12px;
  max-width: 90%;
  width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  margin: 10px;
}

.notification.important {
  background: rgba(220, 38, 38, 0.9);
}

.notification-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  text-align: center;
}

.notification-message {
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 10px;
}

.action-button {
  display: inline-block;
  padding: 10px 20px;
  background: #4caf50;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.action-button:hover {
  background: #45a049;
}

.close-button {
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
