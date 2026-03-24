<!-- src/components/Loading.vue -->
<template>
  <div class="loading-container">
    <div class="loading-content">
      <h1 class="top-title">
        ПРИЛОЖЕНИЕ ДЛЯ ФОРМИРОВАНИЯ<br />ПАССИВНОГО ДОХОДА
      </h1>

      <div class="blue-box">
        <div class="title-text">ТАПАЛКА</div>
        <div class="subtitle-text">ДЛЯ</div>
        <div class="subtitle-text">ПАССИВНОГО ДОХОДА</div>
      </div>

      <div v-if="error" class="error-block">
        <div class="error-text">Не удалось загрузить приложение</div>
        <button class="retry-btn" @click="$emit('retry')">
          Попробовать снова
        </button>
      </div>

      <div v-else class="loading-progress">
        <div class="loading-text">ЗАГРУЗКА...</div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";

const props = defineProps({
  duration: {
    type: Number,
    default: 3000,
  },
  error: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["loading-complete", "retry"]);

const progress = ref(0);
let animationTimer;

watch(
  () => props.error,
  (hasError) => {
    if (hasError && animationTimer) {
      cancelAnimationFrame(animationTimer);
    }
  }
);

onMounted(() => {
  console.log("[LOADING] Component mounted, fixed duration:", props.duration);

  const startTime = Date.now();
  const endTime = startTime + props.duration;

  const updateProgress = () => {
    if (props.error) return;

    const now = Date.now();
    const elapsed = now - startTime;
    const percentage = Math.min(100, (elapsed / props.duration) * 100);

    progress.value = Math.floor(percentage);

    if (now < endTime) {
      // Продолжаем анимацию
      animationTimer = requestAnimationFrame(updateProgress);
    } else {
      // Загрузка завершена
      progress.value = 100;
      console.log("[LOADING] Animation complete, emitting event");

      // Фиксированная задержка перед эмитом события
      setTimeout(() => {
        if (!props.error) {
          console.log("[LOADING] Emitting loading-complete event");
          emit("loading-complete");
        }
      }, 500);
    }
  };

  // Запускаем анимацию
  animationTimer = requestAnimationFrame(updateProgress);
});

onUnmounted(() => {
  console.log("[LOADING] Component unmounted, cleaning up");
  if (animationTimer) {
    cancelAnimationFrame(animationTimer);
  }
});
</script>

<style scoped>
.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: url("@/assets/loading_bg.png") center center no-repeat;
  background-size: cover;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100vh;
  padding: 50px 20px;
  box-sizing: border-box;
}

.top-title {
  color: white;
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  margin-top: 40px;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.7);
  letter-spacing: 1px;
}

.blue-box {
  background-color: rgba(0, 45, 100, 0.85);
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-radius: 10px;
  padding: 20px 30px;
  text-align: center;
  min-width: 300px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.title-text {
  color: #ffd700;
  font-size: 42px;
  font-weight: 800;
  margin-bottom: 10px;
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.subtitle-text {
  color: white;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 1px;
}

.error-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-bottom: 50px;
}

.error-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.7);
}

.retry-btn {
  padding: 14px 40px;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.6);
  background: rgba(0, 45, 100, 0.85);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 1px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  transition: transform 0.2s, background 0.2s;
}

.retry-btn:active {
  transform: scale(0.96);
  background: rgba(0, 45, 100, 1);
}

.loading-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80%;
  max-width: 300px;
  margin-bottom: 50px;
}

.loading-text {
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.7);
}

.progress-bar {
  width: 100%;
  height: 10px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 5px;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3) inset;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffffff, #f5f5f5);
  border-radius: 5px;
  transition: width 0.2s ease;
}

@media (max-width: 480px) {
  .top-title {
    font-size: 18px;
  }

  .title-text {
    font-size: 36px;
  }

  .subtitle-text {
    font-size: 18px;
  }
}
</style>
