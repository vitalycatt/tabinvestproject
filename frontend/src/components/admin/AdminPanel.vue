<!-- src/components/admin/AdminPanel.vue -->
<template>
  <div class="admin-panel">
    <!-- Сайдбар с навигацией -->
    <div class="admin-sidebar" :class="{ 'admin-sidebar--open': isSidebarOpen }">
      <div class="admin-logo">
        <h2>Admin Panel</h2>
        <button class="sidebar-toggle" @click="toggleSidebar">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <nav class="admin-nav">
        <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="['nav-button', { active: currentTab === tab.id }]"
            @click="switchTab(tab.id)"
        >
          <i :class="tab.icon"></i>
          {{ tab.name }}
        </button>
      </nav>
    </div>

    <!-- Мобильный хедер -->
    <div class="mobile-header">
      <button class="sidebar-toggle" @click="toggleSidebar">
        <i class="fas fa-bars"></i>
      </button>
      <h2>{{ currentTabName }}</h2>
    </div>

    <!-- Основной контент -->
    <div class="admin-content" :class="{ 'sidebar-closed': !isSidebarOpen }">
      <UsersSection v-if="currentTab === 'users'" />
      <TasksSection v-if="currentTab === 'tasks'" />
      <ProductsSection v-if="currentTab === 'products'" />
      <NotificationsSection v-if="currentTab === 'notifications'" />
      <SettingsSection v-if="currentTab === 'settings'" />
      <StatsSection v-if="currentTab === 'stats'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import UsersSection from './UsersSection.vue'
import TasksSection from './TasksSection.vue'
import ProductsSection from './ProductsSection.vue'
import NotificationsSection from './NotificationsSection.vue'
import SettingsSection from './SettingsSection.vue'
import StatsSection from './StatsSection.vue'

const currentTab = ref('users')
const isSidebarOpen = ref(window.innerWidth > 768)

const tabs = [
  { id: 'users', name: 'Пользователи', icon: 'fas fa-users' },
  { id: 'tasks', name: 'Задания', icon: 'fas fa-tasks' },
  { id: 'products', name: 'Продукты', icon: 'fas fa-box' },
  { id: 'notifications', name: 'Уведомления', icon: 'fas fa-bell' },
  { id: 'settings', name: 'Настройки', icon: 'fas fa-cog' },
  { id: 'stats', name: 'Статистика', icon: 'fas fa-chart-bar' }
]

const currentTabName = computed(() => {
  return tabs.find(tab => tab.id === currentTab.value)?.name || ''
})

const switchTab = (tabId) => {
  currentTab.value = tabId
  if (window.innerWidth <= 768) {
    isSidebarOpen.value = false
  }
}

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

// Обработчик изменения размера окна
const handleResize = () => {
  if (window.innerWidth > 768) {
    isSidebarOpen.value = true
  }
}

// Регистрация/удаление обработчика при монтировании/размонтировании
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.admin-panel {
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
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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

.admin-logo h2 {
  margin: 0;
  font-size: 1.5rem;
}

.admin-nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nav-button {
  padding: 12px;
  background: none;
  border: none;
  color: white;
  text-align: left;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.3s ease;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-button i {
  width: 20px;
  text-align: center;
}

.nav-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-button.active {
  background: var(--primary-color, #8C60E3);
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
  .admin-panel {
    display: block; /* На мобильных меняем flexbox на блочную модель */
  }

  .admin-sidebar {
    transform: translateX(-100%);
    width: 80%;
    max-width: 300px;
  }

  .admin-sidebar--open {
    transform: translateX(0);
    box-shadow: 0 0 20px rgba(0,0,0,0.3);
  }

  .mobile-header {
    display: flex;
  }

  .sidebar-toggle {
    display: block;
  }

  .admin-content {
    margin-left: 0;
    padding-top: 80px; /* Отступ для мобильного заголовка */
  }
}
</style>