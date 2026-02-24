<!-- src/components/admin/StatsSection.vue -->
<template>
  <div class="section-container">
    <div class="section-header">
      <h2>Статистика приложения</h2>
    </div>

    <div class="section-content">
      <LoadingSpinner v-if="loading" />

      <div v-else class="stats-layout">
        <!-- Общая статистика -->
        <BaseCard>
          <h3>Общая статистика</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ stats.totalUsers || 0 }}</div>
              <div class="stat-label">Всего пользователей</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ stats.activeUsers || 0 }}</div>
              <div class="stat-label">Активных пользователей</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ stats.newUsers || 0 }}</div>
              <div class="stat-label">Новых пользователей</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ formatMoney(stats.totalIncome || 0) }}</div>
              <div class="stat-label">Общий пассивный доход</div>
            </div>
          </div>
        </BaseCard>

        <!-- Статистика продуктов -->
        <BaseCard>
          <h3>Статистика продуктов</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ stats.totalProducts || 0 }}</div>
              <div class="stat-label">Всего продуктов</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ stats.activeProducts || 0 }}</div>
              <div class="stat-label">Активных продуктов</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ stats.totalClaims || 0 }}</div>
              <div class="stat-label">Всего заявок</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ stats.pendingClaims || 0 }}</div>
              <div class="stat-label">Ожидающих обработки</div>
            </div>
          </div>
        </BaseCard>

        <!-- Статистика заданий -->
        <BaseCard>
          <h3>Статистика заданий</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ stats.totalTasks || 0 }}</div>
              <div class="stat-label">Всего заданий</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ stats.activeTasks || 0 }}</div>
              <div class="stat-label">Активных заданий</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ stats.completedTasks || 0 }}</div>
              <div class="stat-label">Выполнено заданий</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ formatMoney(stats.totalRewards || 0) }}</div>
              <div class="stat-label">Выдано наград</div>
            </div>
          </div>
        </BaseCard>

        <!-- Статистика уведомлений -->
        <BaseCard>
          <h3>Статистика уведомлений</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ stats.totalNotifications || 0 }}</div>
              <div class="stat-label">Всего уведомлений</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ stats.totalSentNotifications || 0 }}</div>
              <div class="stat-label">Отправлено</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ stats.totalReadNotifications || 0 }}</div>
              <div class="stat-label">Прочитано</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ formatPercentage(stats.avgReadRate || 0) }}%</div>
              <div class="stat-label">Средний процент прочтения</div>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue';
import { ApiService } from '@/services/apiService';
import BaseCard from '@/components/ui/BaseCard.vue';
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue';

const notifications = inject('notifications');
const loading = ref(true);
const stats = ref({});

// Загрузка статистики
const loadStats = async () => {
  try {
    loading.value = true;

    // Получаем общую статистику
    const generalStats = await ApiService.getStats();

    // Получаем статистику уведомлений
    const notificationStats = await ApiService.getNotificationStats();

    // Объединяем данные
    stats.value = {
      ...generalStats,
      ...notificationStats
    };

  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
    notifications.addNotification({
      message: 'Ошибка при загрузке статистики',
      type: 'error'
    });
  } finally {
    loading.value = false;
  }
};

// Вспомогательные функции для форматирования
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

const formatPercentage = (value) => {
  return (value * 100).toFixed(1);
};

// Загружаем данные при монтировании компонента
onMounted(async () => {
  await loadStats();
});
</script>

<style scoped>
.section-container {
  width: 100%;
  max-height: 95%;
  overflow-y: scroll;
  display: flex;
  flex-direction: column;

}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.section-content {
  flex-grow: 1;
  overflow-y: auto;
  padding-bottom: 20px;
}

.stats-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
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
  color: var(--primary-color, #8C60E3);
}

.stat-label {
  font-size: 14px;
  color: #666;
}

@media (max-width: 1024px) {
  .stats-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>