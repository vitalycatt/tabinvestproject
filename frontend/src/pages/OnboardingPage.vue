<!-- src/pages/OnboardingPage.vue -->
<template>
  <div class="onboarding-container">
    <div class="onboarding-slides" :style="{ transform: `translateX(-${currentSlide * 100}%)` }">
      <!-- Слайд 1: Кликайте на экран -->
      <div class="slide">
        <h2 class="slide-title">Кликайте на экран, зарабатывайте монеты и увеличивайте свой пассивный доход</h2>
        <div class="slide-content">
          <div class="screen-preview screen-1"></div>
        </div>

        <div class="next-button-container">
          <button class="next-button" @click="nextSlide">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18l6-6-6-6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Слайд 2: Используйте карточки (бывший слайд 3) -->
      <div class="slide">
        <h2 class="slide-title">Используйте карточки, чтобы увеличить пассивный доход</h2>
        <div class="slide-content">
          <div class="screen-preview screen-3"></div>
        </div>

        <div class="next-button-container">
          <button class="next-button" @click="nextSlide">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18l6-6-6-6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Слайд 3: Используйте накопленный доход (бывший слайд 4) -->
      <div class="slide">
        <h2 class="slide-title">Используйте накопленный доход для получения реальных продуктов</h2>
        <div class="slide-content">
          <div class="screen-preview screen-4"></div>
        </div>

        <button class="play-button" @click="finishOnboarding">
          Играть
        </button>
      </div>

      <!-- Слайд 4: Приглашайте друзей (бывший слайд 5) -->
      <div class="slide">
        <h2 class="slide-title">Приглашайте друзей и получайте бонусы</h2>
        <div class="slide-content">
          <div class="screen-preview screen-5"></div>
        </div>

        <div class="next-button-container">
          <button class="next-button" @click="nextSlide">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18l6-6-6-6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const currentSlide = ref(0);

function nextSlide() {
  if (currentSlide.value < 3) { // Уменьшено максимальное значение с 4 до 3
    currentSlide.value++;
  } else {
    currentSlide.value = 0;
  }
}

function prevSlide() {
  if (currentSlide.value > 0) {
    currentSlide.value--;
  } else {
    currentSlide.value = 3; // Уменьшено максимальное значение с 4 до 3
  }
}

function goToSlide(index) {
  if (index >= 0 && index < 4) { // Уменьшено количество слайдов с 5 до 4
    currentSlide.value = index;
  }
}

function finishOnboarding() {
  console.log('[ONBOARDING] Завершение онбординга');

  // Отмечаем, что пользователь прошел онбординг
  localStorage.setItem('onboardingCompleted', 'true');

  // Переходим на главную страницу
  router.replace('/');
}
</script>

<style scoped>
.onboarding-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: #000;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.onboarding-slides {
  display: flex;
  flex: 1;
  transition: transform 0.4s ease;
}

.slide {
  min-width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  box-sizing: border-box;
  position: relative;
}

.slide-title {
  font-size: 22px;
  line-height: 1.3;
  text-align: center;
  color: white;
  font-weight: 600;
  margin: 40px 0 20px;
}

.slide-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.screen-preview {
  width: 100%;
  background-position: center;
  background-repeat: no-repeat;
  background-size: 100%;
  height: 120vh;
  position: absolute;
  top: -180px;
  z-index: -1;
}

/* Фоновые изображения слайдов */
.screen-1 {
  background-image: url('/images/onboarding/1.jpg');
}

.screen-3 {
  background-image: url('/images/onboarding/3.jpg');
}

.screen-4 {
  background-image: url('/images/onboarding/4.jpg');
}

/* Добавляем стиль для screen-5, который не был определен в оригинале */
.screen-5 {
  background-image: url('/images/onboarding/5.jpg'); /* Предполагаем, что есть файл 5.jpg */
}

.next-button-container {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 10;
}

.next-button {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: #8C60E3;
  color: white;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.next-button svg {
  width: 24px;
  height: 24px;
}

.play-button {
  width: 80%;
  height: 50px;
  margin: 0 auto 20px auto;
  border-radius: 8px;
  background: #8C60E3;
  color: white;
  border: none;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;

}

/* Адаптивные стили */
@media (max-height: 700px) {
  .slide-title {
    font-size: 20px;
    margin: 30px 0 15px;
  }

  .screen-preview {
    height: 120vh;
  }
}

@media (max-height: 600px) {
  .slide-title {
    font-size: 18px;
    margin: 20px 0 10px;
  }

  .screen-preview {
    height: calc(100vh - 120px);
  }

  .next-button {
    height: 40px;
    width: 40px;
  }

  .play-button {
    height: 45px;
    margin-top: 15px;
  }
}

/* Для компактных устройств */
@media (max-width: 340px) {
  .slide-title {
    font-size: 16px;
  }
}
</style>