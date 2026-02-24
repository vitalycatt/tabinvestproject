<!-- src/components/game/EnergyBar.vue -->
<template>
  <div class="energy-boost" :class="{ 'no-energy': store.energy.current < 1 }">
    <!-- Энергия -->
    <div class="energy-item" :class="{ 'no-energy': store.energy.current < 1 }">
      <div class="item-icon">
        <img src="@/assets/images/energy.png" alt="energy">
      </div>
      <div class="item-count">{{ store.formattedEnergy }}</div>
      <div v-if="showRegenerationTime && timeUntilFull" class="regeneration-time">
        {{ timeUntilFull }}
      </div>
    </div>

    <!-- Ускорение -->
    <div class="energy-item" @click="$router.push('/boost')">
      <div class="item-icon">
        <img src="@/assets/images/money.png" alt="money">
      </div>
      <div class="item-text">Ускорение</div>
      <div v-if="hasActiveBoosts" class="boost-indicator">
        <span>{{ activeBoostText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { GameSettingsService } from '@/services/GameSettingsService'

const store = useGameStore()
const logger = inject('logger', console)
const timeUntilFull = ref('')
const showRegenerationTime = ref(true)
let timerInterval = null

// Проверка наличия активных бустов
const hasActiveBoosts = computed(() => {
  return store.boosts.tap3x.active || store.boosts.tap5x.active
})

// Текст активного буста
const activeBoostText = computed(() => {
  if (store.boosts.tap5x.active) {
    return `x5 (${formatBoostTime(store.boosts.tap5x.endTime)})`
  }
  if (store.boosts.tap3x.active) {
    return `x3 (${formatBoostTime(store.boosts.tap3x.endTime)})`
  }
  return ''
})

// Форматирование времени буста
const formatBoostTime = (endTime) => {
  if (!endTime) return ''

  const remainingMs = endTime - Date.now()
  if (remainingMs <= 0) return '00:00'

  const seconds = Math.floor(remainingMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}ч ${minutes % 60}м`
  } else {
    return `${minutes}м ${seconds % 60}с`
  }
}

// Вычисление времени до полного восстановления энергии
const updateTimeUntilFull = () => {
  if (store.energy.current >= store.energy.max) {
    timeUntilFull.value = ''
    return
  }

  const energyMissing = store.energy.max - store.energy.current
  const secondsToFull = Math.ceil(energyMissing / store.energy.regenRate)

  if (secondsToFull <= 0) {
    timeUntilFull.value = ''
    return
  }

  // Форматирование времени
  const hours = Math.floor(secondsToFull / 3600)
  const minutes = Math.floor((secondsToFull % 3600) / 60)
  const seconds = secondsToFull % 60

  if (hours > 0) {
    timeUntilFull.value = `${hours}ч ${minutes}м`
  } else if (minutes > 0) {
    timeUntilFull.value = `${minutes}м ${seconds}с`
  } else {
    timeUntilFull.value = `${seconds}с`
  }
}

onMounted(async () => {
  // Загрузка настроек визуализации энергии
  try {
    const showTime = await GameSettingsService.getSetting('energy.showRegenerationTime', true)
    showRegenerationTime.value = showTime

    // Проверяем, не нужно ли обновить скорость регенерации энергии
    const regenRate = await GameSettingsService.getSetting('energyRegenRate', null)
    if (regenRate !== null && regenRate !== store.energy.regenRate) {
      logger.log(`Обновляем скорость регенерации энергии: ${store.energy.regenRate} -> ${regenRate}`)
      store.energy.regenRate = regenRate
    }
  } catch (error) {
    logger.error('Ошибка загрузки настроек энергии:', error)
  }

  // Запускаем таймер обновления информации
  timerInterval = setInterval(() => {
    updateTimeUntilFull()
  }, 1000)
  updateTimeUntilFull() // Первое обновление сразу
})

onUnmounted(() => {
  // Очищаем таймер при размонтировании компонента
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>

<style scoped>
.energy-boost {
  position: fixed;
  bottom: 4.8rem;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.energy-item {
  display: flex;
  align-items: center;
  gap: 8px;
  transition: transform 0.2s ease;
  position: relative;
}

.energy-item:active {
  transform: scale(0.95);
}

.item-icon img {
  width: 28px;
  height: 28px;
}

.item-count,
.item-text {
  color: white;
  font-size: 16px;
  font-weight: 500;
  text-shadow:
      1px 1px 0 black,
      -1px -1px 0 black,
      -1px 1px 0 black,
      1px -1px 0 black;
}

.item-text {
  cursor: pointer;
}

.regeneration-time {
  position: absolute;
  top: -15px;
  left: 30px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 1px 1px 0 black;
}

.boost-indicator {
  position: absolute;
  top: -15px;
  left: 15px;
  background: var(--primary-color, #8C60E3);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  color: white;
  font-weight: bold;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.no-energy {
  animation: shake 0.5s ease-in-out;
}

.no-energy-shake {
  animation: shake 0.5s ease-in-out;
}
</style>