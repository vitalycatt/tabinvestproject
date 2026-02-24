<template>
  <div class="tasks-page">
    <Header />
    <Balance />

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Загрузка заданий...</p>
    </div>

    <div v-else class="tasks-container">
      <!-- Отладочная инфа 
      <div class="debug-info mb-4 p-2 border rounded bg-gray-100 text-sm">
        <p><b>Отладка:</b></p>
        <p>dailyTasks count: {{ dailyTasks.length }}</p>
        <p>regularTasks count: {{ regularTasks.length }}</p>
        <p>platformTasks count: {{ platformTasks.length }}</p>
        <p>platformProgress: {{ platformProgress }}</p>
      </div>-->

      <!-- Ежедневные задания -->
      <div v-if="dailyTasks.length > 0" class="section">
        <h2 class="section-title">Ежедневные задания</h2>
        <div class="tasks-list">
          <div
            v-for="task in dailyTasks.filter((t) => !t.completed)"
            :key="task._id"
            class="task-item"
            @click="handleTaskClick(task)"
          >
            <div class="task-icon">
              <img :src="getTaskIcon(task)" :alt="task.title" />
            </div>
            <div class="task-info">
              <div class="task-title">{{ task.title }}</div>
              <div class="task-status text-xs text-gray-100">
                <!--Выполнено: {{ task.completed ? 'да' : 'нет' }}-->
              </div>
            </div>
            <div class="task-reward">
              <img
                src="@/assets/images/coin.png"
                alt="coin"
                class="coin-icon"
              />
              <span>+{{ task.reward }}</span>
            </div>
            <div class="task-arrow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 18L15 12L9 6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Список постоянных заданий -->
      <div v-if="regularTasks.length > 0" class="section">
        <h2 class="section-title">Список заданий</h2>
        <div class="tasks-list">
          <div
            v-for="task in regularTasks.filter((t) => !t.completed)"
            :key="task._id"
            class="task-item"
            @click="handleTaskClick(task)"
          >
            <div class="task-icon">
              <img :src="getTaskIcon(task)" :alt="task.title" />
            </div>
            <div class="task-info">
              <div class="task-title">{{ task.title }}</div>
              <div class="task-status text-xs text-gray-500">
                <!--  Выполнено: {{ task.completed ? 'да' : 'нет' }}-->
              </div>
            </div>
            <div class="task-reward">
              <img
                src="@/assets/images/coin.png"
                alt="coin"
                class="coin-icon"
              />
              <span>+{{ task.reward }}</span>
            </div>
            <div class="task-arrow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 18L15 12L9 6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Задания платформы -->
      <div v-if="platformTasks.length > 0" class="section">
        <h2 class="section-title">
          Задания платформы
          <div class="platform-progress">
            <div
              v-for="n in 12"
              :key="n"
              class="progress-dot"
              :class="{ active: n <= platformProgress }"
            ></div>
          </div>
        </h2>
        <div class="tasks-list">
          <div
            v-for="task in platformTasks.filter((t) => !t.completed)"
            :key="task._id"
            class="task-item"
            @click="handleTaskClick(task)"
          >
            <div class="task-icon">
              <img :src="getTaskIcon(task)" :alt="task.title" />
            </div>
            <div class="task-info">
              <div class="task-title">{{ task.title }}</div>
              <div class="task-status text-xs text-gray-500">
                <!--Выполнено: {{ task.completed ? 'да' : 'нет' }}-->
              </div>
            </div>
            <div class="task-reward">
              <img
                src="@/assets/images/coin.png"
                alt="coin"
                class="coin-icon"
              />
              <span>+{{ task.reward }}</span>
            </div>
            <div class="task-arrow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 18L15 12L9 6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Navigation />

    <!-- Модалка задания -->
    <TaskModal
      :show="taskModalVisible"
      :task="selectedTask"
      @close="taskModalVisible = false"
      @complete="onTaskComplete"
    />
  </div>
</template>

<script setup>
import { ref, inject, onMounted } from "vue";
import { useGameStore } from "@/stores/gameStore";
import { useTelegram } from "@/composables/useTelegram";
import Header from "@/components/layout/Header.vue";
import Balance from "@/components/game/Balance.vue";
import Navigation from "@/components/layout/Navigation.vue";
import TaskModal from "@/components/modals/TaskModal.vue";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "https://tabinvestproject.ru";
const API_URL = `${API_BASE}/api`;
const BASE_URL = API_BASE;

const store = useGameStore();
const { user: telegramUser } = useTelegram();

const user = ref(
  telegramUser.value || {
    id: "local-dev-user",
    username: "dev_user",
    first_name: "Local",
    last_name: "User",
  }
);

const notifications = inject("notifications");
const logger = inject("logger", console);

const loading = ref(true);
const error = ref(null);

const platformProgress = ref(0);

const dailyTasks = ref([]);
const regularTasks = ref([]);
const platformTasks = ref([]);

// Вынесенный глобальный словарь для выполненных заданий с датами
const completedTasksWithDates = ref({});

const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const fetchTasks = async () => {
  // Функция для нормализации текста
  const normalize = (s) =>
    (s || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/[.,!?:;"'«»()[\]{}]/g, "")
      .replace(/\s+/g, " ");

  // Проверка на «мягкую» ошибку про пользователя
  const isBenignUserMissing = (raw) => {
    const m = normalize(raw);
    const hasUserWord = m.includes("пользоват"); // пользователь / пользователя / пользователю
    const hasNoExist =
      m.includes("не существ") ||
      m.includes("не найден") ||
      m.includes("нет такого") ||
      m.includes("похоже такого");
    return hasUserWord && hasNoExist;
  };

  try {
    loading.value = true;
    logger.log(
      "[fetchTasks] Начало загрузки задач для пользователя",
      user.value?.id || "неизвестен"
    );

    if (!user.value?.id) {
      throw new Error("ID пользователя не определён");
    }

    const response = await axios.get(`${API_URL}/tasks/user/${user.value.id}`);
    logger.log("[fetchTasks] Ответ сервера:", response.data);

    if (!response.data?.success) {
      // Если это «мягкая» ошибка — просто выходим без уведомления
      if (isBenignUserMissing(response.data?.message)) {
        logger.warn(
          "[fetchTasks] Мягкая ошибка про пользователя, пропускаем уведомление:",
          response.data?.message
        );
        return;
      }
      throw new Error(
        response.data?.message ||
          "Ошибка загрузки задач: success=false в ответе сервера"
      );
    }

    const tasksData = response.data.data || [];
    logger.log("[fetchTasks] Всего задач получено:", tasksData.length);

    completedTasksWithDates.value = {};

    const now = new Date();

    // Проверяем localStorage перед разделением по типам
    const tasksWithLocalCheck = tasksData.map((task) => {
      const taskKey = `task-${task._id}`;
      const stored = localStorage.getItem(taskKey);

      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.expires && new Date(parsed.expires) > now) {
            task.completed = true;
          }
        } catch (e) {
          // ignore parse errors
        }
      }

      if (task.completed && task.completedDate) {
        completedTasksWithDates.value[task._id] = task.completedDate;
      }

      return task;
    });

    // Разделяем по типам
    dailyTasks.value = tasksWithLocalCheck.filter(
      (task) => task.type === "daily" && task.active
    );
    regularTasks.value = tasksWithLocalCheck.filter(
      (task) => task.type === "achievement" && task.active
    );
    platformTasks.value = tasksWithLocalCheck.filter(
      (task) => task.type === "platform" && task.active
    );

    platformProgress.value = platformTasks.value.filter(
      (task) => task.completed
    ).length;

    logger.log("[fetchTasks] dailyTasks:", dailyTasks.value);
    logger.log("[fetchTasks] regularTasks:", regularTasks.value);
    logger.log("[fetchTasks] platformTasks:", platformTasks.value);
    logger.log("[fetchTasks] platformProgress:", platformProgress.value);
  } catch (err) {
    logger.error("[fetchTasks] Ошибка загрузки задач:", err);

    const msg = err?.response?.data?.message || err?.message || "";
    if (isBenignUserMissing(msg)) {
      logger.warn(
        "[fetchTasks] Мягкая ошибка про пользователя, уведомление не показываем:",
        msg
      );
      return; // просто выходим без уведомления
    }

    error.value = "Не удалось загрузить задания";
    notifications?.addNotification({
      message: "Ошибка загрузки заданий",
      type: "error",
    });
  } finally {
    loading.value = false;
    logger.log("[fetchTasks] Завершение загрузки задач. loading = false");
  }
};

const getTaskIcon = (task) => {
  if (!task.icon) return "/images/tasks/default.png";

  if (task.icon.startsWith("/")) {
    return `${BASE_URL}${task.icon}`;
  }

  if (task.icon.startsWith("http")) {
    return task.icon;
  }

  if (task.icon.includes("images/") || task.icon.includes("assets/")) {
    return task.icon;
  }

  return `${BASE_URL}/${task.icon}`;
};

const handleTaskClick = (task) => {
  logger.log("[handleTaskClick] Клик по заданию:", task.title, "ID:", task._id);

  if (task.completed) {
    logger.log("[handleTaskClick] Задание уже выполнено:", task.title);
    notifications?.addNotification({
      message: "Задание уже выполнено",
      type: "info",
    });
    return;
  }

  selectedTask.value = task;
  taskModalVisible.value = true;
  logger.log("[handleTaskClick] Открываем модальное окно задания:", task.title);
};

const updateTaskStatus = (taskId, completed) => {
  const updateTaskInList = (taskListRef) => {
    const index = taskListRef.value.findIndex((task) => task._id === taskId);
    if (index !== -1) {
      taskListRef.value[index] = { ...taskListRef.value[index], completed };
    }
  };

  updateTaskInList(dailyTasks);
  updateTaskInList(regularTasks);
  updateTaskInList(platformTasks);

  platformProgress.value = platformTasks.value.filter(
    (task) => task.completed
  ).length;

  logger.log(
    "[updateTaskStatus] Новый прогресс платформы:",
    platformProgress.value
  );
};

const taskModalVisible = ref(false);
const selectedTask = ref(null);

// Обработчик успешного выполнения задания из модалки
// Найди и замени onTaskComplete на этот код
const onTaskComplete = async (completedTask) => {
  try {
    logger.log("[onTaskComplete] Событие complete от модалки:", completedTask);

    if (typeof completedTask.reward !== "undefined") {
      logger.log(
        `[onTaskComplete] Награда от модалки: ${completedTask.reward}`
      );
    }

    // Локально помечаем задачу как выполненную (мгновенное скрытие)
    completedTasksWithDates.value[completedTask._id] = formatDate(new Date());
    updateTaskStatus(completedTask._id, true);

    // Перезагружаем список с бэка через 3 секунды
    setTimeout(() => {
      fetchTasks();
    }, 3000);

    notifications?.addNotification({
      message: `Задание "${completedTask.title}" отмечено как выполненное.`,
      type: "success",
    });

    taskModalVisible.value = false;
  } catch (err) {
    logger.error("[onTaskComplete] Ошибка при обработке complete:", err);
    notifications?.addNotification({
      message: `Не удалось обновить задание "${completedTask.title}"`,
      type: "error",
    });
  }
};

onMounted(() => {
  logger.log("[onMounted] Компонент Tasks смонтирован, запускаем fetchTasks()");
  fetchTasks();
});
</script>

<style scoped>
.tasks-page {
  min-height: 100vh;
  padding: 100px 0 80px 0;
  background: url("@/assets/images/bg.jpg") center top no-repeat;
}

.tasks-container {
  margin-top: 20px;
  padding: 0 1rem 150px 1rem;
  overflow: scroll;
  height: 70vh;
}

.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: white;
  margin-bottom: 12px;
}

.platform-progress {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.progress-dot {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.progress-dot.active {
  background: var(--primary-color);
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  background: none;
  border: 1px solid rgba(140, 96, 227, 0.3);
  border-radius: 16px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.task-item:hover {
  background: rgba(140, 96, 227, 0.1);
}

.task-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
}

.task-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.task-info {
  flex: 1;
}

.task-title {
  font-size: 14px;
  font-weight: 500;
  color: white;
}

.task-reward {
  display: flex;
  align-items: center;
  gap: 4px;
  color: white;
}

.coin-icon {
  width: 16px;
  height: 16px;
}

.task-arrow {
  color: rgba(255, 255, 255, 0.5);
}

.task-item.completed {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Стили для отображения загрузки */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  color: white;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
