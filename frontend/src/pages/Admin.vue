<!-- src/pages/Admin.vue с добавленным пунктом меню для инвестиций -->
<template>
  <div class="admin-page">
    <!-- Сайдбар с навигацией -->
    <div
      class="admin-sidebar"
      :class="{ 'admin-sidebar--open': isSidebarOpen }"
    >
      <div class="admin-logo">
        <div class="logo-container">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"
            />
            <path d="M12 9l-3 3 3 3 3-3-3-3z" />
          </svg>
          <h2 class="logo-text">Admin<span>Panel</span></h2>
        </div>
        <button class="sidebar-toggle" @click="toggleSidebar">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <nav class="admin-nav">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['nav-button', { active: currentTab === tab.id }]"
          @click="switchTab(tab.id)"
        >
          <!-- Иконка будет здесь -->
          <span class="nav-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <template v-if="tab.id === 'users'">
                <!-- Иконка пользователей -->
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </template>
              <template v-else-if="tab.id === 'transactions'">
                <!-- Иконка транзакций -->
                <path d="M17 1l4 4-4 4"></path>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                <path d="M7 23l-4-4 4-4"></path>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
              </template>
              <template v-else-if="tab.id === 'tasks'">
                <!-- Иконка заданий -->
                <path d="M9 11l3 3L22 4"></path>
                <path
                  d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
                ></path>
              </template>
              <template v-else-if="tab.id === 'products'">
                <!-- Иконка продуктов -->
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path
                  d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
                ></path>
              </template>
              <template v-else-if="tab.id === 'investments'">
                <!-- Иконка инвестиций -->
                <path d="M12 1v22"></path>
                <path
                  d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                ></path>
              </template>
              <template v-else-if="tab.id === 'notifications'">
                <!-- Иконка уведомлений -->
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </template>
              <template v-else-if="tab.id === 'settings'">
                <!-- Иконка настроек -->
                <circle cx="12" cy="12" r="3"></circle>
                <path
                  d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
                ></path>
              </template>
            </svg>
          </span>
          <span class="nav-text">{{ tab.name }}</span>
        </button>
      </nav>
    </div>

    <!-- Мобильный хедер -->
    <div class="mobile-header">
      <button class="sidebar-toggle" @click="toggleSidebar">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>
      <h2>{{ currentTabName }}</h2>
    </div>

    <!-- Основной контент -->
    <div class="admin-content" :class="{ 'sidebar-closed': !isSidebarOpen }">
      <UsersSection v-if="currentTab === 'users'" />
      <TransactionsSection v-if="currentTab === 'transactions'" />
      <TasksSection v-if="currentTab === 'tasks'" />
      <ProductsSection v-if="currentTab === 'products'" />
      <InvestmentsSection v-if="currentTab === 'investments'" />
      <NotificationsSection v-if="currentTab === 'notifications'" />
      <SettingsSection v-if="currentTab === 'settings'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import UsersSection from "../components/admin/UsersSection.vue";
import TransactionsSection from "../components/admin/TransactionsSection.vue";
import TasksSection from "../components/admin/TasksSection.vue";
import ProductsSection from "../components/admin/ProductsSection.vue";
import InvestmentsSection from "../components/admin/InvestmentsSection.vue";
import NotificationsSection from "../components/admin/NotificationsSection.vue";
import SettingsSection from "../components/admin/SettingsSection.vue";
import { useAdminStore } from "../stores/adminStore";
import { useRouter } from "vue-router";
import { ApiService } from "../services/apiService";

const adminStore = useAdminStore();
const router = useRouter();

const VALID_TABS = ["users", "transactions", "tasks", "products", "investments", "notifications", "settings"];
const savedTab = localStorage.getItem("admin_current_tab");
const currentTab = ref(VALID_TABS.includes(savedTab) ? savedTab : "users");
const isSidebarOpen = ref(window.innerWidth > 768);

const tabs = [
  { id: "users", name: "Пользователи" },
  { id: "transactions", name: "Транзакции" },
  { id: "tasks", name: "Задания" },
  { id: "products", name: "Продукты" },
  { id: "investments", name: "Инвестиции" },
  { id: "notifications", name: "Уведомления" },
  { id: "settings", name: "Настройки" },
];

const currentTabName = computed(() => {
  return tabs.find((tab) => tab.id === currentTab.value)?.name || "";
});

const switchTab = (tabId) => {
  currentTab.value = tabId;
  localStorage.setItem("admin_current_tab", tabId);
  if (window.innerWidth <= 768) {
    isSidebarOpen.value = false;
  }
};

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

// Проверка авторизации при входе
onMounted(async () => {
  const token = localStorage.getItem("token");

  if (!token) return router.push("/admin/login");

  const { success } = await ApiService.checkAuth(token);

  if (!success) {
    return router.push("/admin/login");
  } else {
    adminStore.fetchUsers();
  }

  window.addEventListener("resize", handleResize);
});

// Метод обработки изменения размера окна
const handleResize = () => {
  if (window.innerWidth > 768) {
    isSidebarOpen.value = true;
  }
};
</script>

<style scoped>
.admin-page {
  display: flex;
  min-height: 100vh;
  background: #f5f5f5;
  position: relative;
}

.admin-sidebar {
  width: 250px;
  min-width: 250px; /* Фиксированная ширина сайдбара */
  background: #1a1a1a;
  padding: 20px;
  color: white;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 1000;
  overflow-y: auto;
  transition: transform 0.3s ease;
}

.admin-sidebar--open {
  transform: translateX(0);
}

.mobile-header {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: white;
  padding: 0 20px;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.admin-content {
  flex: 1;
  padding: 20px;
  margin-left: 250px; /* Соответствует ширине сайдбара */
  min-height: 100vh;
  box-sizing: border-box;
  overflow-y: auto;
  transition: margin-left 0.3s ease;
}

.admin-content.sidebar-closed {
  margin-left: 0;
}

.admin-logo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #333;
}

/* Стили для логотипа */
.logo-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-text {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(90deg, #8c60e3, #5cbdff);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  position: relative;
  letter-spacing: 0.5px;
}

.logo-text span {
  background: linear-gradient(90deg, #5cbdff, #8c60e3);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 400;
}

.logo-container svg {
  filter: drop-shadow(0 0 5px rgba(140, 96, 227, 0.7));
  stroke: url(#gradient);
  animation: pulse 2s infinite alternate;
}

@keyframes pulse {
  from {
    filter: drop-shadow(0 0 2px rgba(140, 96, 227, 0.7));
  }
  to {
    filter: drop-shadow(0 0 8px rgba(92, 189, 255, 0.9));
  }
}

.admin-nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nav-button {
  display: flex;
  align-items: center;
  padding: 12px;
  background: none;
  border: none;
  color: white;
  text-align: left;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.3s ease;
  font-size: 14px;
}

.nav-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-button.active {
  background: var(--primary-color, #8c60e3);
  box-shadow: 0 4px 12px rgba(140, 96, 227, 0.3);
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  width: 24px;
  height: 24px;
}

.nav-text {
  flex: 1;
}

.sidebar-toggle {
  display: none;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 8px;
}

@media (max-width: 768px) {
  .admin-page {
    display: block; /* На мобильных меняем flexbox на блочную модель */
  }

  .admin-sidebar {
    transform: translateX(-100%);
    width: 80%;
    max-width: 300px;
  }

  .admin-sidebar--open {
    transform: translateX(0);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  }

  .mobile-header {
    display: flex;
  }

  .sidebar-toggle {
    display: block;
  }

  .admin-content {
    margin-left: 0;
    overflow-y: auto;
    max-height: 100vh;
    padding-top: 80px; /* Отступ для мобильного заголовка */
  }
}
</style>
