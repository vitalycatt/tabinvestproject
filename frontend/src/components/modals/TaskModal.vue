<template>
  <div class="modal-overlay" v-if="show" @click="closeModal">
    <div class="modal-container" @click.stop>
      <button class="modal-close" @click="closeModal">✖</button>

      <div v-if="task" class="modal-content">
        <img :src="getTaskIcon(task)" :alt="task.title" class="modal-image" />
        <h2 class="modal-title">{{ task.title }}</h2>
        <div class="modal-description">
          <p>{{ task.description }}</p>
        </div>
        <div class="modal-reward">
          <span>💰 +{{ task.reward }} монет</span>
        </div>

        <button
          class="modal-button"
          :disabled="task.completed || loading"
          @click="handleClick"
        >
          <span v-if="loading && !task.completed">Выполняется...</span>
          <span v-else-if="task.completed">Задание выполнено</span>
          <span v-else>Выполнить задание</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  defineProps,
  defineEmits,
  onMounted,
  watch,
  onUnmounted,
} from "vue";
import { useGameStore } from "@/stores/gameStore";
import { useTelegram } from "@/composables/useTelegram";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "https://tabinvestproject.ru";
const API_URL = `${API_BASE}/api`;
const BASE_URL = API_BASE;

const props = defineProps({ show: Boolean, task: Object });
const emit = defineEmits(["close", "complete"]);
const store = useGameStore();
const { user } = useTelegram();
const loading = ref(false);

const getTaskIcon = (task) => {
  if (!task.icon) return "/images/tasks/default.png";
  if (task.icon.startsWith("/")) return `${BASE_URL}${task.icon}`;
  if (task.icon.startsWith("http")) return task.icon;
  return `${BASE_URL}/${task.icon}`;
};

const closeModal = () => emit("close");

let intervalId = null;

// --- 🔹 Клик по кнопке: переход и установка pending ---
const handleClick = () => {
  if (!props.task || loading.value || props.task.completed) return;

  loading.value = true;
  const pendingKey = `task-${props.task._id}-pending`;
  localStorage.setItem(
    pendingKey,
    JSON.stringify({ openedAt: new Date().toISOString() })
  );

  // Fire-and-forget POST на бэкенд
  const payload = { user_id: user.value.id, task_id: props.task._id };
  const url = `${API_URL}/tasks/complete`;
  try {
    if (navigator?.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
      axios.post(url, payload).catch(() => {});
    }
  } catch (e) {}

  // Переход по ссылке
  if (props.task.link) {
    try {
      if (window?.Telegram?.WebApp?.openLink)
        window.Telegram.WebApp.openLink(props.task.link);
      else window.open(props.task.link, "_blank");
    } catch (e) {
      console.warn(e);
      window.open(props.task.link, "_blank");
    }
  }

  startBackgroundCheck();
};

// --- 🔹 Начисление награды без уведомлений ---
const completeTaskLocallySilent = () => {
  if (!props.task || props.task.completed) return;
  const taskKey = `task-${props.task._id}`;
  const reward = Number(props.task.reward ?? 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  localStorage.setItem(
    taskKey,
    JSON.stringify({ expires: endOfDay.toISOString() })
  );

  props.task.completed = true;
  store.balance = Number(store.balance || 0) + reward;
  emit("complete", { ...props.task, reward });

  loading.value = false;
  localStorage.removeItem(`task-${props.task._id}-pending`);
  stopBackgroundCheck();
};

// --- 🔹 Фоновая проверка каждые 3 секунды ---
const startBackgroundCheck = () => {
  if (intervalId) return;
  intervalId = setInterval(() => {
    const pendingKey = `task-${props.task._id}-pending`;
    if (localStorage.getItem(pendingKey)) {
      completeTaskLocallySilent();
    }
  }, 3000);
};

const stopBackgroundCheck = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

// --- 🔹 Проверка при открытии модалки ---
const checkPendingTask = () => {
  if (!props.task) return;
  const pendingKey = `task-${props.task._id}-pending`;
  if (localStorage.getItem(pendingKey)) completeTaskLocallySilent();
};

onMounted(() => checkPendingTask());
watch(
  () => props.show,
  (newVal) => {
    if (newVal) checkPendingTask();
  }
);
onUnmounted(() => stopBackgroundCheck());
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-container {
  width: 100%;
  border-radius: 24px 24px 0 0;
  padding: 24px;
  position: relative;
  box-shadow: 0 -5px 25px rgba(0, 0, 0, 0.3);
  color: white;
  animation: slideUp 0.4s ease;
  margin-bottom: 0;
  background: linear-gradient(
    140.83deg,
    rgb(140, 96, 227) 0%,
    rgb(73, 51, 131) 100%
  );
}

.modal-close {
  position: absolute;
  right: 16px;
  top: 16px;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  z-index: 10;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
}

.modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.modal-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 16px;
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 16px;
}

.modal-description {
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 24px;
}

.modal-reward {
  margin-bottom: 24px;
}

.reward-label {
  font-size: 24px;
  font-weight: 700;
  color: #ffd700;
}

.modal-button {
  background: linear-gradient(
    140.83deg,
    rgb(155, 105, 254) 0%,
    rgb(109, 67, 196) 100%
  );
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.modal-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
