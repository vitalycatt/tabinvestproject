<!-- src/components/NotificationsProvider.vue -->
<template>
  <div class="notifications-wrapper">
    <slot></slot>
  </div>
</template>

<script setup>
import { provide } from "vue";

// Тосты отключены: заглушки, вызовы не показывают уведомления
const addNotification = () => {};
const removeNotification = () => {};

provide("notifications", {
  addNotification,
  removeNotification,
});
</script>

<style scoped>
.notifications-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
