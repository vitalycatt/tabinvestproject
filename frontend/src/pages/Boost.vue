<!-- src/pages/Boost.vue -->
<template>
  <div class="boost-page">
    <!-- Кнопка возврата -->
    <div class="back-button" @click="$router.push('/')">
      <img src="@/assets/images/left-arrow.svg" alt="Назад" class="back-arrow">
    </div>

    <div class="boost-area">
      <h3>Ваш баланс</h3>
      <Balance />

      <div class="boost-options">
        <h3>Бесплатные ежедневные усилители</h3>
        <div class="boost-option" @click="handleFullEnergy">
          <img src="@/assets/images/energy.png" alt="Energy" class="boost-icon">
          <div class="boost-content">
            <div class="boost-name">Полная энергия</div>
            <div class="boost-available">Доступно {{ dailyBoosts.fullEnergy }}/6</div>
          </div>
        </div>

        <h3>Усилители</h3>
        <!-- Мультитап x3 -->
        <div class="boost-option" @click="handleBoost('tap3x', 8000)">
          <img src="@/assets/images/finger.png" alt="Multitap" class="boost-icon">
          <div class="boost-content">
            <div class="boost-name">Мультитап</div>
            <div class="boost-description">Увеличить количество монет за нажатие до 3</div>
            <div class="boost-cost">
              <CoinIcon />
              <span>8K</span>
            </div>
          </div>
        </div>

        <!-- Мультитап x5 -->
        <div class="boost-option" @click="handleBoost('tap5x', 25000)">
          <img src="@/assets/images/finger.png" alt="Multitap" class="boost-icon">
          <div class="boost-content">
            <div class="boost-name">Мультитап</div>
            <div class="boost-description">Увеличить количество монет за нажатие до 5</div>
            <div class="boost-cost">
              <CoinIcon />
              <span>25K</span>
            </div>
          </div>
        </div>

        <!-- Увеличение энергии до 3000 -->
        <div class="boost-option" @click="handleEnergyUpgrade(3000, 5000)">
          <img src="@/assets/images/Battery.png" alt="Energy Limit" class="boost-icon">
          <div class="boost-content">
            <div class="boost-name">Лимит энергии</div>
            <div class="boost-description">Увеличить максимальную энергию до 3000</div>
            <div class="boost-cost">
              <CoinIcon />
              <span>5K</span>
            </div>
          </div>
        </div>

        <!-- Увеличение энергии до 5000 -->
        <div class="boost-option" @click="handleEnergyUpgrade(5000, 10000)">
          <img src="@/assets/images/Battery.png" alt="Energy Limit" class="boost-icon">
          <div class="boost-content">
            <div class="boost-name">Лимит энергии</div>
            <div class="boost-description">Увеличить максимальную энергию до 5000</div>
            <div class="boost-cost">
              <CoinIcon />
              <span>10K</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Navigation />
  </div>
</template>

<script setup>
import { ref, inject, onMounted } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import Balance from '@/components/game/Balance.vue'
import Navigation from '@/components/layout/Navigation.vue'
import CoinIcon from '@/components/ui/CoinIcon.vue'

const store = useGameStore()
const notifications = inject('notifications')

// Состояние ежедневных бустов
const dailyBoosts = ref({
  fullEnergy: 6,
  lastReset: null
})

// Загрузка состояния ежедневных бустов
onMounted(() => {
  const saved = localStorage.getItem('dailyBoosts')
  if (saved) {
    const parsed = JSON.parse(saved)
    const lastReset = new Date(parsed.lastReset)
    const now = new Date()

    // Сброс бустов в начале нового дня
    if (lastReset.getDate() !== now.getDate()) {
      resetDailyBoosts()
    } else {
      dailyBoosts.value = parsed
    }
  }
})

// Сброс ежедневных бустов
const resetDailyBoosts = () => {
  dailyBoosts.value = {
    fullEnergy: 6,
    lastReset: new Date().toISOString()
  }
  saveDailyBoosts()
}

// Сохранение состояния ежедневных бустов
const saveDailyBoosts = () => {
  localStorage.setItem('dailyBoosts', JSON.stringify(dailyBoosts.value))
}

// Обработка полного восстановления энергии
const handleFullEnergy = () => {
  if (dailyBoosts.value.fullEnergy <= 0) {
    notifications.addNotification({
      message: 'Нет доступных восстановлений энергии',
      type: 'error'
    })
    return
  }

  store.energy.current = store.energy.max
  dailyBoosts.value.fullEnergy--
  saveDailyBoosts()

  notifications.addNotification({
    message: 'Энергия восстановлена!',
    type: 'success'
  })
}

// Обработка покупки буста
const handleBoost = (type, cost) => {
  if (store.balance < cost) {
    notifications.addNotification({
      message: 'Недостаточно монет',
      type: 'error'
    })
    return
  }

  store.balance -= cost
  const duration = 24 * 60 * 60 * 1000 // 24 часа
  store.applyBoost(type, duration)

  notifications.addNotification({
    message: `Буст х${type === 'tap3x' ? '3' : '5'} активирован на 24 часа!`,
    type: 'success'
  })
}

// Обработка улучшения максимальной энергии
const handleEnergyUpgrade = (newMax, cost) => {
  if (store.balance < cost) {
    notifications.addNotification({
      message: 'Недостаточно монет',
      type: 'error'
    })
    return
  }

  if (store.energy.max >= newMax) {
    notifications.addNotification({
      message: 'У вас уже есть это улучшение',
      type: 'error'
    })
    return
  }

  store.balance -= cost
  store.upgradeEnergy(newMax)

  notifications.addNotification({
    message: `Максимальная энергия увеличена до ${newMax}!`,
    type: 'success'
  })
}
</script>

<style scoped>
.boost-page {
  min-height: 100vh;
  padding: 1rem;
  background: url('@/assets/images/bg.jpg') center top / cover no-repeat;
}

.back-button {
  position: fixed;
  top: 40px;
  left: 30px;
  cursor: pointer;
}

.back-arrow {
  width: 16px;
  height: 32px;
}

.boost-area {
  padding-top: 50px;
}

.boost-area h3 {
  color: white;
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  margin: 20px 0;
}

.boost-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  max-height: 65vh;
  overflow: auto;
}

.boost-option {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(140, 96, 227, 0.3);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.boost-option:hover {
  border-color: rgba(140, 96, 227, 0.5);
  background: rgba(140, 96, 227, 0.1);
}

.boost-option:active {
  transform: scale(0.98);
}

.boost-icon {
  width: 54px;
  height: 54px;
  margin-right: 15px;
}

.boost-content {
  flex: 1;
}

.boost-name {
  font-size: 16px;
  font-weight: 500;
  color: white;
  margin-bottom: 4px;
}

.boost-description {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.boost-cost {
  display: flex;
  align-items: center;
  gap: 4px;
  color: white;
}

.boost-available {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}
</style>