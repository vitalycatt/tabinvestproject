<!-- src/components/admin/ProductsSection.vue -->
<template>
  <div class="section-container">
    <div class="section-header">
      <h2>Управление продуктами</h2>
      <BaseButton type="primary" @click="openProductModal()">
        Добавить продукт
      </BaseButton>
    </div>

    <div class="section-content">
      <div class="products-layout">

        <!-- Статистика по продуктам -->
        <BaseCard class="products-stats">
          <h3>Статистика продуктов</h3>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ products.length }}</div>
              <div class="stat-label">Всего продуктов</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ activeProductsCount }}</div>
              <div class="stat-label">Активных продуктов</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ totalClaims }}</div>
              <div class="stat-label">Общее количество заявок</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ pendingClaims }}</div>
              <div class="stat-label">Ожидающих обработки</div>
            </div>
          </div>

          <div class="recent-claims" v-if="recentClaims.length > 0">
            <h4>Последние заявки</h4>
            <div class="claim-item" v-for="claim in recentClaims" :key="claim._id">
              <div class="claim-user">{{ claim.userData?.first_name || 'Пользователь' }}</div>
              <div class="claim-product">{{ claim.productId?.name || 'Продукт' }}</div>
              <div class="claim-date">{{ formatDate(claim.createdAt) }}</div>
              <div class="claim-status">
                <select
                    v-model="claim.status"
                    @change="updateClaimStatus(claim)"
                    class="status-select"
                    :class="getClaimStatusClass(claim.status)"
                >
                  <option value="pending">В обработке</option>
                  <option value="processing">Обрабатывается</option>
                  <option value="completed">Выполнено</option>
                  <option value="cancelled">Отменено</option>
                </select>
              </div>
            </div>
          </div>
          <div v-else class="no-claims">
            <p>Нет свежих заявок</p>
          </div>
        </BaseCard>


        <!-- Список продуктов -->
        <BaseCard class="products-list">
          <div class="list-header">
            <h3>Список продуктов</h3>
            <div class="filter-controls">
              <select v-model="filterStatus" class="form-input">
                <option value="all">Все продукты</option>
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

          <div v-else-if="filteredProducts.length === 0" class="empty-list">
            <p>Продукты не найдены</p>
          </div>

          <div v-else class="products-table">
            <table>
              <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Необходимый доход</th>
                <th>Тип</th>
                <th>Заявки</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="product in filteredProducts" :key="product._id" :class="{'dragging': draggingProduct === product}">
                <td>{{ product._id }}</td>
                <td>{{ product.name }}</td>
                <td>{{ formatMoney(product.requiredIncome) }}</td>
                <td>{{ getProductType(product.type) }}</td>
                <td>{{ product.stats?.claims || 0 }}</td>
                <td>
                    <span :class="['status-badge', product.active ? 'active' : 'inactive']">
                      {{ product.active ? 'Активен' : 'Неактивен' }}
                    </span>
                </td>
                <td class="actions">
                  <button class="action-btn view" @click="viewProductClaims(product)" title="Заявки">
                    <i class="fas fa-user-check"></i>
                  </button>
                  <button class="action-btn edit" @click="openProductModal(product)" title="Редактировать">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="action-btn delete" @click="deleteProduct(product)" title="Удалить">
                    <i class="fas fa-trash"></i>
                  </button>
                  <button
                      class="action-btn toggle"
                      @click="toggleProductStatus(product)"
                      :title="product.active ? 'Деактивировать' : 'Активировать'"
                  >
                    <i :class="product.active ? 'fas fa-times-circle' : 'fas fa-check-circle'"></i>
                  </button>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </BaseCard>


      </div>
    </div>


    <ProductModal
        v-if="showProductModal"
        :product="currentProduct"
        @close="showProductModal = false"
        @save="saveProduct"
    />

    <!-- Модальное окно просмотра заявок на продукт -->
    <BaseModal
        v-if="showClaimsModal"
        :title="`Заявки на продукт: ${selectedProduct?.name || ''}`"
        @close="showClaimsModal = false"
    >
      <div v-if="loading" class="claims-loading">
        <LoadingSpinner message="Загрузка заявок..." />
      </div>

      <div v-else-if="productClaims.length === 0" class="no-claims">
        <p>На этот продукт пока нет заявок</p>
      </div>

      <div v-else class="product-claims">
        <div class="claims-filter">
          <select v-model="claimsFilter" class="form-input">
            <option value="all">Все заявки</option>
            <option value="pending">В обработке</option>
            <option value="processing">Обрабатываются</option>
            <option value="completed">Выполнены</option>
            <option value="cancelled">Отменены</option>
          </select>
        </div>

        <div class="claims-list">
          <div
              v-for="claim in filteredClaims"
              :key="claim._id"
              class="claim-card"
          >
            <div class="claim-header">
              <div class="user-info">
                <img
                    :src="claim.userData?.photo_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(claim.userData?.first_name || 'User')"
                    :alt="claim.userData?.first_name || 'User'"
                    class="user-avatar"
                />
                <div class="user-details">
                  <div class="user-name">{{ claim.userData?.first_name || 'Пользователь' }} {{ claim.userData?.last_name || '' }}</div>
                  <div class="user-telegram">@{{ claim.userData?.username || 'username' }}</div>
                </div>
              </div>
              <div class="claim-date">{{ formatDate(claim.createdAt) }}</div>
            </div>

            <div class="claim-body">
              <div class="claim-status-info">
                <div class="status-label">Статус заявки:</div>
                <select
                    v-model="claim.status"
                    @change="updateClaimStatus(claim)"
                    class="status-select full-width"
                    :class="getClaimStatusClass(claim.status)"
                >
                  <option value="pending">В обработке</option>
                  <option value="processing">Обрабатывается</option>
                  <option value="completed">Выполнено</option>
                  <option value="cancelled">Отменено</option>
                </select>
              </div>

              <div class="claim-note" v-if="claim.note">
                <div class="note-label">Примечание:</div>
                <div class="note-text">{{ claim.note }}</div>
              </div>

              <div class="claim-actions">
                <BaseButton type="secondary" @click="addClaimNote(claim)">
                  {{ claim.note ? 'Изменить примечание' : 'Добавить примечание' }}
                </BaseButton>
                <BaseButton type="primary" @click="openChat(claim)">
                  Написать пользователю
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>

    <!-- Модальное окно для добавления примечания к заявке -->
    <BaseModal
        v-if="showNoteModal"
        title="Примечание к заявке"
        @close="showNoteModal = false"
    >
      <BaseForm @submit="saveClaimNote">
        <FormGroup label="Примечание для внутреннего использования">
          <textarea
              v-model="currentNote"
              class="form-input"
              rows="4"
              placeholder="Введите примечание к заявке..."
          ></textarea>
        </FormGroup>

        <div class="form-actions">
          <BaseButton type="secondary" @click="showNoteModal = false">
            Отмена
          </BaseButton>
          <BaseButton type="primary">
            Сохранить примечание
          </BaseButton>
        </div>
      </BaseForm>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue';
import { ApiService } from '../../services/apiService';
import BaseCard from '../ui/BaseCard.vue';
import BaseButton from '../ui/BaseButton.vue';
import BaseForm from '../ui/BaseForm.vue';
import FormGroup from '../ui/FormGroup.vue';
import BaseModal from '../ui/BaseModal.vue';
import LoadingSpinner from '../ui/LoadingSpinner.vue';
import ProductModal from '../admin/modals/ProductModal.vue';

const notifications = inject('notifications');

// Состояние
const loading = ref(true);
const saving = ref(false);
const products = ref([]);
const recentClaims = ref([]);
const showProductModal = ref(false);
const showClaimsModal = ref(false);
const showNoteModal = ref(false);
const filterStatus = ref('all');
const searchQuery = ref('');
const selectedProduct = ref(null);
const productClaims = ref([]);
const claimsFilter = ref('all');
const currentNote = ref('');
const selectedClaim = ref(null);
const draggingProduct = ref(null);

// Модель продукта
const defaultProduct = {
  name: '',
  description: '',
  requiredIncome: 0,
  image: '',
  type: 'digital',
  active: true,
  claimInstructions: '',
  order: 0,
  gradient: ''
};

const currentProduct = ref({ ...defaultProduct });

// Вычисляемые свойства
const filteredProducts = computed(() => {
  let result = products.value;

  // Фильтрация по статусу
  if (filterStatus.value !== 'all') {
    const isActive = filterStatus.value === 'active';
    result = result.filter(product => product.active === isActive);
  }

  // Поиск по названию
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(product =>
        product.name?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)
    );
  }

  // Сортировка по порядку отображения
  result.sort((a, b) => (a.order || 0) - (b.order || 0));

  return result;
});

const activeProductsCount = computed(() => {
  return products.value.filter(p => p.active).length;
});

const totalClaims = computed(() => {
  return products.value.reduce((sum, product) => sum + (product.stats?.claims || 0), 0);
});

const pendingClaims = computed(() => {
  let count = 0;
  products.value.forEach(product => {
    if (product.stats) {
      const pendingCount = product.stats.claims -
          (product.stats.completedClaims || 0) -
          (product.stats.cancelledClaims || 0);
      count += Math.max(0, pendingCount);
    }
  });
  return count;
});

const filteredClaims = computed(() => {
  if (claimsFilter.value === 'all') {
    return productClaims.value;
  }
  return productClaims.value.filter(claim => claim.status === claimsFilter.value);
});

// Методы

// для обработки путей к изображениям
const loadProducts = async () => {
  try {
    loading.value = true;
    console.log('Загрузка продуктов...');

    const response = await ApiService.getProducts();
    console.log('Ответ от сервера:', response);

    if (response && response.success && response.data) {
      // Сервер возвращает { success: true, data: [...] }
      products.value = response.data.map(product => {
        // Проверяем, если изображение не содержит полный URL или путь с /uploads/
        if (product.image && !product.image.startsWith('http')) {
          // Добавляем префикс /uploads/ к имени файла
          product.imageUrl = `${ApiService.API_URL}${product.image}`;
        } else {
          product.imageUrl = product.image;
        }

        return {
          ...product,
          id: product._id // Добавляем id для совместимости с фронтендом
        };
      });

      // После загрузки продуктов, загружаем заявки
      loadRecentClaims();
    } else {
      console.error('Неожиданный формат ответа:', response);
      products.value = [];
    }
  } catch (error) {
    console.error('Ошибка загрузки продуктов:', error);
    notifications.addNotification({
      message: `Ошибка загрузки продуктов: ${error.message}`,
      type: 'error'
    });
    products.value = [];
  } finally {
    loading.value = false;
  }
};

const loadRecentClaims = async () => {
  try {
    console.log('Загрузка последних заявок...');
    const response = await ApiService.getRecentClaims();
    console.log('Ответ по заявкам от сервера:', response);

    if (response && response.success && Array.isArray(response.data)) {
      recentClaims.value = response.data;
      console.log('Загружены заявки:', recentClaims.value);
    } else if (response && Array.isArray(response)) {
      recentClaims.value = response;
      console.log('Загружены заявки (формат массива):', recentClaims.value);
    } else {
      console.error('Неожиданный формат ответа по заявкам:', response);
      recentClaims.value = [];
    }
  } catch (error) {
    console.error('Ошибка загрузки последних заявок:', error);
    notifications.addNotification({
      message: 'Ошибка при загрузке последних заявок',
      type: 'error'
    });
    recentClaims.value = [];
  }
};

const openProductModal = (product = null) => {
  if (product) {
    currentProduct.value = { ...product };
  } else {
    currentProduct.value = {
      ...defaultProduct,
      order: products.value.length // Устанавливаем порядок в конец списка
    };
  }
  showProductModal.value = true;
};

const saveProduct = async (productData, isFormData = false) => {
  try {
    saving.value = true;

    // Проверка обязательных полей для обычного объекта
    if (!isFormData && (!productData.name || !productData.description)) {
      notifications.addNotification({
        message: 'Название и описание продукта обязательны',
        type: 'warning'
      });
      return;
    }

    let response;

    if (isFormData) {
      // Загрузка с файлом
      if (currentProduct.value._id) {
        // Обновление существующего продукта с файлом
        response = await ApiService.updateProductWithImage(
            currentProduct.value._id,
            productData
        );
      } else {
        // Создание нового продукта с файлом
        response = await ApiService.createProductWithImage(productData);
      }
    } else {
      // Обычная загрузка без файла
      if (currentProduct.value._id) {
        // Обновление существующего продукта
        response = await ApiService.updateProduct(
            currentProduct.value._id,
            productData
        );
      } else {
        // Создание нового продукта
        response = await ApiService.createProduct(productData);
      }
    }

    console.log('Ответ от сервера:', response);

    if (response && response.success) {
      // Успешное создание/обновление
      notifications.addNotification({
        message: currentProduct.value._id ? 'Продукт успешно обновлен' : 'Продукт успешно создан',
        type: 'success'
      });

      showProductModal.value = false;
      await loadProducts(); // Перезагрузка списка продуктов
    } else {
      throw new Error('Не удалось сохранить продукт');
    }
  } catch (error) {
    console.error('Ошибка сохранения продукта:', error);
    notifications.addNotification({
      message: `Ошибка при сохранении продукта: ${error.message}`,
      type: 'error'
    });
  } finally {
    saving.value = false;
  }
};

const deleteProduct = async (product) => {
  if (confirm(`Вы действительно хотите удалить продукт "${product.name}"?`)) {
    try {
      loading.value = true;
      const productId = product._id || product.id;
      await ApiService.deleteProduct(productId);
      notifications.addNotification({
        message: 'Продукт успешно удален',
        type: 'success'
      });
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      notifications.addNotification({
        message: 'Ошибка при удалении продукта',
        type: 'error'
      });
    } finally {
      loading.value = false;
    }
  }
};

const toggleProductStatus = async (product) => {
  try {
    loading.value = true;
    const productId = product._id || product.id;
    await ApiService.updateProduct(productId, {
      active: !product.active
    });

    notifications.addNotification({
      message: `Продукт ${product.active ? 'деактивирован' : 'активирован'}`,
      type: 'success'
    });

    await loadProducts();
  } catch (error) {
    console.error('Error toggling product status:', error);
    notifications.addNotification({
      message: 'Ошибка при изменении статуса продукта',
      type: 'error'
    });
  } finally {
    loading.value = false;
  }
};

const viewProductClaims = async (product) => {
  try {
    loading.value = true;
    selectedProduct.value = product;
    const productId = product._id || product.id;

    console.log('Загрузка заявок для продукта:', productId);
    // Загрузка заявок для выбранного продукта
    const response = await ApiService.getProductClaims(productId);
    console.log('Ответ заявок для продукта:', response);

    if (response && response.success && Array.isArray(response.data)) {
      productClaims.value = response.data;
    } else if (response && Array.isArray(response)) {
      productClaims.value = response;
    } else {
      console.error('Неожиданный формат ответа по заявкам продукта:', response);
      productClaims.value = [];
    }

    showClaimsModal.value = true;
  } catch (error) {
    console.error('Error loading product claims:', error);
    notifications.addNotification({
      message: 'Ошибка при загрузке заявок на продукт',
      type: 'error'
    });
    productClaims.value = [];
  } finally {
    loading.value = false;
  }
};

const updateClaimStatus = async (claim) => {
  try {
    loading.value = true;
    const claimId = claim._id || claim.id;

    if (!claimId) {
      throw new Error('ID заявки не определен');
    }

    console.log('Обновление статуса заявки:', claimId, 'на', claim.status);

    await ApiService.updateClaimStatus(claimId, claim.status, { note: claim.note || '' });

    notifications.addNotification({
      message: 'Статус заявки успешно обновлен',
      type: 'success'
    });

    // Обновляем список заявок
    await loadRecentClaims();

    // Если открыто модальное окно для заявок продукта, обновляем и их
    if (showClaimsModal.value && selectedProduct.value) {
      const productId = selectedProduct.value._id || selectedProduct.value.id;
      const productResponse = await ApiService.getProductClaims(productId);
      if (productResponse && productResponse.success && Array.isArray(productResponse.data)) {
        productClaims.value = productResponse.data;
      } else if (productResponse && Array.isArray(productResponse)) {
        productClaims.value = productResponse;
      }
    }

    // Обновляем статистику продуктов
    await loadProducts();
  } catch (error) {
    console.error('Error updating claim status:', error);
    notifications.addNotification({
      message: 'Ошибка при обновлении статуса заявки: ' + error.message,
      type: 'error'
    });
  } finally {
    loading.value = false;
  }
};

const addClaimNote = (claim) => {
  selectedClaim.value = claim;
  currentNote.value = claim.note || '';
  showNoteModal.value = true;
};

const saveClaimNote = async () => {
  if (!selectedClaim.value) return;

  try {
    loading.value = true;
    const claimId = selectedClaim.value._id || selectedClaim.value.id;

    await ApiService.updateClaimStatus(claimId, selectedClaim.value.status, {
      note: currentNote.value
    });

    // Обновляем локальную копию заявки
    selectedClaim.value.note = currentNote.value;

    // Обновляем заявку в массиве recentClaims
    const claimIndex = recentClaims.value.findIndex(c => (c._id || c.id) === claimId);
    if (claimIndex !== -1) {
      recentClaims.value[claimIndex].note = currentNote.value;
    }

    // Обновляем заявку в массиве productClaims
    const productClaimIndex = productClaims.value.findIndex(c => (c._id || c.id) === claimId);
    if (productClaimIndex !== -1) {
      productClaims.value[productClaimIndex].note = currentNote.value;
    }

    notifications.addNotification({
      message: 'Примечание к заявке сохранено',
      type: 'success'
    });

    showNoteModal.value = false;
  } catch (error) {
    console.error('Error saving claim note:', error);
    notifications.addNotification({
      message: 'Ошибка при сохранении примечания к заявке',
      type: 'error'
    });
  } finally {
    loading.value = false;
  }
};

const openChat = (claim) => {
  if (!claim.userData?.telegramId && !claim.userId) {
    notifications.addNotification({
      message: 'Невозможно открыть чат, ID пользователя недоступен',
      type: 'error'
    });
    return;
  }

  // Открытие чата в Telegram
  const userId = claim.userData?.telegramId || claim.userId;
  const username = claim.userData?.username;

  const telegramUrl = username
      ? `https://t.me/${username}`
      : `https://t.me/${userId}`;

  window.open(telegramUrl, '_blank');
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

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString();
};

const getProductType = (type) => {
  const types = {
    physical: 'Физический товар',
    digital: 'Цифровой товар',
    service: 'Услуга'
  };
  return types[type] || type;
};

const getClaimStatusClass = (status) => {
  const classes = {
    pending: 'status-pending',
    processing: 'status-processing',
    completed: 'status-completed',
    cancelled: 'status-cancelled'
  };
  return classes[status] || '';
};

const getDefaultGradient = (index) => {
  const gradients = [
    'linear-gradient(140.83deg, rgb(111, 95, 242) 0%, rgb(73, 51, 131) 100%)',
    'linear-gradient(140.83deg, rgb(242, 95, 95) 0%, rgb(131, 51, 51) 100%)',
    'linear-gradient(140.83deg, rgb(95, 135, 242) 0%, rgb(51, 71, 131) 100%)',
    'linear-gradient(140.83deg, rgb(95, 242, 169) 0%, rgb(51, 131, 94) 100%)',
    'linear-gradient(140.83deg, rgb(242, 95, 156) 0%, rgb(131, 51, 87) 100%)',
    'linear-gradient(140.83deg, rgb(242, 162, 95) 0%, rgb(131, 90, 51) 100%)'
  ];

  const idx = typeof index === 'number' ? index % gradients.length : 0;
  return gradients[idx];
};

// Загрузка данных при монтировании компонента
onMounted(async () => {
  await loadProducts();
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

/* Специфичные стили для ProductsSection */
.products-layout {
  display: grid;
  grid-template-columns: auto;
  gap: 20px;
  height: 100%;
}

.products-list {
  width: 100%;
  overflow-x: auto;
}

/* Таблица продуктов */
.products-table {
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

/* Заявки */
.recent-claims {
  margin-top: 20px;
}

.recent-claims h4 {
  margin-bottom: 16px;
}

.claim-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 8px;
  margin-bottom: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.claim-user, .claim-product {
  flex: 1;
}

.claim-date {
  font-size: 12px;
  color: #666;
}

.no-claims {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  color: #666;
}

/* Селект статуса заявки */
.status-select {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
  font-size: 12px;
}

.status-select.full-width {
  width: 100%;
}

.status-select.status-pending {
  background-color: #fff3e0;
  border-color: #ff9800;
}

.status-select.status-processing {
  background-color: #e3f2fd;
  border-color: #2196f3;
}

.status-select.status-completed {
  background-color: #e8f5e9;
  border-color: #4caf50;
}

.status-select.status-cancelled {
  background-color: #ffebee;
  border-color: #f44336;
}

/* Модальное окно заявок на продукт */
.claims-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
  max-height: 60vh;
  overflow-y: auto;
}

.claim-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.claim-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
}

.user-telegram {
  font-size: 12px;
  color: #666;
}

.claim-body {
  padding: 12px;
}

.claim-status-info {
  margin-bottom: 12px;
}

.status-label {
  font-size: 14px;
  margin-bottom: 4px;
}

.claim-note {
  margin-top: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.note-label {
  font-weight: 500;
  margin-bottom: 4px;
}

.note-text {
  font-size: 14px;
  line-height: 1.5;
}

.claim-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

/* Превью цвета */
.color-preview {
  width: 100%;
  height: 30px;
  border-radius: 4px;
  margin-top: 8px;
}

/* Форма */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

/* Состояние перетаскивания */
.dragging {
  opacity: 0.5;
  background: #f1f1f1;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

/* Адаптивность */
@media (max-width: 1024px) {
  .products-layout {
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

  .claim-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .user-info {
    width: 100%;
  }
}
</style>