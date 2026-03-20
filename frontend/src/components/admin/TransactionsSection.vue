<template>
  <div class="transactions-section">
    <!-- Дашборд -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ txStats.totalTransactions }}</div>
        <div class="stat-label">Всего транзакций</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ txStats.todayTransactions }}</div>
        <div class="stat-label">Сегодня</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ formatNumber(txStats.totalVolume) }}</div>
        <div class="stat-label">Общий объем</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ txStats.uniqueSenders }}</div>
        <div class="stat-label">Уник. отправителей</div>
      </div>
    </div>

    <!-- Вкладки -->
    <div class="sub-tabs">
      <button
        :class="['sub-tab', { active: subTab === 'list' }]"
        @click="subTab = 'list'"
      >
        Список транзакций
      </button>
      <button
        :class="['sub-tab', { active: subTab === 'balance' }]"
        @click="subTab = 'balance'"
      >
        Управление балансами
      </button>
      <button
        :class="['sub-tab', { active: subTab === 'logs' }]"
        @click="subTab = 'logs'"
      >
        Лог действий
      </button>
    </div>

    <!-- Список транзакций -->
    <div v-if="subTab === 'list'" class="tab-content">
      <!-- Фильтры -->
      <div class="filters">
        <input
          v-model="filters.search"
          type="text"
          class="filter-input"
          placeholder="Поиск по Username / Telegram ID"
          @input="debouncedFetch"
        />
        <select v-model="filters.status" class="filter-select" @change="fetchTx">
          <option value="">Все статусы</option>
          <option value="completed">Выполнен</option>
          <option value="failed">Ошибка</option>
          <option value="pending">В ожидании</option>
        </select>
        <input
          v-model="filters.dateFrom"
          type="date"
          class="filter-input filter-date"
          @change="fetchTx"
        />
        <input
          v-model="filters.dateTo"
          type="date"
          class="filter-input filter-date"
          @change="fetchTx"
        />
      </div>

      <!-- Таблица -->
      <div class="table-wrap">
        <table class="tx-table" v-if="transactions.length > 0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Дата</th>
              <th>Отправитель</th>
              <th>Получатель</th>
              <th>Сумма</th>
              <th>Баланс до</th>
              <th>Баланс после</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tx in transactions" :key="tx.id">
              <td class="td-id" :title="tx.id">{{ shortId(tx.id) }}</td>
              <td>{{ formatDate(tx.createdAt) }}</td>
              <td>
                <div class="user-cell">
                  <span class="user-cell-name">{{ tx.sender.name || '-' }}</span>
                  <span class="user-cell-meta">
                    {{ tx.sender.username ? '@' + tx.sender.username : tx.sender.telegramId }}
                  </span>
                </div>
              </td>
              <td>
                <div class="user-cell">
                  <span class="user-cell-name">{{ tx.receiver.name || '-' }}</span>
                  <span class="user-cell-meta">
                    {{ tx.receiver.username ? '@' + tx.receiver.username : tx.receiver.telegramId }}
                  </span>
                </div>
              </td>
              <td class="td-amount">{{ formatNumber(tx.amount) }}</td>
              <td>{{ formatNumber(tx.senderBalanceBefore) }}</td>
              <td>{{ formatNumber(tx.senderBalanceAfter) }}</td>
              <td>
                <span :class="['status-badge', 'status-' + tx.status]">
                  {{ statusLabel(tx.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else-if="!loading" class="empty-msg">Нет транзакций</div>
        <div v-else class="loading-msg">Загрузка...</div>
      </div>

      <!-- Пагинация -->
      <div v-if="pagination.totalPages > 1" class="pagination">
        <button
          :disabled="pagination.currentPage <= 1"
          @click="goPage(pagination.currentPage - 1)"
        >
          &laquo;
        </button>
        <span>{{ pagination.currentPage }} / {{ pagination.totalPages }}</span>
        <button
          :disabled="pagination.currentPage >= pagination.totalPages"
          @click="goPage(pagination.currentPage + 1)"
        >
          &raquo;
        </button>
      </div>
    </div>

    <!-- Управление балансами -->
    <div v-if="subTab === 'balance'" class="tab-content">
      <div class="balance-section">
        <!-- Просмотр баланса -->
        <div class="balance-lookup">
          <h3>Просмотр баланса пользователя</h3>
          <div class="lookup-row">
            <input
              v-model="balanceLookupId"
              type="text"
              class="filter-input"
              placeholder="Telegram ID пользователя"
            />
            <button class="btn-primary" @click="lookupBalance">Найти</button>
          </div>
          <div v-if="lookedUpUser" class="lookup-result">
            <p>
              <strong>{{ lookedUpUser.first_name }} {{ lookedUpUser.last_name || '' }}</strong>
              <span v-if="lookedUpUser.username"> (@{{ lookedUpUser.username }})</span>
            </p>
            <p>Текущий баланс: <strong>{{ formatNumber(lookedUpUser.gameData?.balance ?? 0) }}</strong> монет</p>
          </div>
          <div v-if="lookupError" class="error-msg">{{ lookupError }}</div>
        </div>

        <!-- Корректировка баланса -->
        <div class="balance-adjust">
          <h3>Ручная корректировка баланса</h3>
          <div class="adjust-form">
            <div class="form-group">
              <label>Telegram ID пользователя</label>
              <input v-model="adjustForm.userId" type="text" class="filter-input" />
            </div>
            <div class="form-group">
              <label>Сумма (+ начислить, - списать)</label>
              <input v-model.number="adjustForm.amount" type="number" class="filter-input" />
            </div>
            <div class="form-group">
              <label>Причина (обязательно)</label>
              <textarea v-model="adjustForm.reason" class="filter-input textarea-input" rows="2"></textarea>
            </div>
            <button
              class="btn-primary"
              :disabled="!adjustForm.userId || !adjustForm.amount || !adjustForm.reason?.trim()"
              @click="adjustBalance"
            >
              Исполнить
            </button>
            <div v-if="adjustResult" class="success-msg">
              Баланс изменен: {{ formatNumber(adjustResult.balanceBefore) }} &rarr; {{ formatNumber(adjustResult.balanceAfter) }}
            </div>
            <div v-if="adjustError" class="error-msg">{{ adjustError }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Лог действий -->
    <div v-if="subTab === 'logs'" class="tab-content">
      <div class="table-wrap">
        <table class="tx-table" v-if="adminLogs.length > 0">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Админ</th>
              <th>Действие</th>
              <th>Пользователь</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in adminLogs" :key="log._id">
              <td>{{ formatDate(log.createdAt) }}</td>
              <td>{{ log.adminTelegramId || '-' }}</td>
              <td>{{ log.action }}</td>
              <td>{{ log.targetUserId || '-' }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else-if="!logsLoading" class="empty-msg">Нет записей</div>
        <div v-else class="loading-msg">Загрузка...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ApiService } from '@/services/apiService'

const subTab = ref('list')

// Статистика
const txStats = ref({
  totalTransactions: 0,
  todayTransactions: 0,
  totalVolume: 0,
  uniqueSenders: 0,
})

// Список транзакций
const transactions = ref([])
const pagination = ref({ currentPage: 1, totalPages: 1, total: 0 })
const loading = ref(false)
const filters = reactive({
  search: '',
  status: '',
  dateFrom: '',
  dateTo: '',
})

let searchTimeout = null

// Управление балансами
const balanceLookupId = ref('')
const lookedUpUser = ref(null)
const lookupError = ref(null)

const adjustForm = reactive({
  userId: '',
  amount: null,
  reason: '',
})
const adjustResult = ref(null)
const adjustError = ref(null)

// Логи
const adminLogs = ref([])
const logsLoading = ref(false)

function formatNumber(num) {
  return Math.floor(Number(num) || 0).toLocaleString('ru-RU')
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  return `${day}.${month}.${year} ${hours}:${mins}`
}

function shortId(id) {
  if (!id) return '-'
  return String(id).slice(-8)
}

function statusLabel(status) {
  const map = { completed: 'Выполнен', failed: 'Ошибка', pending: 'Ожидание' }
  return map[status] || status
}

async function fetchStats() {
  try {
    const res = await ApiService.getAdminTransactionStats()
    if (res.success && res.data) {
      txStats.value = res.data
    }
  } catch (e) {
    console.error('fetchStats error:', e)
  }
}

async function fetchTx(page = 1) {
  loading.value = true
  try {
    const params = {
      page,
      limit: 50,
    }
    if (filters.search) params.search = filters.search
    if (filters.status) params.status = filters.status
    if (filters.dateFrom) params.dateFrom = filters.dateFrom
    if (filters.dateTo) params.dateTo = filters.dateTo

    const res = await ApiService.getAdminTransactions(params)
    if (res.success && res.data) {
      transactions.value = res.data.items
      pagination.value = res.data.pagination
    }
  } catch (e) {
    console.error('fetchTx error:', e)
  } finally {
    loading.value = false
  }
}

function debouncedFetch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => fetchTx(1), 400)
}

function goPage(page) {
  fetchTx(page)
}

async function lookupBalance() {
  lookupError.value = null
  lookedUpUser.value = null
  if (!balanceLookupId.value.trim()) return

  try {
    const res = await ApiService.getUser(balanceLookupId.value.trim())
    if (res.success && res.data) {
      lookedUpUser.value = res.data
    } else {
      lookupError.value = 'Пользователь не найден'
    }
  } catch (e) {
    lookupError.value = e.message || 'Пользователь не найден'
  }
}

async function adjustBalance() {
  adjustResult.value = null
  adjustError.value = null

  try {
    const res = await ApiService.adjustUserBalance(
      adjustForm.userId,
      adjustForm.amount,
      adjustForm.reason
    )
    if (res.success && res.data) {
      adjustResult.value = res.data
      adjustForm.userId = ''
      adjustForm.amount = null
      adjustForm.reason = ''
    } else {
      adjustError.value = res.message || 'Ошибка корректировки'
    }
  } catch (e) {
    adjustError.value = e.message || 'Ошибка'
  }
}

async function fetchLogs() {
  logsLoading.value = true
  try {
    const res = await ApiService.getAdminLogs(1, 100)
    if (res.success && res.data) {
      adminLogs.value = res.data.items
    }
  } catch (e) {
    console.error('fetchLogs error:', e)
  } finally {
    logsLoading.value = false
  }
}

onMounted(() => {
  fetchStats()
  fetchTx(1)
  fetchLogs()
})
</script>

<style scoped>
.transactions-section {
  max-width: 100%;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
}

.stat-label {
  font-size: 13px;
  color: #888;
  margin-top: 4px;
}

/* Вкладки */
.sub-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  background: #eee;
  border-radius: 8px;
  padding: 4px;
}

.sub-tab {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #666;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.sub-tab.active {
  background: #fff;
  color: #1a1a2e;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* Фильтры */
.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
}

.filter-input:focus {
  border-color: #8C60E3;
}

.filter-date {
  max-width: 160px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  background: #fff;
}

/* Таблица */
.table-wrap {
  overflow-x: auto;
}

.tx-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.tx-table th {
  background: #f8f8f8;
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: #555;
  border-bottom: 2px solid #eee;
  white-space: nowrap;
}

.tx-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.td-id {
  font-family: monospace;
  font-size: 12px;
  color: #888;
  cursor: help;
}

.td-amount {
  font-weight: 700;
}

.user-cell {
  display: flex;
  flex-direction: column;
}

.user-cell-name {
  font-weight: 600;
  font-size: 13px;
}

.user-cell-meta {
  font-size: 11px;
  color: #999;
}

.status-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.status-completed {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-failed {
  background: #fce4ec;
  color: #c62828;
}

.status-pending {
  background: #fff3e0;
  color: #e65100;
}

/* Пагинация */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

.pagination button {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Управление балансами */
.balance-section {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.balance-lookup,
.balance-adjust {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.balance-lookup h3,
.balance-adjust h3 {
  margin: 0 0 16px;
  font-size: 16px;
}

.lookup-row {
  display: flex;
  gap: 10px;
}

.lookup-result {
  margin-top: 12px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.lookup-result p {
  margin: 4px 0;
}

.adjust-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 500px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 13px;
  color: #555;
  font-weight: 600;
}

.textarea-input {
  resize: vertical;
  min-height: 60px;
}

.btn-primary {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: #8C60E3;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  align-self: flex-start;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.success-msg {
  color: #2e7d32;
  font-size: 13px;
  padding: 8px 12px;
  background: #e8f5e9;
  border-radius: 6px;
}

.error-msg {
  color: #c62828;
  font-size: 13px;
  padding: 8px 12px;
  background: #fce4ec;
  border-radius: 6px;
  margin-top: 8px;
}

.empty-msg,
.loading-msg {
  padding: 40px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
  }
  .filter-date {
    max-width: none;
  }
  .sub-tabs {
    flex-direction: column;
  }
}
</style>
