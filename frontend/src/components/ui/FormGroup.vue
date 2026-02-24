<!-- src/components/ui/FormGroup.vue -->
<template>
  <div class="form-group">
    <label v-if="label" class="form-label">{{ label }}</label>
    <slot></slot>
    <div v-if="error" class="form-error">{{ error }}</div>
  </div>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: ''
  }
});
</script>

<style scoped>
.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-error {
  color: #f44336;
  font-size: 12px;
  margin-top: 4px;
}
</style>