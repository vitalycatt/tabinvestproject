// src/components/Tutorial.vue
<template>
  <Transition name="fade">
    <div v-if="showTutorial" class="tutorial-overlay">
      <div class="tutorial-content">
        <div :class="['tutorial-step', `tutorial-step-${currentStep}`]">
          <div class="instruction-title">
            <h1>{{ steps[currentStep - 1].title }}</h1>
          </div>
        </div>

        <button
            v-if="currentStep < steps.length"
            class="btn-next"
            @click="nextStep"
        >
          <svg width="21" height="36" viewBox="0 0 21 36" fill="none">
            <path d="M2 2L18 18L2 34" stroke="white" stroke-width="4"/>
          </svg>
        </button>

        <button
            v-else
            class="btn-play"
            @click="completeTutorial"
        >
          Играть
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()
const showTutorial = ref(false)
const currentStep = ref(1)

const steps = [
  {
    title: 'Кликайте на экран, зарабатывайте монеты и увеличивайте свой пассивных доход'
  },
  {
    title: 'Прокачивайте персонажа и выполняйте задания'
  },
  {
    title: 'Приглашайте друзей и получайте бонусы'
  },
  {
    title: 'Используйте накопленный доход для получения реальных продуктов'
  }
]

onMounted(() => {
  const tutorialCompleted = localStorage.getItem('tutorialCompleted')
  if (!tutorialCompleted) {
    showTutorial.value = true
  }
})

const nextStep = () => {
  if (currentStep.value < steps.length) {
    currentStep.value++
  }
}

const completeTutorial = () => {
  localStorage.setItem('tutorialCompleted', 'true')
  showTutorial.value = false
}
</script>

<style scoped>
.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: var(--background-color);
}

.tutorial-content {
  height: 100%;
  width: 100%;
  position: relative;
}

.tutorial-step {
  height: 100%;
  width: 100%;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 60px;
}

.tutorial-step-1 {
  background-image: url('@/assets/images/onboarding/1.jpg');
}

.tutorial-step-2 {
  background-image: url('@/assets/images/onboarding/2.jpg');
}

.tutorial-step-3 {
  background-image: url('@/assets/images/onboarding/3.jpg');
}

.tutorial-step-4 {
  background-image: url('@/assets/images/onboarding/4.jpg');
}

.instruction-title {
  text-align: center;
  padding: 0 20px;
}

.instruction-title h1 {
  color: white;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  margin: 0;
}

.btn-next {
  position: fixed;
  bottom: 40px;
  right: 40px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
}

.btn-play {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 16px 48px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-play:hover {
  opacity: 0.9;
  transform: translateX(-50%) translateY(-2px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .instruction-title h1 {
    font-size: 20px;
  }

  .btn-next {
    bottom: 20px;
    right: 20px;
  }

  .btn-play {
    bottom: 20px;
    padding: 12px 36px;
    font-size: 16px;
  }
}
</style>