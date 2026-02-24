<!-- src/components/ui/BaseButton.vue -->
<template>
  <button
      class="base-button"
      :class="buttonClass"
      :disabled="disabled"
      @click="$emit('click')"
  >
    <slot></slot>
  </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  type: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'danger', 'success'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const buttonClass = computed(() => props.type);

defineEmits(['click']);
</script>

<style scoped>
.base-button {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.base-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.primary {
  background-color: var(--primary-color, #8C60E3);
  color: white;
}

.primary:hover:not(:disabled) {
  background-color: #7550c8;
}

.secondary {
  background-color: #f2f2f2;
  color: #333;
}

.secondary:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.danger {
  background-color: #f44336;
  color: white;
}

.danger:hover:not(:disabled) {
  background-color: #d32f2f;
}

.success {
  background-color: #4caf50;
  color: white;
}

.success:hover:not(:disabled) {
  background-color: #388e3c;
}
</style>