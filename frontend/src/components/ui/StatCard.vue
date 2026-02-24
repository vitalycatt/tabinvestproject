<!-- src/components/ui/StatCard.vue -->
<template>
  <BaseCard :class="['stat-card', classes]">
    <h3 class="stat-title">{{ title }}</h3>
    <p class="stat-value">{{ value }}</p>
    <p v-if="subtitle" class="stat-subtitle">{{ subtitle }}</p>
  </BaseCard>
</template>

<script setup>
import BaseCard from './BaseCard.vue'

defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  classes: {
    type: [String, Array, Object],
    default: ''
  }
})
</script>

<style scoped>
.stat-card {
  text-align: center;
}

.stat-title {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--primary-color);
  margin: 0;
}

.stat-subtitle {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>