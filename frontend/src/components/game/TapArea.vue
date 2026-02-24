<template>
  <div ref="tapAreaRef" :style="areaBackgroundStyle" class="tap-area">
    <!-- Обёртка монеты с позиционированием и зонами подсветки -->
    <div
        ref="mainCoinRef"
        class="coin-wrapper"
        @mousedown="handleTap"
        @touchstart.prevent="handleTap"
    >
      <img
          :src="currentTiltImage"
          alt="moneta"
          class="clickable-coin"
          draggable="false"
      />

      <!-- Зоны для визуализации областей -->
      <div :class="{ active: activeZone === 'up' }" class="zone zone-up"></div>
      <div :class="{ active: activeZone === 'center' }" class="zone zone-center"></div>
      <div :class="{ active: activeZone === 'down' }" class="zone zone-down"></div>
      <div :class="{ active: activeZone === 'left' }" class="zone zone-left"></div>
      <div :class="{ active: activeZone === 'right' }" class="zone zone-right"></div>
    </div>

    <!-- Всплывающие монетки -->
    <TransitionGroup name="coin">
      <div
          v-for="coin in coins"
          :key="coin.id"
          :style="{ left: `${coin.x}px`, top: `${coin.y}px` }"
          class="coin-popup"
      >
        <img alt="coin" class="coin-image" src="@/assets/images/coin.png"/>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import {computed, inject, onMounted, ref} from 'vue'
import {useGameStore} from '@/stores/gameStore'
import {GameSettingsService} from '@/services/GameSettingsService'

import monetaTilt1 from '@/assets/images/bg-moneta-tilt1.png' // главная монета
import monetaUp from '@/assets/images/bg-moneta-up.png'
import monetaDown from '@/assets/images/bg-moneta-down.png'
import monetaLeft from '@/assets/images/bg-moneta-left.png'
import monetaRight from '@/assets/images/bg-moneta-rignt.png'
import bgMoneta from '@/assets/images/bg-moneta.png'

const currentTiltImage = ref(monetaTilt1)
const store = useGameStore()
const tapAreaRef = ref(null)
const coins = ref([])
let coinId = 0
const logger = inject('logger', console)
const isMainAnimating = ref(false)
const activeZone = ref(null) // для визуализации зон

const defaultAnimation = ref({
  duration: 150,
  maxOffset: 0.6
})

onMounted(async () => {
  try {
    const animSettings = await GameSettingsService.getSetting('tapAnimation', null)
    if (animSettings && typeof animSettings === 'object') {
      defaultAnimation.value = {
        ...defaultAnimation.value,
        ...animSettings
      }
      logger.log('Загружены настройки анимации тапа:', animSettings)
    }
  } catch (error) {
    logger.error('Ошибка загрузки настроек для TapArea:', error)
  }
})

const areaBackgroundStyle = computed(() => ({
  backgroundImage: `url(${bgMoneta})`,
  backgroundSize: '100% 100%',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat'
}))

const getTiltDirection = (x, y, rect) => {
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  const dx = x - centerX
  const dy = y - centerY

  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)

  const threshold = 10 // порог для центра

  if (absDx < threshold && absDy < threshold) return 'center'

  if (absDx > absDy) {
    return dx > 0 ? 'right' : 'left'
  }

  if (dy > threshold) return 'down'

  if (dy < -threshold) return 'up'

  return 'center'
}

const triggerMainCoinAnimation = (direction) => {
  logger.log('Тап по зоне:', direction)
  if (isMainAnimating.value) return

  switch (direction) {
    case 'up':
      currentTiltImage.value = monetaUp
      break
    case 'down':
      currentTiltImage.value = monetaDown
      break
    case 'left':
      currentTiltImage.value = monetaLeft
      break
    case 'right':
      currentTiltImage.value = monetaRight
      break
    case 'center':
    default:
      currentTiltImage.value = monetaTilt1
  }

  isMainAnimating.value = true
  activeZone.value = direction

  setTimeout(() => {
    currentTiltImage.value = monetaTilt1
    isMainAnimating.value = false
    activeZone.value = null
  }, defaultAnimation.value.duration)
}

const mainCoinRef = ref(null)

const handleTap = async (event) => {
  const el = tapAreaRef.value
  if (!el || !store.canTap) return

  // Получаем rect монеты
  const mainRect = mainCoinRef.value?.getBoundingClientRect()
  if (!mainRect) return

  let x, y

  if (event.touches?.[0]) {
    x = event.touches[0].clientX - mainRect.left
    y = event.touches[0].clientY - mainRect.top
  } else {
    x = event.clientX - mainRect.left
    y = event.clientY - mainRect.top
  }

  // Проверяем что координаты внутри монеты
  if (x < 0 || x > mainRect.width || y < 0 || y > mainRect.height) return

  // Получаем направление по координатам внутри монеты
  const direction = getTiltDirection(x, y, mainRect)
  triggerMainCoinAnimation(direction)

  // Для всплывающих монет используем координаты относительно tapArea
  const tapAreaRect = el.getBoundingClientRect()
  let coinX, coinY
  if (event.touches?.[0]) {
    coinX = event.touches[0].clientX - tapAreaRect.left
    coinY = event.touches[0].clientY - tapAreaRect.top
  } else {
    coinX = event.clientX - tapAreaRect.left
    coinY = event.clientY - tapAreaRect.top
  }

  const reward = await executeHandleTap()
  if (reward > 0) {
    createCoin(coinX, coinY, reward)
  }
}


const executeHandleTap = async () => {
  if (typeof store.handleTap === 'function') {
    console.log(store.currentUser)
    return await store.handleTap(store.currentUser.id)
  }

  logger.warn('store.handleTap не найден, fallback реализация')

  if (store.energy.current < 1) return 0
  store.energy.current--
  const reward = store.effectiveTapValue
  store.balance += reward

  if (store.stats) {
    store.stats.totalClicks = (store.stats.totalClicks || 0) + 1
    store.stats.totalEarned = (store.stats.totalEarned || 0) + reward
  }

  if (typeof store.saveState === 'function') store.saveState()
  return reward
}

const createCoin = (x, y, value) => {
  const el = tapAreaRef.value
  if (!el) return

  const maxX = el.clientWidth
  const maxY = el.clientHeight

  const coin = {
    id: coinId++,
    x: Math.max(15, Math.min(x - 15, maxX - 30)),
    y: Math.max(15, Math.min(y - 15, maxY - 30)),
    value
  }

  coins.value = [...coins.value, coin]

  setTimeout(() => {
    coins.value = coins.value.filter((c) => c.id !== coin.id)
  }, 1000)
}
</script>

<style scoped>
.tap-area {
  position: relative;
  width: 105%;
  margin-left: -2.5%;
  height: 100vh;
  border: 5px solid #8c60e3;
  border-radius: 60px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  user-select: none;
  -webkit-user-select: none;
}

.coin-wrapper {
  position: absolute;
  top: 30%;
  left: 50%;
  width: 88%;
  height: auto;
  transform: translate(-50%, -50%);
  user-select: none;
  pointer-events: auto;
}

/* Монета */
.clickable-coin {
  width: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-touch-callout: none;
  -webkit-user-drag: none;
  filter: drop-shadow(0 0 10px rgba(253, 228, 1, 0.938));
  transition: filter 0.3s ease;
}

.clickable-coin.animate {
  animation: bump 0.3s ease-out forwards;
  filter: drop-shadow(0 0 18px rgb(238, 255, 0));
}

/* Зоны подсветки */
/* Общие стили 
.zone {
  position: absolute;
  pointer-events: none;
  opacity: 0.3;
  border-radius: 20px;
  transition: opacity 0.15s ease;
  background-color: rgba(255, 0, 0, 0.15);
}*/

/* Активная зона 
.zone.active {
  opacity: 0.6;
  background-color: rgba(255, 0, 0, 0.4);
}*/

/* Вертикальные зоны */
.zone-up {
  top: 0;
  left: 20%;
  width: 60%;
  height: 35%;
}

.zone-center {
  top: 35%;
  left: 20%;
  width: 60%;
  height: 30%;
  border-radius: 40px;
}

.zone-down {
  bottom: 0;
  left: 20%;
  width: 60%;
  height: 35%;
}

/* Горизонтальные зоны */
.zone-left {
  top: 20%;
  left: 0;
  width: 20%;
  height: 60%;
  border-radius: 40px 0 0 40px;
}

.zone-right {
  top: 20%;
  right: 0;
  width: 20%;
  height: 60%;
  border-radius: 0 40px 40px 0;
}

/* Всплывающие монетки */
.coin-popup {
  position: absolute;
  width: 40px;
  height: 40px;
  pointer-events: none;
  z-index: 1000;
  animation: floatUp 1s ease-out forwards;
}

@keyframes floatUp {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
  50% {
    opacity: 1;
    transform: translate(0, -25px) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translate(0, -50px) scale(0.8);
  }
}

.coin-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  animation: coinGlow 0.7s ease-out;
}

@keyframes coinGlow {
  0% {
    filter: drop-shadow(0 0 0 rgba(255, 255, 0, 0));
  }
  50% {
    filter: drop-shadow(0 0 10px rgba(217, 255, 2, 0.911));
  }
  100% {
    filter: drop-shadow(0 0 0 rgba(255, 255, 0, 0));
  }
}
</style>
