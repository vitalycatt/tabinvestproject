<!-- src/components/admin/UsersSection.vue -->
<template>
  <div class="section-container">
    <div class="section-header">
      <h2>Управление пользователями</h2>
      <div class="search-container">
        <input
          v-model="searchQuery"
          class="form-input"
          placeholder="Поиск по имени или ID..."
          type="text"
          @input="handleSearch"
        />
      </div>
    </div>

    <div class="section-content">
      <!-- Статистика пользователей -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-value">{{ userStats.total }}</div>
          <div class="stat-label">Всего пользователей</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ userStats.activeToday }}</div>
          <div class="stat-label">Активных сегодня</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ userStats.newThisWeek }}</div>
          <div class="stat-label">Новых за неделю</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ statsFromUsers.activeThisMonth }}</div>
          <div class="stat-label">Активных за месяц</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ formatMoney(userStats.totalIncome) }}</div>
          <div class="stat-label">Общий пассивный доход</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">
            {{ formatMoney(statsFromUsers.totalBalance) }}
          </div>
          <div class="stat-label">Суммарный баланс</div>
        </div>
      </div>

      <!-- Список пользователей -->
      <BaseCard class="users-list">
        <div class="list-header">
          <h3>Список пользователей</h3>
          <div class="filter-controls">
            <select
              v-model="filterStatus"
              class="form-input"
              @change="resetPagination"
            >
              <option value="all">Все пользователи</option>
              <option value="active">Активные</option>
              <option value="blocked">Заблокированные</option>
            </select>
            <select
              v-model="sortBy"
              class="form-input"
              @change="resetPagination"
            >
              <option value="lastLogin">По последнему входу</option>
              <option value="level">По уровню</option>
              <option value="income">По доходу</option>
              <option value="registeredAt">По дате регистрации</option>
            </select>
          </div>
        </div>

        <LoadingSpinner v-if="loading" />

        <div v-else-if="paginatedUsers.length === 0" class="empty-list">
          <p>Пользователи не найдены</p>
        </div>

        <div v-else class="users-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Имя</th>
                <th>Уровень</th>
                <th>Пассивный доход</th>
                <th>Баланс</th>
                <th>Последний вход</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in paginatedUsers" :key="user.id">
                <td>{{ user.id }}</td>
                <td>{{ user.name }}</td>
                <td>{{ user.level }}</td>
                <!-- <td>{{ formatMoney(user.passiveIncome) }}</td> -->

                <td class="flex items-center gap-2">
                  <template v-if="user.isEditingPassiveIncome">
                    <input
                      v-model.number="user.editPassiveIncome"
                      class="form-input w-24 px-2 py-1 bg-gray-100 rounded border border-gray-300"
                      type="number"
                    />
                    <button
                      class="text-green-600 hover:text-green-800"
                      title="Сохранить"
                      @click="saveUserPassiveIncome(user)"
                    >
                      <i class="fas fa-check"></i>
                    </button>
                    <button
                      class="text-gray-500 hover:text-gray-700"
                      title="Отмена"
                      @click="cancelEditPassiveIncome(user)"
                    >
                      <i class="fas fa-times"></i>
                    </button>
                  </template>

                  <template v-else>
                    <span>{{ formatMoney(user.passiveIncome) }}</span>
                    <button
                      class="text-blue-500 hover:text-blue-700"
                      title="Редактировать"
                      @click="startEditPassiveIncome(user)"
                    >
                      <i class="fas fa-pen"></i>
                    </button>
                  </template>
                </td>

                <td class="flex items-center gap-2">
                  <template v-if="user.isEditingBalance">
                    <input
                      v-model.number="user.editBalance"
                      class="form-input w-24 px-2 py-1 bg-gray-100 rounded border border-gray-300"
                      type="number"
                    />
                    <button
                      class="text-green-600 hover:text-green-800"
                      title="Сохранить баланс"
                      @click="saveUserBalance(user)"
                    >
                      <i class="fas fa-check"></i>
                    </button>
                    <button
                      class="text-gray-500 hover:text-gray-700"
                      title="Отмена"
                      @click="cancelEditBalance(user)"
                    >
                      <i class="fas fa-times"></i>
                    </button>
                  </template>

                  <template v-else>
                    <span>{{ formatMoney(user.balance) }}</span>
                    <button
                      class="text-blue-500 hover:text-blue-700"
                      title="Редактировать баланс"
                      @click="startEditBalance(user)"
                    >
                      <i class="fas fa-pen"></i>
                    </button>
                  </template>
                </td>

                <td>{{ formatDate(user.lastLogin) }}</td>
                <td class="actions flex gap-2 items-center">
                  <button
                    class="action-btn view"
                    title="Просмотр"
                    @click="viewUserDetails(user)"
                  >
                    <i class="fas fa-eye"></i>
                  </button>
                  <button
                    class="action-btn edit"
                    title="Сбросить прогресс"
                    @click="resetUserProgress(user)"
                  >
                    <i class="fas fa-redo"></i>
                  </button>
                  <button
                    :title="user.blocked ? 'Разблокировать' : 'Заблокировать'"
                    class="action-btn toggle"
                    @click="toggleUserBlock(user)"
                  >
                    <i
                      :class="user.blocked ? 'fas fa-lock-open' : 'fas fa-lock'"
                    ></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Пагинация -->
        <div v-if="totalPages > 1" class="pagination">
          <button
            :disabled="currentPage === 1"
            class="page-btn"
            @click="currentPage--"
          >
            &laquo;
          </button>

          <button
            v-for="page in paginationItems"
            :key="page"
            :class="['page-btn', { active: page === currentPage }]"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>

          <button
            :disabled="currentPage === totalPages"
            class="page-btn"
            @click="currentPage++"
          >
            &raquo;
          </button>
        </div>
      </BaseCard>
    </div>

    <!-- Модальное окно деталей пользователя -->
    <BaseModal
      v-if="showUserModal"
      title="Детали пользователя"
      @close="showUserModal = false"
    >
      <div v-if="selectedUser" class="user-details">
        <div class="user-header">
          <div class="user-avatar">
            <img
              :alt="selectedUser.name"
              :src="
                selectedUser.photo_url ||
                'https://ui-avatars.com/api/?name=' +
                  encodeURIComponent(selectedUser.name)
              "
            />
          </div>
          <div class="user-info">
            <h3>{{ selectedUser.name }}</h3>
            <div class="user-id">ID: {{ selectedUser.id }}</div>
            <div v-if="selectedUser.username" class="user-username">
              @{{ selectedUser.username }}
            </div>
          </div>
        </div>

        <div class="user-stats">
          <div class="stat-row">
            <div class="stat-name">Уровень</div>
            <div class="stat-value">{{ selectedUser.level }}</div>
          </div>

          <div class="stat-row">
            <div class="stat-name">Баланс</div>
            <div class="stat-value">
              {{ formatMoney(selectedUser.balance) }}
            </div>
          </div>

          <div class="stat-row">
            <div class="stat-name">Пассивный доход</div>
            <div class="stat-value">
              {{ formatMoney(selectedUser.passiveIncome) }}
            </div>
          </div>
          <div class="stat-row">
            <div class="stat-name">Дата регистрации</div>
            <div class="stat-value">
              {{ formatDate(selectedUser.registeredAt) }}
            </div>
          </div>
          <div class="stat-row">
            <div class="stat-name">Последний вход</div>
            <div class="stat-value">
              {{ formatDate(selectedUser.lastLogin) }}
            </div>
          </div>
          <div class="stat-row">
            <div class="stat-name">Энергия</div>
            <div class="stat-value">
              {{ selectedUser.energy?.current || 0 }} /
              {{ selectedUser.energy?.max || 0 }}
            </div>
          </div>
          <div class="stat-row">
            <div class="stat-name">Всего кликов</div>
            <div class="stat-value">
              {{ selectedUser.stats?.totalClicks || 0 }}
            </div>
          </div>
          <div class="stat-row">
            <div class="stat-name">Всего заработано</div>
            <div class="stat-value">
              {{ formatMoney(selectedUser.stats?.totalEarned || 0) }}
            </div>
          </div>
          <div class="stat-row">
            <div class="stat-name">Статус</div>
            <div class="stat-value">
              <span
                :class="[
                  'status-badge',
                  selectedUser.blocked ? 'blocked' : 'active',
                ]"
              >
                {{ selectedUser.blocked ? "Заблокирован" : "Активен" }}
              </span>
            </div>
          </div>
        </div>

        <div
          v-if="selectedUser.investments?.purchased?.length > 0"
          class="user-investments"
        >
          <h4>Инвестиции пользователя</h4>
          <div class="investment-list">
            <div
              v-for="(investment, index) in selectedUser.investments.purchased"
              :key="index"
              class="investment-item"
            >
              <div class="investment-name">{{ investment.id }}</div>
              <div class="investment-level">Уровень {{ investment.level }}</div>
              <div class="investment-income">
                +{{ formatMoney(investment.income) }}/месяц
              </div>
            </div>
          </div>
        </div>

        <div class="user-actions">
          <BaseButton
            type="danger"
            @click="
              resetUserProgress(selectedUser);
              showUserModal = false;
            "
          >
            Сбросить прогресс
          </BaseButton>
          <BaseButton
            :type="selectedUser.blocked ? 'success' : 'danger'"
            @click="
              toggleUserBlock(selectedUser);
              showUserModal = false;
            "
          >
            {{ selectedUser.blocked ? "Разблокировать" : "Заблокировать" }}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup>
import { updateUserBalance } from "@/services/apiService";
import { computed, onMounted, ref, watch } from "vue";
import { ApiService } from "../../services/apiService";
import BaseButton from "../ui/BaseButton.vue";
import BaseCard from "../ui/BaseCard.vue";
import BaseModal from "../ui/BaseModal.vue";
import LoadingSpinner from "../ui/LoadingSpinner.vue";

// Состояние
const loading = ref(true);
const users = ref([]);

function startEditBalance(user) {
  user.isEditingBalance = true;
  user.editBalance = user.balance;
}

function cancelEditBalance(user) {
  user.isEditingBalance = false;
  user.editBalance = null;
}

function startEditPassiveIncome(user) {
  user.isEditingPassiveIncome = true;
  user.editPassiveIncome = user.passiveIncome;
}

function cancelEditPassiveIncome(user) {
  user.isEditingPassiveIncome = false;
  user.editPassiveIncome = null;
}

async function saveUserBalance(user) {
  console.log("Telegram ID пользователя:", user.id);
  console.log("ID пользователя:", user.id);
  const amount = Number(user.editBalance);
  if (isNaN(amount)) return alert("Некорректная сумма");

  try {
    const response = await updateUserBalance(user.id, amount);
    if (response.success) {
      user.balance = response.data.gameData?.balance ?? amount;
      user.isEditingBalance = false;
    } else {
      alert("Не удалось обновить баланс на сервере");
    }
  } catch (err) {
    console.error("Ошибка при обновлении баланса:", err);
    alert("Ошибка при сохранении баланса");
  }
}

async function saveUserPassiveIncome(user) {
  console.log("Telegram ID пользователя:", user.id);
  console.log("ID пользователя:", user.id);
  const amount = Number(user.editPassiveIncome);
  if (isNaN(amount)) return alert("Некорректная сумма");

  try {
    const response = await ApiService.updateUserPassiveIncome(user.id, amount);
    if (response.success) {
      user.passiveIncome = response.gameData?.passiveIncome ?? amount;
      user.isEditingPassiveIncome = false;
    } else {
      alert("Не удалось обновить баланс на сервере");
    }
  } catch (err) {
    console.error("Ошибка при обновлении баланса:", err);
    alert("Ошибка при сохранении баланса");
  }
}

const userStats = ref({
  total: 0,
  activeToday: 0,
  activeThisMonth: 0,
  newThisWeek: 0,
  totalIncome: 0,
  totalBalance: 0,
});

// Считаем totalBalance и activeThisMonth на фронте по загруженному списку (обход проблемы с полем stats в ответе API)
const statsFromUsers = computed(() => {
  const list = users.value || [];
  const totalBalance = list.reduce((sum, u) => sum + (Number(u.balance) || 0), 0);
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const activeThisMonth = list.filter((u) => {
    const d = u.lastLogin ? new Date(u.lastLogin) : null;
    return d && d >= monthAgo;
  }).length;
  return { totalBalance, activeThisMonth };
});

const searchQuery = ref("");
const filterStatus = ref("all");
const sortBy = ref("lastLogin");
const showUserModal = ref(false);
const selectedUser = ref(null);
const currentPage = ref(1);
const pageSize = ref(10);
const searchTimeout = ref(null);

// Загрузка пользователей с пагинацией и фильтрацией
const filteredUsers = computed(() => {
  let result = [...users.value];

  // Фильтрация по статусу
  if (filterStatus.value !== "all") {
    const isBlocked = filterStatus.value === "blocked";
    result = result.filter((user) => user.blocked === isBlocked);
  }

  // Поиск
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (user) =>
        user.name?.toLowerCase().includes(query) ||
        user.id?.toString().includes(query) ||
        user.username?.toLowerCase().includes(query)
    );
  }

  // Сортировка
  switch (sortBy.value) {
    case "lastLogin":
      result.sort(
        (a, b) => new Date(b.lastLogin || 0) - new Date(a.lastLogin || 0)
      );
      break;
    case "level":
      result.sort((a, b) => (b.level || 0) - (a.level || 0));
      break;
    case "income":
      result.sort((a, b) => (b.passiveIncome || 0) - (a.passiveIncome || 0));
      break;
    case "registeredAt":
      result.sort(
        (a, b) => new Date(b.registeredAt || 0) - new Date(a.registeredAt || 0)
      );
      break;
  }

  return result;
});

// Пагинация
const totalPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / pageSize.value) || 1;
});

const paginatedUsers = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return filteredUsers.value.slice(startIndex, endIndex);
});

// Создаем пагинацию с ограничением количества страниц
const paginationItems = computed(() => {
  const totalVisible = 5; // Максимальное количество видимых страниц
  const pages = [];

  if (totalPages.value <= totalVisible) {
    // Если всего страниц меньше или равно максимальному количеству видимых
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    // Иначе показываем страницы вокруг текущей
    const leftSide = Math.floor(totalVisible / 2);
    const rightSide = totalVisible - leftSide - 1;

    // Если текущая страница близка к началу
    if (currentPage.value <= leftSide) {
      for (let i = 1; i <= totalVisible - 1; i++) {
        pages.push(i);
      }
      pages.push("...");
      pages.push(totalPages.value);
    }
    // Если текущая страница близка к концу
    else if (currentPage.value > totalPages.value - rightSide) {
      pages.push(1);
      pages.push("...");
      for (
        let i = totalPages.value - totalVisible + 2;
        i <= totalPages.value;
        i++
      ) {
        pages.push(i);
      }
    }
    // Если текущая страница где-то в середине
    else {
      pages.push(1);
      pages.push("...");
      for (
        let i = currentPage.value - leftSide + 1;
        i <= currentPage.value + rightSide - 1;
        i++
      ) {
        pages.push(i);
      }
      pages.push("...");
      pages.push(totalPages.value);
    }
  }

  return pages;
});

// ИСПРАВЛЕННЫЙ метод загрузки пользователей
const loadUsers = async () => {
  try {
    loading.value = true;
    const response = await ApiService.getAllUsers();

    if (response && response.users) {
      users.value = (response.users || []).map((user) => ({
        ...user,
        editBalance: user.balance ?? 0,
        isEditingBalance: false,
      }));

      if (response.stats || response.users) {
        const s = response.stats || {};
        userStats.value = {
          total:
            s.total ?? response.pagination?.totalUsers ?? users.value.length,
          activeToday: s.activeToday ?? 0,
          activeThisMonth: s.activeThisMonth ?? response.activeThisMonth ?? 0,
          newThisWeek: s.newThisWeek ?? 0,
          totalIncome: s.totalIncome ?? 0,
          totalBalance: s.totalBalance ?? response.totalBalance ?? 0,
        };
      }
    } else if (response && response.data && response.data.users) {
      users.value = (response.data.users || []).map((user) => ({
        ...user,
        editBalance: user.balance ?? 0,
        isEditingBalance: false,
      }));

      if (response.data.stats || response.data.users) {
        const s = response.data.stats || {};
        // activeThisMonth и totalBalance могут приходить в data напрямую, если stats обрезают (прокси/старый бэк)
        userStats.value = {
          total:
            s.total ??
            response.data.pagination?.totalUsers ??
            users.value.length,
          activeToday: s.activeToday ?? 0,
          activeThisMonth:
            s.activeThisMonth ?? response.data.activeThisMonth ?? 0,
          newThisWeek: s.newThisWeek ?? 0,
          totalIncome: s.totalIncome ?? 0,
          totalBalance: s.totalBalance ?? response.data.totalBalance ?? 0,
        };
      }
    } else {
      console.error("Unexpected response format:", response);
      users.value = [];
    }
  } catch (error) {
    console.error("Error loading users:", error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  // Сбрасываем текущую страницу при поиске
  currentPage.value = 1;

  // Используем debounce для снижения частоты запросов
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  searchTimeout.value = setTimeout(async () => {
    if (searchQuery.value.length >= 3) {
      // Для сложного поиска можно добавить запрос на бэкенд
      // const results = await ApiService.searchUsers(searchQuery.value);
      // users.value = results;
    } else if (searchQuery.value === "") {
      // Если поиск очищен, загружаем всех пользователей заново
      await loadUsers();
    }
  }, 300);
};

const resetPagination = () => {
  currentPage.value = 1;
};

const goToPage = (page) => {
  if (typeof page === "number") {
    currentPage.value = page;
  }
};

const viewUserDetails = async (user) => {
  try {
    loading.value = true;

    // Если у нас уже есть полные данные пользователя, используем их
    if (user.stats && user.investments) {
      selectedUser.value = { ...user };
    } else {
      // Иначе загружаем полные данные
      const userData = await ApiService.getUser(user.id);
      selectedUser.value = { ...userData };
    }

    showUserModal.value = true;
  } catch (error) {
    console.error("Error loading user details:", error);
  } finally {
    loading.value = false;
  }
};

const resetUserProgress = async (user) => {
  if (
    confirm(
      `Вы действительно хотите сбросить прогресс пользователя ${user.name}?`
    )
  ) {
    try {
      loading.value = true;
      await ApiService.resetUserProgress(user.id);

      // Обновляем локальные данные пользователя
      const updatedUser = await ApiService.getUser(user.id);

      // Обновляем пользователя в общем списке
      const index = users.value.findIndex((u) => u.id === user.id);
      if (index !== -1) {
        users.value[index] = { ...updatedUser };
      }

      // Если открыты детали пользователя, обновляем и их
      if (selectedUser.value && selectedUser.value.id === user.id) {
        selectedUser.value = { ...updatedUser };
      }
    } catch (error) {
      console.error("Error resetting user progress:", error);
    } finally {
      loading.value = false;
    }
  }
};

const toggleUserBlock = async (user) => {
  try {
    loading.value = true;
    await ApiService.blockUser(user.id);

    // Обновляем локальные данные пользователя
    const updatedUser = await ApiService.getUser(user.id);

    // Обновляем пользователя в общем списке
    const index = users.value.findIndex((u) => u.id === user.id);
    if (index !== -1) {
      users.value[index] = { ...updatedUser };
    }

    // Если открыты детали пользователя, обновляем и их
    if (selectedUser.value && selectedUser.value.id === user.id) {
      selectedUser.value = { ...updatedUser };
    }
  } catch (error) {
    console.error("Error toggling user block:", error);
  } finally {
    loading.value = false;
  }
};

// Вспомогательные функции
const formatMoney = (num) => {
  if (!num) return "0";

  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + "B";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return Math.floor(num).toString();
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleString();
};

// Наблюдатели
watch([filterStatus, sortBy], async () => {
  resetPagination();
});

// Загрузка данных при монтировании
onMounted(async () => {
  await loadUsers();
});
</script>

<style scoped>
/* Общие стили для секции */
.section-container {
  width: 100%;
  max-height: 90vh;
  overflow-y: scroll;
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.section-content {
  flex-grow: 1;
  padding-bottom: 20px;
}

/* Стили для скроллбара */
.section-content::-webkit-scrollbar {
  width: 8px;
}

.section-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.section-content::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

.section-content::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}

/* Статистика */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: all 0.2s ease;
  min-width: 0;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: clamp(18px, 2.2vw, 24px);
  font-weight: 700;
  margin-bottom: 4px;
  color: var(--primary-color, #8c60e3);
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-label {
  font-size: clamp(12px, 1.2vw, 14px);
  color: #666;
  line-height: 1.2;
}

/* Список пользователей */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filter-controls {
  display: flex;
  gap: 10px;
}

.users-table {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-badge.active {
  background-color: #4caf50;
  color: white;
}

.status-badge.blocked {
  background-color: #f44336;
  color: white;
}

.actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.action-btn.view {
  color: #2196f3;
}

.action-btn.edit {
  color: #ff9800;
}

.action-btn.toggle {
  color: #f44336;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

/* Пагинация */
.pagination {
  display: flex;
  justify-content: center;
  gap: 5px;
  margin-top: 20px;
}

.page-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.page-btn.active {
  background: var(--primary-color, #8c60e3);
  color: white;
  border-color: var(--primary-color, #8c60e3);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn:hover:not(:disabled):not(.active) {
  background: #f1f1f1;
}

/* Модальное окно с деталями пользователя */
.user-details {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
}

.user-id,
.user-username {
  font-size: 14px;
  color: #666;
}

.user-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.stat-row:last-child {
  border-bottom: none;
}

.user-investments {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.user-investments h4 {
  margin-top: 0;
  margin-bottom: 12px;
}

.investment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.investment-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: white;
  border-radius: 4px;
  border: 1px solid #eee;
}

.investment-name {
  font-weight: 500;
}

.investment-level {
  color: #666;
}

.investment-income {
  color: #4caf50;
  font-weight: 500;
}

.user-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

/* Пустой список */
.empty-list {
  text-align: center;
  padding: 40px;
  color: #666;
  background: #f8f9fa;
  border-radius: 8px;
}

/* Поле поиска */
.search-container {
  width: 300px;
}

.search-container input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
  transition: all 0.2s ease;
}

.search-container input:focus {
  border-color: var(--primary-color, #8c60e3);
  box-shadow: 0 0 0 3px rgba(140, 96, 227, 0.2);
  outline: none;
}

/* Адаптивность */
@media (max-width: 1400px) {
  .stats-cards {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .stats-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .search-container {
    width: 100%;
  }

  .filter-controls {
    flex-direction: column;
    width: 100%;
  }

  .stats-cards {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .stat-card {
    padding: 14px;
  }

  .stat-value {
    font-size: 20px;
  }

  .stat-label {
    font-size: 13px;
  }

  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .pagination {
    flex-wrap: wrap;
  }
}
</style>
