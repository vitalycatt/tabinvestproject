<!-- src/components/game/Balance.vue -->
<template>
  <div class="balance">
    <img src="../../assets/images/coin.png" class="balance__icon" alt="coin">
    <span class="balance__amount" :class="{ 'balance__amount--increasing': isIncreasing }">
      {{ formattedBalance }}
    </span>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, inject } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { GameSettingsService } from '@/services/GameSettingsService'

const store = useGameStore()
const logger = inject('logger', console)
const isIncreasing = ref(false)
let previousBalance = store.balance

// Настраиваемые параметры форматирования
const useCustomFormat = ref(false)
const customFormatting = ref({
  useSpaces: true,
  animation: {
    duration: 100, // время анимации в мс
    enabled: true   // включена ли анимация
  }
})

// Загрузка настроек при монтировании
onMounted(async () => {
  try {
    // Загрузка настроек форматирования
    const customFormat = await GameSettingsService.getSetting('balance.useCustomFormat', false)
    useCustomFormat.value = customFormat

    // Загрузка настроек пробелов и анимации
    const formatting = await GameSettingsService.getSetting('balance.formatting', null)
    if (formatting && typeof formatting === 'object') {
      customFormatting.value = {
        ...customFormatting.value,
        ...formatting
      }
      logger.log('Загружены настройки форматирования баланса:', formatting)
    }

    // Инициализация с текущим балансом
    previousBalance = store.balance
  } catch (error) {
    logger.error('Ошибка загрузки настроек баланса:', error)
  }
})

// Форматированный баланс с учетом настроек
const formattedBalance = computed(() => {
  // Округляем баланс до целого числа
  const value = Math.floor(store.balance)

  // Применяем форматирование с пробелами или без, в зависимости от настроек
  if (customFormatting.value.useSpaces) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  } else {
    return value.toString()
  }
})

// Следим за изменением баланса и применяем анимацию
watch(() => store.balance, (newBalance) => {
  // Если анимация отключена в настройках, не применяем её
  if (!customFormatting.value.animation.enabled) {
    previousBalance = newBalance
    return
  }

  if (newBalance > previousBalance) {
    isIncreasing.value = true
    setTimeout(() => {
      isIncreasing.value = false
    }, customFormatting.value.animation.duration) // Настраиваемое время анимации
  }
  previousBalance = newBalance
}, { immediate: true })
</script>

<style scoped>
.balance {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 19px auto;
}

.balance__icon {
  width: 36px;
  height: 36px;
}

.balance__amount {
  margin-left: 12px;
  font-size: 36px;
  font-weight: 700;
  line-height: 42px;
  letter-spacing: -0.02em;
  color: white;
  transition: color 0.3s ease;
  font-variant-numeric: tabular-nums;
}

.balance__amount--increasing {
  color: #fff;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
</style>