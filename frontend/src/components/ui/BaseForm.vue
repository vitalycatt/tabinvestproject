<template>
  <form @submit.prevent="$emit('submit')">
    <slot></slot>
  </form>
</template>

<script setup>
defineEmits(['submit']);
</script>