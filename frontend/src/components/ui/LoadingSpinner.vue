<!-- src/components/ui/LoadingSpinner.vue -->
<template>
  <div class="loading-container">
    <div class="spinner"></div>
    <p v-if="message" class="message">{{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: 'Загрузка...'
  }
});
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  width: 100%;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(140, 96, 227, 0.2);
  border-top-color: var(--primary-color, #8C60E3);
  border-radius: 50%;
  animation: spin 1s ease-in-out infinite;
}

.message {
  margin-top: 15px;
  color: #666;
  font-size: 14px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>