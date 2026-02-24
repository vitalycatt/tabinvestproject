<!-- src/components/admin/InvestmentsSection.vue -->
<template>
  <div class="section-container">
    <div class="section-header">
      <h2>Управление инвестициями</h2>
      <BaseButton type="primary" @click="openInvestmentModal()">
        Добавить инвестицию
      </BaseButton>
    </div>

    <div class="section-content">
      <div class="investments-layout">

        <!-- Статистика по инвестициям -->
        <BaseCard class="investments-stats">
          <h3>Статистика инвестиций</h3>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ investments.length }}</div>
              <div class="stat-label">Всего инвестиций</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ activeInvestmentsCount }}</div>
              <div class="stat-label">Активных инвестиций</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ categoriesCount }}</div>
              <div class="stat-label">Категорий</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ avgIncome }}</div>
              <div class="stat-label">Средний доход</div>
            </div>
          </div>
        </BaseCard>

        <!-- Список инвестиций -->
        <BaseCard class="investments-list">
          <div class="list-header">
            <h3>Список инвестиций</h3>
            <div class="filter-controls">
              <select v-model="filterCategory" class="form-input">
                <option value="all">Все категории</option>
                <option value="finances">Финансы</option>
                <option value="technology">Технологии</option>
                <option value="business">Бизнес</option>
                <option value="realestate">Недвижимость</option>
              </select>
              <select v-model="filterStatus" class="form-input">
                <option value="all">Все инвестиции</option>
                <option value="active">Активные</option>
                <option value="inactive">Неактивные</option>
              </select>
              <input
                  type="text"
                  v-model="searchQuery"
                  placeholder="Поиск..."
                  class="form-input"
              />
            </div>
          </div>

          <LoadingSpinner v-if="loading" />

          <div v-else-if="filteredInvestments.length === 0" class="empty-list">
            <p>Инвестиции не найдены</p>
          </div>

          <div v-else class="investments-table">
            <table>
              <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Категория</th>
                <th>Доход</th>
                <th>Цена</th>
                <th>Тип</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="investment in filteredInvestments" :key="investment._id">
                <td>{{ investment._id }}</td>
                <td>{{ investment.name }}</td>
                <td>{{ getCategoryName(investment.category) }}</td>
                <td>{{ formatMoney(investment.baseIncome) }}</td>
                <td>{{ formatMoney(investment.cost) }}</td>
                <td>{{ getInvestmentType(investment.type) }}</td>
                <td>
                    <span :class="['status-badge', investment.active ? 'active' : 'inactive']">
                      {{ investment.active ? 'Активна' : 'Неактивна' }}
                    </span>
                </td>
                <td class="actions">
                  <button class="action-btn edit" @click="openInvestmentModal(investment)" title="Редактировать">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="action-btn delete" @click="deleteInvestment(investment)" title="Удалить">
                    <i class="fas fa-trash"></i>
                  </button>
                  <button
                      class="action-btn toggle"
                      @click="toggleInvestmentStatus(investment)"
                      :title="investment.active ? 'Деактивировать' : 'Активировать'"
                  >
                    <i :class="investment.active ? 'fas fa-times-circle' : 'fas fa-check-circle'"></i>
                  </button>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </BaseCard>
      </div>
    </div>

    <InvestmentModal
        v-if="showInvestmentModal"
        :investment="currentInvestment"
        @close="showInvestmentModal = false"
        @save="saveInvestment"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue';
import { ApiService } from '@/services/apiService'
import BaseCard from '../ui/BaseCard.vue';
import BaseButton from '../ui/BaseButton.vue';
import LoadingSpinner from '../ui/LoadingSpinner.vue';
import InvestmentModal from '../admin/modals/InvestmentModal.vue';

const notifications = inject('notifications');

// Состояние
const loading = ref(true);
const saving = ref(false);
const investments = ref([]);
const showInvestmentModal = ref(false);
const filterCategory = ref('all');
const filterStatus = ref('all');
const searchQuery = ref('');

// Модель инвестиции
const defaultInvestment = {
  name: '',
  category: 'finances',
  baseIncome: 0,
  cost: 0,
  level: 1,
  multiplier: 1.2,
  type: 'linear',
  active: true,
  image: '',
  description: '',
  order: 0,
  bonus_percent: 0
};

const currentInvestment = ref({ ...defaultInvestment });

// Вычисляемые свойства
const filteredInvestments = computed(() => {
  let result = investments.value;

  // Фильтрация по категории
  if (filterCategory.value !== 'all') {
    result = result.filter(investment => investment.category === filterCategory.value);
  }

  // Фильтрация по статусу
  if (filterStatus.value !== 'all') {
    const isActive = filterStatus.value === 'active';
    result = result.filter(investment => investment.active === isActive);
  }

  // Поиск по названию
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(investment =>
        investment.name?.toLowerCase().includes(query) ||
        investment.description?.toLowerCase().includes(query)
    );
  }

  // Сортировка по порядку и категории
  result.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return (a.order || 0) - (b.order || 0);
  });

  return result;
});

const activeInvestmentsCount = computed(() => {
  return investments.value.filter(i => i.active).length;
});

const categoriesCount = computed(() => {
  const categories = new Set(investments.value.map(i => i.category));
  return categories.size;
});

const avgIncome = computed(() => {
  if (investments.value.length === 0) return 0;

  const totalIncome = investments.value.reduce((sum, i) => sum + (i.baseIncome || 0), 0);
  return formatMoney(totalIncome / investments.value.length);
});

// Методы
const loadInvestments = async () => {
  try {
    loading.value = true;
    console.log('Загрузка инвестиций...');

    const response = await ApiService.getInvestments();
    console.log('Ответ от сервера:', response);

    if (response && response.success && response.data) {
      investments.value = response.data.map(investment => {
        // Проверяем, если изображение не содержит полный URL
        if (investment.image && !investment.image.startsWith('http')) {
          // Добавляем префикс к имени файла
          investment.imageUrl = `${ApiService.API_URL}${investment.image}`;
        } else {
          investment.imageUrl = investment.image;
        }

        return {
          ...investment,
          id: investment._id // Добавляем id для совместимости с фронтендом
        };
      });
    } else {
      console.error('Неожиданный формат ответа:', response);
      investments.value = [];
    }
  } catch (error) {
    console.error('Ошибка загрузки инвестиций:', error);
    notifications.addNotification({
      message: `Ошибка загрузки инвестиций: ${error.message}`,
      type: 'error'
    });
    investments.value = [];
  } finally {
    loading.value = false;
  }
};

const openInvestmentModal = (investment = null) => {
  if (investment) {
    currentInvestment.value = { ...investment };
  } else {
    currentInvestment.value = {
      ...defaultInvestment,
      order: investments.value.length // Устанавливаем порядок в конец списка
    };
  }
  showInvestmentModal.value = true;
};

const saveInvestment = async (investmentData, isFormData = false) => {
  try {
    saving.value = true;

    // Проверка обязательных полей для обычного объекта
    if (!isFormData && (!investmentData.name || !investmentData.category)) {
      notifications.addNotification({
        message: 'Название и категория инвестиции обязательны',
        type: 'warning'
      });
      return;
    }

    let response;

    if (isFormData) {
      // Загрузка с файлом
      if (currentInvestment.value._id) {
        // Обновление существующей инвестиции с файлом
        response = await ApiService.updateInvestmentWithImage(
            currentInvestment.value._id,
            investmentData
        );
      } else {
        // Создание новой инвестиции с файлом
        response = await ApiService.createInvestmentWithImage(investmentData);
      }
    } else {
      // Обычная загрузка без файла
      if (currentInvestment.value._id) {
        // Обновление существующей инвестиции
        response = await ApiService.updateInvestment(
            currentInvestment.value._id,
            investmentData
        );
      } else {
        // Создание новой инвестиции
        response = await ApiService.createInvestment(investmentData);
      }
    }

    console.log('Ответ от сервера:', response);

    if (response && response.success) {
      // Успешное создание/обновление
      notifications.addNotification({
        message: currentInvestment.value._id ? 'Инвестиция успешно обновлена' : 'Инвестиция успешно создана',
        type: 'success'
      });

      showInvestmentModal.value = false;
      await loadInvestments(); // Перезагрузка списка инвестиций
    } else {
      throw new Error('Не удалось сохранить инвестицию');
    }
  } catch (error) {
    console.error('Ошибка сохранения инвестиции:', error);
    notifications.addNotification({
      message: `Ошибка при сохранении инвестиции: ${error.message}`,
      type: 'error'
    });
  } finally {
    saving.value = false;
  }
};

const deleteInvestment = async (investment) => {
  if (confirm(`Вы действительно хотите удалить инвестицию "${investment.name}"?`)) {
    try {
      loading.value = true;
      const investmentId = investment._id || investment.id;
      await ApiService.deleteInvestment(investmentId);
      notifications.addNotification({
        message: 'Инвестиция успешно удалена',
        type: 'success'
      });
      await loadInvestments();
    } catch (error) {
      console.error('Error deleting investment:', error);
      notifications.addNotification({
        message: 'Ошибка при удалении инвестиции',
        type: 'error'
      });
    } finally {
      loading.value = false;
    }
  }
};

const toggleInvestmentStatus = async (investment) => {
  try {
    loading.value = true;
    const investmentId = investment._id || investment.id;
    await ApiService.updateInvestment(investmentId, {
      active: !investment.active
    });

    notifications.addNotification({
      message: `Инвестиция ${investment.active ? 'деактивирована' : 'активирована'}`,
      type: 'success'
    });

    await loadInvestments();
  } catch (error) {
    console.error('Error toggling investment status:', error);
    notifications.addNotification({
      message: 'Ошибка при изменении статуса инвестиции',
      type: 'error'
    });
  } finally {
    loading.value = false;
  }
};

// Вспомогательные функции
const formatMoney = (num) => {
  if (!num && num !== 0) return '0';

  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const getCategoryName = (category) => {
  const categories = {
    finances: 'Финансы',
    technology: 'Технологии',
    business: 'Бизнес',
    realestate: 'Недвижимость'
  };
  return categories[category] || category;
};

const getInvestmentType = (type) => {
  const types = {
    linear: 'Линейный',
    parabolic: 'Параболический',
    exponential: 'Экспоненциальный',
    inverse_parabolic: 'Обратно-параболический'
  };
  return types[type] || type;
};

// Загрузка данных при монтировании компонента
onMounted(async () => {
  await loadInvestments();
});
</script>

<style scoped>
/* Общие стили для секции */
.section-container {
  width: 100%;
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
  max-height: 90vh;
  overflow-y: scroll;
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

/* Специфичные стили для InvestmentsSection */
.investments-layout {
  display: grid;
  grid-template-columns: auto;
  gap: 20px;
  height: 100%;
}

.investments-list {
  width: 100%;
  overflow-x: auto;
}

/* Таблица инвестиций */
.investments-table {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
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

.status-badge.inactive {
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
  color: #2196f3;
}

.action-btn.delete {
  color: #f44336;
}

.action-btn.toggle {
  color: #ff9800;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

/* Статистика */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
  color: var(--primary-color, #8C60E3);
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filter-controls {
  display: flex;
  gap: 8px;
}

.empty-list {
  text-align: center;
  padding: 30px;
  background: #f8f9fa;
  border-radius: 8px;
  color: #666;
}

/* Адаптивность */
@media (max-width: 1024px) {
  .investments-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .filter-controls {
    flex-direction: column;
    width: 100%;
  }
}
</style>