<!-- src/components/admin/TasksSection.vue -->
<template>
  <div class="section-container">
    <div class="tasks-section">
      <div class="section-header">
        <h2>Управление заданиями</h2>
        <BaseButton type="primary" @click="openTaskModal()">
          Создать задание
        </BaseButton>
      </div>

      <div class="tasks-layout">

        <!-- Статистика заданий -->
        <BaseCard class="tasks-stats">
          <h3>Статистика заданий</h3>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ tasks.length }}</div>
              <div class="stat-label">Всего заданий</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ activeTasks }}</div>
              <div class="stat-label">Активных заданий</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ totalCompletions }}</div>
              <div class="stat-label">Всего выполнений</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ formatMoney(totalRewards) }}</div>
              <div class="stat-label">Выдано наград</div>
            </div>
          </div>

          <div class="task-type-chart">
            <h4>Распределение по типам</h4>
            <div class="type-bars">
              <div
                  v-for="(count, type) in typeCounts"
                  :key="type"
                  class="type-bar"
                  :style="{
                width: `${(count / tasks.length) * 100}%`,
                backgroundColor: getTypeColor(type)
              }"
              >
                <span class="type-name">{{ getTaskType(type) }}</span>
                <span class="type-count">{{ count }}</span>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- Список заданий -->
        <BaseCard class="tasks-list">
          <div class="list-header">
            <h3>Список заданий</h3>
            <div class="filter-controls">
              <select v-model="filterType" class="form-input">
                <option value="all">Все типы</option>
                <option value="daily">Ежедневные</option>
                <option value="achievement">Достижения</option>
                <option value="special">Особые</option>
              </select>
              <select v-model="filterStatus" class="form-input">
                <option value="all">Все статусы</option>
                <option value="active">Активные</option>
                <option value="inactive">Неактивные</option>
              </select>
            </div>
          </div>

          <LoadingSpinner v-if="loading" />

          <div v-else-if="filteredTasks.length === 0" class="empty-list">
            <p>Задания не найдены</p>
          </div>

          <div v-else>
            <!-- Таблица для десктопа -->
            <div class="tasks-table desktop-only">
              <table>
                <thead>
                <tr>
                  <th>Иконка</th>
                  <th>Название</th>
                  <th>Тип</th>
                  <th>Награда</th>
                  <th>Требования</th>
                  <th>Выполнено</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="task in filteredTasks" :key="'table-'+task.id">
                  <td>
                    <div class="task-icon">
                      <img
                          :src="task.iconUrl || task.icon"
                          alt="Иконка"
                          @error="handleImageError"
                          class="task-icon-img"
                      />
                    </div>
                  </td>
                  <td>{{ task.title }}</td>
                  <td>{{ getTaskType(task.type) }}</td>
                  <td>{{ formatMoney(task.reward) }}</td>
                  <td>
                    <div v-if="task.requirements?.level">Уровень: {{ task.requirements.level }}+</div>
                    <div v-if="task.requirements?.income">Доход: {{ formatMoney(task.requirements.income) }}+</div>
                  </td>
                  <td>{{ task.completions || 0 }}</td>
                  <td>
                    <span :class="['status-badge', task.active ? 'active' : 'inactive']">
                      {{ task.active ? 'Активно' : 'Неактивно' }}
                    </span>
                  </td>
                  <td class="actions">
                    <button class="action-btn edit" @click="openTaskModal(task)">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" @click="deleteTask(task)">
                      <i class="fas fa-trash"></i>
                    </button>
                    <button
                        class="action-btn toggle"
                        @click="toggleTaskStatus(task)"
                        :title="task.active ? 'Деактивировать' : 'Активировать'"
                    >
                      <i :class="task.active ? 'fas fa-times-circle' : 'fas fa-check-circle'"></i>
                    </button>
                  </td>
                </tr>
                </tbody>
              </table>
            </div>

            <!-- Карточки для мобильной версии -->
            <div class="task-cards mobile-only">
              <div v-for="task in filteredTasks" :key="'card-'+task.id" class="task-card">
                <div class="task-card-header">
                  <div class="task-icon">
                    <img
                        :src="task.iconUrl || task.icon"
                        alt="Иконка"
                        @error="handleImageError"
                        class="task-icon-img"
                    />
                  </div>
                  <h4>{{ task.title }}</h4>
                  <span :class="['status-badge', task.active ? 'active' : 'inactive']">
                    {{ task.active ? 'Активно' : 'Неактивно' }}
                  </span>
                </div>

                <div class="task-card-content">
                  <div class="task-detail">
                    <strong>Тип:</strong> {{ getTaskType(task.type) }}
                  </div>
                  <div class="task-detail">
                    <strong>Награда:</strong> {{ formatMoney(task.reward) }}
                  </div>
                  <div class="task-detail" v-if="task.requirements?.level || task.requirements?.income">
                    <strong>Требования:</strong>
                    <div v-if="task.requirements?.level">Уровень: {{ task.requirements.level }}+</div>
                    <div v-if="task.requirements?.income">Доход: {{ formatMoney(task.requirements.income) }}+</div>
                  </div>
                  <div class="task-detail">
                    <strong>Выполнено:</strong> {{ task.completions || 0 }}
                  </div>
                </div>

                <div class="task-card-actions">
                  <button class="action-btn edit" @click="openTaskModal(task)">
                    <i class="fas fa-edit"></i>
                    <span>Редактировать</span>
                  </button>
                  <button class="action-btn delete" @click="deleteTask(task)">
                    <i class="fas fa-trash"></i>
                    <span>Удалить</span>
                  </button>
                  <button
                      class="action-btn toggle"
                      @click="toggleTaskStatus(task)"
                  >
                    <i :class="task.active ? 'fas fa-times-circle' : 'fas fa-check-circle'"></i>
                    <span>{{ task.active ? 'Деактивировать' : 'Активировать' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Модальное окно для создания/редактирования задания -->
      <TaskModal
          v-if="showTaskModal"
          :task="currentTask"
          @close="showTaskModal = false"
          @save="saveTask"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue';
import { ApiService } from '../../services/apiService';
import BaseCard from '../ui/BaseCard.vue';
import BaseButton from '../ui/BaseButton.vue';
import BaseForm from '../ui/BaseForm.vue';
import FormGroup from '../ui/FormGroup.vue';
import BaseModal from '../ui/BaseModal.vue';
import LoadingSpinner from '../ui/LoadingSpinner.vue';
import TaskModal from '../admin/modals/TaskModal.vue';

const notifications = inject('notifications');

// Состояние
const loading = ref(true);
const saving = ref(false);
const tasks = ref([]);
const showTaskModal = ref(false);
const filterType = ref('all');
const filterStatus = ref('all');

// Модель задания
const defaultTask = {
  title: '',
  description: '',
  type: 'daily',
  reward: 100,
  link: '', // Добавленное поле для ссылки
  icon: 'default.png',
  requirements: {
    level: 1,
    income: 0
  },
  active: true
};

const currentTask = ref({ ...defaultTask });

// Вычисляемые свойства
const filteredTasks = computed(() => {
  let result = tasks.value;

  // Фильтрация по типу
  if (filterType.value !== 'all') {
    result = result.filter(task => task.type === filterType.value);
  }

  // Фильтрация по статусу
  if (filterStatus.value !== 'all') {
    const isActive = filterStatus.value === 'active';
    result = result.filter(task => task.active === isActive);
  }

  return result;
});

const activeTasks = computed(() => {
  return tasks.value.filter(t => t.active).length;
});

const totalCompletions = computed(() => {
  return tasks.value.reduce((sum, task) => sum + (task.completions || 0), 0);
});

const totalRewards = computed(() => {
  return tasks.value.reduce((sum, task) => sum + (task.reward * (task.completions || 0)), 0);
});

const typeCounts = computed(() => {
  const counts = {};
  tasks.value.forEach(task => {
    counts[task.type] = (counts[task.type] || 0) + 1;
  });
  return counts;
});

// Методы
// Обработка ошибок изображений
const handleImageError = (e) => {
  console.error('Ошибка загрузки изображения');
  // Заменяем на изображение-заглушку
  e.target.src = 'https://via.placeholder.com/40x40?text=No+Icon';
};

// Загрузка заданий
const loadTasks = async () => {
  try {
    loading.value = true;
    console.log('Загрузка заданий...');

    const response = await ApiService.getTasks();
    console.log('Ответ от сервера:', response);

    if (response && response.success && response.data) {
      // Сервер возвращает { success: true, data: [...] }
      tasks.value = response.data.map(task => {
        // Проверяем, если иконка не содержит полный URL или путь с /uploads/
        if (task.icon && !task.icon.startsWith('http')) {
          // Добавляем полный путь к иконке
          task.iconUrl = `${ApiService.API_URL}${task.icon}?t=${new Date().getTime()}`;
        } else {
          task.iconUrl = task.icon;
        }

        return {
          ...task,
          id: task._id // Добавляем id для совместимости с фронтендом
        };
      });
    } else {
      console.error('Неожиданный формат ответа:', response);
      tasks.value = [];
    }
  } catch (error) {
    console.error('Ошибка загрузки заданий:', error);
    notifications.addNotification({
      message: `Ошибка загрузки заданий: ${error.message}`,
      type: 'error'
    });
    tasks.value = [];
  } finally {
    loading.value = false;
  }
};

// Открытие модального окна задания
const openTaskModal = (task = null) => {
  if (task) {
    currentTask.value = {
      ...task,
      requirements: task.requirements || { level: 1, income: 0 }
    };
  } else {
    currentTask.value = { ...defaultTask };
  }
  showTaskModal.value = true;
};

// Сохранение задания
const saveTask = async (taskData, isFormData = false) => {
  try {
    saving.value = true;

    // Проверка обязательных полей для обычного объекта
    if (!isFormData && (!taskData.title || !taskData.description)) {
      notifications.addNotification({
        message: 'Название и описание задания обязательны',
        type: 'warning'
      });
      return;
    }

    let response;

    if (isFormData) {
      // Загрузка с файлом
      if (currentTask.value._id) {
        // Обновление существующего задания с файлом
        response = await ApiService.updateTaskWithImage(
            currentTask.value._id,
            taskData
        );
      } else {
        // Создание нового задания с файлом
        response = await ApiService.createTaskWithImage(taskData);
      }
    } else {
      // Обычная загрузка без файла
      if (currentTask.value._id) {
        // Обновление существующего задания
        response = await ApiService.updateTask(
            currentTask.value._id,
            taskData
        );
      } else {
        // Создание нового задания
        response = await ApiService.createTask(taskData);
      }
    }

    console.log('Ответ от сервера:', response);

    if (response && response.success) {
      // Успешное создание/обновление
      notifications.addNotification({
        message: currentTask.value._id ? 'Задание успешно обновлено' : 'Задание успешно создано',
        type: 'success'
      });

      showTaskModal.value = false;
      await loadTasks(); // Перезагрузка списка заданий
    } else {
      throw new Error('Не удалось сохранить задание');
    }
  } catch (error) {
    console.error('Ошибка сохранения задания:', error);
    notifications.addNotification({
      message: `Ошибка при сохранении задания: ${error.message}`,
      type: 'error'
    });
  } finally {
    saving.value = false;
  }
};

const deleteTask = async (task) => {
  if (confirm(`Вы действительно хотите удалить задание "${task.title}"?`)) {
    try {
      await ApiService.deleteTask(task.id);
      notifications.addNotification({
        message: 'Задание успешно удалено',
        type: 'success'
      });
      await loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      notifications.addNotification({
        message: 'Ошибка при удалении задания',
        type: 'error'
      });
    }
  }
};

const toggleTaskStatus = async (task) => {
  try {
    await ApiService.updateTask(task.id, {
      active: !task.active
    });

    notifications.addNotification({
      message: `Задание ${task.active ? 'деактивировано' : 'активировано'}`,
      type: 'success'
    });

    await loadTasks();
  } catch (error) {
    console.error('Error toggling task status:', error);
    notifications.addNotification({
      message: 'Ошибка при изменении статуса задания',
      type: 'error'
    });
  }
};

// Вспомогательные функции
const formatMoney = (num) => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const getTaskType = (type) => {
  const types = {
    daily: 'Ежедневное',
    achievement: 'Достижение',
    special: 'Особое'
  };
  return types[type] || type;
};

const getTypeColor = (type) => {
  const colors = {
    daily: '#4caf50',    // Зеленый
    achievement: '#2196f3', // Синий
    special: '#ff9800'    // Оранжевый
  };
  return colors[type] || '#9e9e9e';
};

// Загрузка данных при монтировании
onMounted(async () => {
  await loadTasks();
});
</script>

<style scoped>
.task-icon {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

.task-icon-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.section-container {
  width: 100%;
  max-height: 90vh;
  overflow-y: scroll;
  display: flex;
  flex-direction: column;
}

.tasks-section {
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.tasks-layout {
  display: grid;
  grid-template-columns: auto;
  gap: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filter-controls {
  display: flex;
  gap: 10px;
}

.tasks-table {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-badge.active {
  background-color: #4caf50;
  color: white;
}

.status-badge.inactive {
  background-color: #f44336;
  color: white;
}

.actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.action-btn.edit {
  color: #2196f3;
}

.action-btn.delete {
  color: #f44336;
}

.action-btn.toggle {
  color: #ff9800;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.task-type-chart {
  margin-top: 24px;
}

.task-type-chart h4 {
  margin-bottom: 16px;
}

.type-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.type-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  color: white;
  border-radius: 4px;
  min-width: 30px;
  transition: all 0.3s ease;
}

.type-count {
  font-weight: 700;
}

.empty-list {
  text-align: center;
  padding: 40px;
  color: #666;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

/* Styles for form inputs */
.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-input:focus {
  border-color: var(--primary-color, #8C60E3);
  outline: none;
}

/* Мобильные карточки */
.task-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #eee;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.task-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.task-card-header h4 {
  margin: 0;
  font-size: 16px;
  flex: 1;
  margin-left: 12px;
}

.task-card-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-detail {
  display: flex;
  flex-direction: column;
}

.task-card-actions {
  display: flex;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-top: 1px solid #eee;
  gap: 8px;
  overflow-x: auto;
}

.task-card-actions .action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  white-space: nowrap;
  border-radius: 4px;
  font-size: 14px;
}

.task-card-actions .action-btn.edit {
  background-color: rgba(33, 150, 243, 0.1);
}

.task-card-actions .action-btn.delete {
  background-color: rgba(244, 67, 54, 0.1);
}

.task-card-actions .action-btn.toggle {
  background-color: rgba(255, 152, 0, 0.1);
}

/* Управление видимостью для разных устройств */
.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
}

/* Адаптивность */
@media (max-width: 1024px) {
  .tasks-layout {
    grid-template-columns: 1fr;
  }

  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: block;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .section-header h2 {
    width: 100%;
    margin-bottom: 8px;
  }

  .section-header button {
    width: 100%;
  }

  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .filter-controls {
    width: 100%;
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  /* Уменьшаем отступы для мобильных устройств */
  .tasks-section {
    padding: 12px;
  }

  /* Модальное окно для мобильных */
  .form-actions {
    flex-direction: column;
  }

  .form-actions button {
    width: 100%;
  }
}

/* Еще более мелкие экраны */
@media (max-width: 480px) {
  .task-card-actions {
    flex-direction: column;
  }

  .task-card-actions .action-btn {
    width: 100%;
    justify-content: center;
  }
  .type-bar{
    min-width: 100%;
  }

  .stats-grid {
    gap: 8px;
  }

  .stat-card {
    padding: 12px 8px;
  }

  .stat-value {
    font-size: 20px;
  }

  .stat-label {
    font-size: 12px;
  }
}
</style>