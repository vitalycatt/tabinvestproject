// Создайте компонент Logger.vue
<template>
  <div class="logger" v-if="logs.length">
    <div v-for="log in logs" :key="log.id" class="log-item">
      {{ log.message }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const logs = ref([])

const addLog = (message) => {
  logs.value.push({
    id: Date.now(),
    message: JSON.stringify(message)
  })
}

// Экспортируем для использования в других компонентах
defineExpose({ addLog })
</script>

<style scoped>
.logger {
  position: fixed;
  top: 20px;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.8);
  color: white;
  z-index: 9999;
  max-height: 200px;
  overflow-y: auto;
  font-size: 12px;
}

.log-item {
  padding: 4px 8px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
</style>