<!-- src/components/admin/NotificationStats.vue -->
<template>
  <div class="notification-stats">
    <div class="stat-row">
      <div class="stat-label">Отправлено:</div>
      <div class="stat-value">{{ stats?.sentCount || 0 }}</div>
    </div>
    <div class="stat-row">
      <div class="stat-label">Прочитано:</div>
      <div class="stat-value">{{ stats?.readCount || 0 }}</div>
    </div>
    <div class="stat-row">
      <div class="stat-label">Процент прочтения:</div>
      <div class="stat-value">{{ readPercentage }}%</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  stats: {
    type: Object,
    default: () => ({ sentCount: 0, readCount: 0 })
  }
});

const readPercentage = computed(() => {
  if (!props.stats.sentCount || props.stats.sentCount === 0) {
    return '0.0';
  }
  const percent = (props.stats.readCount / props.stats.sentCount) * 100;
  return percent.toFixed(1);
});
</script>

<style scoped>
.notification-stats {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  margin-top: 12px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.stat-label {
  color: #666;
}

.stat-value {
  font-weight: 500;
}
</style>