<template>
  <div class="transfer-page">
    <!-- Заголовок -->
    <div class="transfer-header">
      <button v-if="canGoBack" class="back-btn" @click="handleBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="transfer-title">{{ headerTitle }}</h1>
    </div>

    <!-- Вкладки -->
    <div v-if="store.step === 'search'" class="tabs">
      <button
        class="tab-btn"
        :class="{ active: store.activeTab === 'send' }"
        @click="store.activeTab = 'send'"
      >
        Отправить
      </button>
      <button
        class="tab-btn"
        :class="{ active: store.activeTab === 'history' }"
        @click="switchToHistory"
      >
        История
      </button>
    </div>

    <!-- Контент: Отправка -->
    <div v-if="store.activeTab === 'send'" class="transfer-content">
      <!-- Шаг 1: Поиск -->
      <div v-if="store.step === 'search'" class="step-search">
        <div class="search-box">
          <input
            v-model="store.searchQuery"
            type="text"
            class="search-input"
            placeholder="Введите username или Telegram ID"
            @input="onSearchInput"
          />
          <button
            class="search-btn"
            :disabled="store.searchLoading || !store.searchQuery.trim()"
            @click="doSearch"
          >
            <span v-if="store.searchLoading" class="spinner-small"></span>
            <span v-else>Найти</span>
          </button>
        </div>

        <div v-if="store.searchError" class="search-error">
          {{ store.searchError }}
        </div>

        <div v-if="store.searchResult" class="user-card">
          <div class="user-avatar">
            <img
              v-if="store.searchResult.photo_url"
              :src="store.searchResult.photo_url"
              alt=""
              class="avatar-img"
            />
            <div v-else class="avatar-placeholder">
              {{ avatarLetter(store.searchResult) }}
            </div>
          </div>
          <div class="user-info">
            <div class="user-name">
              {{ store.searchResult.first_name }}
              {{ store.searchResult.last_name || '' }}
            </div>
            <div v-if="store.searchResult.username" class="user-username">
              @{{ store.searchResult.username }}
            </div>
            <div class="user-id">ID: {{ store.searchResult.telegramId }}</div>
          </div>
          <button
            class="select-btn"
            :disabled="isSelf(store.searchResult)"
            @click="store.selectRecipient(store.searchResult)"
          >
            {{ isSelf(store.searchResult) ? 'Это вы' : 'Выбрать' }}
          </button>
        </div>
      </div>

      <!-- Шаг 2: Сумма -->
      <div v-if="store.step === 'amount'" class="step-amount">
        <div class="recipient-mini">
          Получатель:
          <strong>
            {{ store.selectedRecipient.first_name }}
            <span v-if="store.selectedRecipient.username">
              (@{{ store.selectedRecipient.username }})
            </span>
          </strong>
        </div>

        <div class="balance-display">
          Доступно: <strong>{{ formatNumber(currentBalance) }}</strong> монет
        </div>

        <div class="amount-input-wrap">
          <input
            v-model="store.transferAmount"
            type="number"
            inputmode="numeric"
            class="amount-input"
            placeholder="Введите сумму"
            min="1"
            :max="currentBalance"
          />
        </div>

        <div class="quick-buttons">
          <button class="quick-btn" @click="addAmount(100)">+100</button>
          <button class="quick-btn" @click="addAmount(500)">+500</button>
          <button class="quick-btn" @click="addAmount(1000)">+1000</button>
          <button class="quick-btn" @click="setAllBalance">Все</button>
        </div>

        <div v-if="amountError" class="amount-error">{{ amountError }}</div>

        <button
          class="primary-btn"
          :disabled="!isAmountValid"
          @click="store.goToConfirm(store.transferAmount)"
        >
          Далее
        </button>
      </div>

      <!-- Шаг 3: Подтверждение -->
      <div v-if="store.step === 'confirm'" class="step-confirm">
        <div class="confirm-card">
          <div class="confirm-row">
            <span class="confirm-label">Кому</span>
            <span class="confirm-value">
              {{ store.selectedRecipient.first_name }}
              {{ store.selectedRecipient.last_name || '' }}
              <span v-if="store.selectedRecipient.username" class="confirm-username">
                @{{ store.selectedRecipient.username }}
              </span>
            </span>
          </div>
          <div class="confirm-row">
            <span class="confirm-label">Сумма</span>
            <span class="confirm-value confirm-amount">
              {{ formatNumber(Number(store.transferAmount)) }} монет
            </span>
          </div>
          <div class="confirm-row">
            <span class="confirm-label">Комиссия</span>
            <span class="confirm-value">0%</span>
          </div>
          <div class="confirm-divider"></div>
          <div class="confirm-row confirm-total">
            <span class="confirm-label">К оплате</span>
            <span class="confirm-value confirm-amount">
              {{ formatNumber(Number(store.transferAmount)) }} монет
            </span>
          </div>
        </div>

        <div v-if="store.transferError" class="transfer-error">
          {{ store.transferError }}
        </div>

        <div class="confirm-actions">
          <button
            class="primary-btn"
            :disabled="store.transferLoading"
            @click="confirmTransfer"
          >
            <span v-if="store.transferLoading" class="spinner-small"></span>
            <span v-else>Подтвердить перевод</span>
          </button>
          <button class="secondary-btn" @click="store.goBack()">Назад</button>
        </div>
      </div>

      <!-- Шаг 4: Результат -->
      <div v-if="store.step === 'result'" class="step-result">
        <div v-if="store.transferResult" class="result-success">
          <div class="result-icon success-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="30" stroke="#4CAF50" stroke-width="3"/>
              <path d="M20 32L28 40L44 24" stroke="#4CAF50" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="result-text">
            Переведено
            <strong>{{ formatNumber(store.transferResult.amount) }}</strong>
            монет пользователю
            <strong>
              {{ store.transferResult.receiver?.first_name }}
              <span v-if="store.transferResult.receiver?.username">
                @{{ store.transferResult.receiver.username }}
              </span>
            </strong>
          </div>
          <div class="result-balance">
            Ваш баланс: {{ formatNumber(store.transferResult.senderBalance) }} монет
          </div>
        </div>

        <div v-if="store.transferError && !store.transferResult" class="result-error">
          <div class="result-icon error-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="30" stroke="#F44336" stroke-width="3"/>
              <path d="M24 24L40 40M40 24L24 40" stroke="#F44336" stroke-width="3" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="result-text error-text">{{ store.transferError }}</div>
        </div>

        <button class="primary-btn" @click="backToWallet">
          Вернуться в кошелек
        </button>
      </div>
    </div>

    <!-- Контент: История -->
    <div v-if="store.activeTab === 'history'" class="history-content">
      <div v-if="store.historyLoading && store.history.length === 0" class="loading-state">
        <div class="spinner"></div>
        <span>Загрузка истории...</span>
      </div>

      <div v-else-if="store.history.length === 0" class="empty-state">
        У вас пока нет переводов
      </div>

      <div v-else class="history-list">
        <div
          v-for="item in store.history"
          :key="item.id"
          class="history-item"
          @click="showDetail(item)"
        >
          <div class="history-icon" :class="item.type">
            <span v-if="item.type === 'outgoing'">&#8593;</span>
            <span v-else>&#8595;</span>
          </div>
          <div class="history-info">
            <div class="history-name">
              {{ item.counterparty.first_name || 'Пользователь' }}
              {{ item.counterparty.last_name || '' }}
              <span v-if="item.counterparty.username" class="history-username">
                @{{ item.counterparty.username }}
              </span>
            </div>
            <div class="history-date">{{ formatDate(item.createdAt) }}</div>
          </div>
          <div class="history-amount" :class="item.type">
            {{ item.type === 'outgoing' ? '-' : '+' }}{{ formatNumber(item.amount) }}
          </div>
        </div>

        <button
          v-if="store.historyPage < store.historyTotalPages"
          class="load-more-btn"
          :disabled="store.historyLoading"
          @click="store.loadMoreHistory(currentTelegramId)"
        >
          {{ store.historyLoading ? 'Загрузка...' : 'Загрузить ещё' }}
        </button>
      </div>
    </div>

    <!-- Модалка деталей транзакции -->
    <div v-if="detailItem" class="detail-overlay" @click.self="detailItem = null">
      <div class="detail-modal">
        <div class="detail-header">
          <h3>Детали транзакции</h3>
          <button class="detail-close" @click="detailItem = null">&times;</button>
        </div>
        <div class="detail-body">
          <div class="detail-row">
            <span>ID транзакции</span>
            <span class="detail-value">{{ detailItem.id }}</span>
          </div>
          <div class="detail-row">
            <span>Тип</span>
            <span class="detail-value" :class="detailItem.type">
              {{ detailItem.type === 'outgoing' ? 'Исходящий' : 'Входящий' }}
            </span>
          </div>
          <div class="detail-row">
            <span>Контрагент</span>
            <span class="detail-value">
              {{ detailItem.counterparty.first_name || '' }}
              {{ detailItem.counterparty.last_name || '' }}
              <span v-if="detailItem.counterparty.username">
                (@{{ detailItem.counterparty.username }})
              </span>
            </span>
          </div>
          <div class="detail-row">
            <span>Сумма</span>
            <span class="detail-value" :class="detailItem.type">
              {{ detailItem.type === 'outgoing' ? '-' : '+' }}{{ formatNumber(detailItem.amount) }} монет
            </span>
          </div>
          <div class="detail-row">
            <span>Дата</span>
            <span class="detail-value">{{ formatDate(detailItem.createdAt) }}</span>
          </div>
          <div class="detail-row">
            <span>Статус</span>
            <span class="detail-value status-completed">Выполнен</span>
          </div>
        </div>
      </div>
    </div>

    <Navigation />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTransferStore } from '@/stores/transferStore'
import { useGameStore } from '@/stores/gameStore'
import Navigation from '@/components/layout/Navigation.vue'

const store = useTransferStore()
const gameStore = useGameStore()
const detailItem = ref(null)
let searchTimeout = null

const currentTelegramId = computed(() => {
  const u = gameStore.currentUser?.value ?? gameStore.currentUser
  if (u && typeof u === 'object' && u.id) return String(u.id)
  if (u && (typeof u === 'string' || typeof u === 'number')) return String(u)
  return null
})

const currentBalance = computed(() => Math.floor(gameStore.balance || 0))

const headerTitle = computed(() => {
  switch (store.step) {
    case 'search': return 'Переводы'
    case 'amount': return 'Сумма перевода'
    case 'confirm': return 'Подтверждение'
    case 'result': return 'Результат'
    default: return 'Переводы'
  }
})

const canGoBack = computed(() => {
  return store.step !== 'search' && store.step !== 'result'
})

const amountError = computed(() => {
  const val = Number(store.transferAmount)
  if (store.transferAmount === '' || store.transferAmount === null) return null
  if (!Number.isFinite(val) || val <= 0) return 'Сумма должна быть больше нуля'
  if (val > currentBalance.value) return 'Недостаточно средств'
  if (val > 1_000_000) return 'Максимум 1 000 000 монет за раз'
  return null
})

const isAmountValid = computed(() => {
  const val = Number(store.transferAmount)
  return Number.isFinite(val) && val > 0 && val <= currentBalance.value && val <= 1_000_000
})

function isSelf(user) {
  return user && String(user.telegramId) === currentTelegramId.value
}

function avatarLetter(user) {
  return (user.first_name || user.username || '?')[0].toUpperCase()
}

function formatNumber(num) {
  return Math.floor(num).toLocaleString('ru-RU')
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  return `${day}.${month}.${year} ${hours}:${mins}`
}

function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    if (store.searchQuery.trim().length >= 2) {
      doSearch()
    }
  }, 500)
}

function doSearch() {
  if (store.searchQuery.trim()) {
    store.searchUser(store.searchQuery)
  }
}

function addAmount(val) {
  const current = Number(store.transferAmount) || 0
  store.transferAmount = String(Math.min(current + val, currentBalance.value, 1_000_000))
}

function setAllBalance() {
  store.transferAmount = String(Math.min(currentBalance.value, 1_000_000))
}

function confirmTransfer() {
  if (currentTelegramId.value) {
    store.sendTransfer(currentTelegramId.value)
  }
}

function backToWallet() {
  if (store.transferResult) {
    gameStore.balance = store.transferResult.senderBalance
  }
  store.resetTransfer()
}

function switchToHistory() {
  store.activeTab = 'history'
  if (currentTelegramId.value && store.history.length === 0) {
    store.loadHistory(currentTelegramId.value)
  }
}

function showDetail(item) {
  detailItem.value = item
}

function handleBack() {
  store.goBack()
}

onMounted(() => {
  store.resetTransfer()
})
</script>

<style scoped>
.transfer-page {
  min-height: 100vh;
  padding: 100px 16px 100px 16px;
  background: url("@/assets/images/bg.jpg") center top no-repeat;
  color: #fff;
}

.transfer-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.back-btn {
  background: none;
  border: none;
  color: #fff;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.transfer-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
}

/* Вкладки */
.tabs {
  display: flex;
  gap: 4px;
  background: rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 20px;
}

.tab-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: rgba(255,255,255,0.5);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: var(--primary-color, #6F5FF2);
  color: #fff;
}

/* Поиск */
.search-box {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.search-input {
  flex: 1;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.06);
  color: #fff;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input::placeholder {
  color: rgba(255,255,255,0.3);
}

.search-input:focus {
  border-color: var(--primary-color, #6F5FF2);
}

.search-btn {
  padding: 14px 20px;
  border-radius: 12px;
  border: none;
  background: var(--primary-color, #6F5FF2);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-error {
  color: #F44336;
  font-size: 13px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: rgba(244,67,54,0.1);
  border-radius: 8px;
}

/* Карточка пользователя */
.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255,255,255,0.06);
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.08);
}

.user-avatar {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.avatar-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--primary-color, #6F5FF2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-username {
  font-size: 13px;
  color: rgba(255,255,255,0.5);
}

.user-id {
  font-size: 11px;
  color: rgba(255,255,255,0.3);
}

.select-btn {
  padding: 10px 18px;
  border-radius: 10px;
  border: none;
  background: var(--primary-color, #6F5FF2);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
}

.select-btn:disabled {
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.3);
  cursor: not-allowed;
}

/* Шаг 2: Сумма */
.step-amount {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.recipient-mini {
  font-size: 14px;
  color: rgba(255,255,255,0.7);
  padding: 12px 16px;
  background: rgba(255,255,255,0.04);
  border-radius: 10px;
}

.balance-display {
  font-size: 15px;
  color: rgba(255,255,255,0.6);
  text-align: center;
}

.balance-display strong {
  color: #4CAF50;
}

.amount-input-wrap {
  position: relative;
}

.amount-input {
  width: 100%;
  padding: 18px 16px;
  border-radius: 14px;
  border: 2px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.06);
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
  -moz-appearance: textfield;
}

.amount-input::-webkit-outer-spin-button,
.amount-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.amount-input:focus {
  border-color: var(--primary-color, #6F5FF2);
}

.amount-input::placeholder {
  color: rgba(255,255,255,0.2);
  font-weight: 400;
  font-size: 18px;
}

.quick-buttons {
  display: flex;
  gap: 8px;
}

.quick-btn {
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.7);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-btn:active {
  background: rgba(255,255,255,0.1);
  transform: scale(0.96);
}

.amount-error {
  color: #F44336;
  font-size: 13px;
  text-align: center;
}

/* Кнопки */
.primary-btn {
  width: 100%;
  padding: 16px;
  border-radius: 14px;
  border: none;
  background: var(--primary-color, #6F5FF2);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.primary-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.secondary-btn {
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.15);
  background: transparent;
  color: rgba(255,255,255,0.7);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

/* Шаг 3: Подтверждение */
.step-confirm {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.confirm-card {
  background: rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.confirm-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.confirm-label {
  color: rgba(255,255,255,0.5);
  font-size: 14px;
}

.confirm-value {
  font-size: 14px;
  font-weight: 600;
  text-align: right;
  max-width: 60%;
}

.confirm-username {
  color: rgba(255,255,255,0.5);
  font-weight: 400;
}

.confirm-amount {
  color: #fff;
  font-size: 16px;
}

.confirm-divider {
  height: 1px;
  background: rgba(255,255,255,0.1);
}

.confirm-total .confirm-label {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.confirm-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.transfer-error {
  color: #F44336;
  font-size: 13px;
  text-align: center;
  padding: 10px;
  background: rgba(244,67,54,0.1);
  border-radius: 10px;
}

/* Шаг 4: Результат */
.step-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding-top: 40px;
}

.result-icon {
  margin-bottom: 8px;
}

.result-text {
  font-size: 16px;
  text-align: center;
  line-height: 1.5;
}

.error-text {
  color: #F44336;
}

.result-balance {
  font-size: 14px;
  color: rgba(255,255,255,0.5);
}

/* История */
.history-content {
  padding-top: 4px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 0;
  color: rgba(255,255,255,0.4);
  font-size: 14px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.history-item:active {
  background: rgba(255,255,255,0.04);
}

.history-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
}

.history-icon.outgoing {
  background: rgba(244,67,54,0.15);
  color: #F44336;
}

.history-icon.incoming {
  background: rgba(76,175,80,0.15);
  color: #4CAF50;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-name {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-username {
  color: rgba(255,255,255,0.4);
  font-weight: 400;
}

.history-date {
  font-size: 12px;
  color: rgba(255,255,255,0.3);
  margin-top: 2px;
}

.history-amount {
  font-size: 15px;
  font-weight: 700;
  flex-shrink: 0;
}

.history-amount.outgoing {
  color: #F44336;
}

.history-amount.incoming {
  color: #4CAF50;
}

.load-more-btn {
  width: 100%;
  padding: 12px;
  margin-top: 12px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.1);
  background: transparent;
  color: rgba(255,255,255,0.5);
  font-size: 13px;
  cursor: pointer;
}

/* Модалка деталей */
.detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: flex-end;
  z-index: 200;
}

.detail-modal {
  width: 100%;
  background: #1a1a2e;
  border-radius: 20px 20px 0 0;
  padding: 24px 20px 40px;
  max-height: 70vh;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.detail-header h3 {
  margin: 0;
  font-size: 18px;
}

.detail-close {
  background: none;
  border: none;
  color: rgba(255,255,255,0.5);
  font-size: 28px;
  cursor: pointer;
  padding: 0 4px;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.detail-row span:first-child {
  color: rgba(255,255,255,0.5);
}

.detail-value {
  font-weight: 600;
  text-align: right;
  max-width: 65%;
  word-break: break-all;
}

.detail-value.outgoing {
  color: #F44336;
}

.detail-value.incoming {
  color: #4CAF50;
}

.status-completed {
  color: #4CAF50;
}

/* Спиннеры */
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: var(--primary-color, #6F5FF2);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-small {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
