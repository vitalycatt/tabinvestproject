<!-- src/components/admin/ProductsManagement.vue -->
<template>
  <div class="products-management">
    <div class="header">
      <h2>Управление продуктами</h2>
      <BaseButton @click="openProductModal()" primary>Добавить продукт</BaseButton>
    </div>

    <div class="products-list">
      <LoadingSpinner v-if="loading" />

      <div v-else-if="products.length === 0" class="empty-state">
        <p>Продукты не найдены. Создайте первый продукт.</p>
      </div>

      <div v-else class="products-table">
        <table>
          <thead>
          <tr>
            <th>Изображение</th>
            <th>Название</th>
            <th>Тип</th>
            <th>Требуемый доход</th>
            <th>Заявки</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="product in products" :key="product._id">
            <td>
              <img
                  v-if="product.image"
                  :src="product.image"
                  :alt="product.name"
                  class="product-image"
              />
              <div v-else class="no-image">Нет изображения</div>
            </td>
            <td>{{ product.name }}</td>
            <td>{{ getProductTypeLabel(product.type) }}</td>
            <td>{{ formatMoney(product.requiredIncome) }}</td>
            <td>
              {{ product.stats.claims || 0 }}
              <span class="claims-breakdown" v-if="product.stats.claims">
                  ({{ product.stats.completedClaims || 0 }} выполнено,
                  {{ product.stats.cancelledClaims || 0 }} отменено)
                </span>
            </td>
            <td>
                <span
                    :class="['status-badge', product.active ? 'active' : 'inactive']"
                >
                  {{ product.active ? 'Активен' : 'Неактивен' }}
                </span>
            </td>
            <td class="actions">
              <button class="icon-button" @click="viewProductClaims(product)">
                <i class="fas fa-tasks"></i>
              </button>
              <button class="icon-button" @click="openProductModal(product)">
                <i class="fas fa-edit"></i>
              </button>
              <button class="icon-button" @click="toggleProductStatus(product)">
                <i :class="product.active ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
              <button class="icon-button delete" @click="deleteProduct(product)">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Модальное окно для создания/редактирования продукта -->
    <BaseModal
        v-if="showProductModal"
        :title="isEditMode ? 'Редактирование продукта' : 'Создание продукта'"
        @close="closeProductModal"
    >
      <div class="product-form">
        <div class="form-group">
          <label>Название продукта</label>
          <input v-model="currentProduct.name" class="form-input" required />
        </div>

        <div class="form-group">
          <label>Описание</label>
          <textarea v-model="currentProduct.description" class="form-input" rows="4" required></textarea>
        </div>

        <div class="form-group">
          <label>Тип продукта</label>
          <select v-model="currentProduct.type" class="form-input">
            <option value="physical">Физический товар</option>
            <option value="digital">Цифровой товар</option>
            <option value="service">Услуга</option>
          </select>
        </div>

        <div class="form-group">
          <label>Требуемый пассивный доход</label>
          <input
              type="number"
              v-model.number="currentProduct.requiredIncome"
              class="form-input"
              min="0"
              step="100"
          />
        </div>

        <div class="form-group">
          <label>URL изображения</label>
          <input v-model="currentProduct.image" class="form-input" placeholder="https://example.com/image.jpg" />
        </div>

        <div class="form-group">
          <label>Инструкции по получению</label>
          <textarea
              v-model="currentProduct.claimInstructions"
              class="form-input"
              rows="3"
              placeholder="Инструкции, которые увидит пользователь при оформлении заявки"
          ></textarea>
        </div>

        <div class="form-group">
          <label>CSS-градиент фона</label>
          <input
              v-model="currentProduct.gradient"
              class="form-input"
              placeholder="linear-gradient(to right, #ff416c, #ff4b2b)"
          />
          <div class="gradient-preview" :style="{ background: currentProduct.gradient }"></div>
        </div>

        <div class="form-group checkbox">
          <label>
            <input type="checkbox" v-model="currentProduct.active" />
            Продукт активен
          </label>
        </div>

        <div class="form-actions">
          <BaseButton @click="closeProductModal" secondary>Отмена</BaseButton>
          <BaseButton @click="saveProduct" primary :loading="saving">Сохранить</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Модальное окно для просмотра заявок -->
    <BaseModal
        v-if="showClaimsModal"
        title="Заявки на продукт"
        @close="closeClaimsModal"
    >
      <div v-if="loadingClaims" class="loading-state">
        <LoadingSpinner />
      </div>

      <div v-else-if="productClaims.length === 0" class="empty-state">
        <p>Заявок на данный продукт ещё нет.</p>
      </div>

      <div v-else class="claims-list">
        <div class="claims-filter">
          <select v-model="claimsFilter" class="form-input">
            <option value="all">Все заявки</option>
            <option value="pending">Ожидающие</option>
            <option value="processing">В обработке</option>
            <option value="completed">Выполненные</option>
            <option value="cancelled">Отмененные</option>
          </select>
        </div>

        <div
            v-for="claim in filteredClaims"
            :key="claim._id"
            class="claim-card"
        >
          <div class="claim-header">
            <div class="user-info">
              <div class="user-name">{{ claim.userData.first_name }} {{ claim.userData.last_name }}</div>
              <div class="user-username" v-if="claim.userData.username">@{{ claim.userData.username }}</div>
            </div>
            <div class="claim-date">{{ formatDate(claim.createdAt) }}</div>
          </div>

          <div class="claim-body">
            <div class="claim-status">
              <label>Статус:</label>
              <select
                  v-model="claim.status"
                  @change="updateClaimStatus(claim)"
                  class="form-input"
                  :class="`status-${claim.status}`"
              >
                <option value="pending">Ожидает обработки</option>
                <option value="processing">В обработке</option>
                <option value="completed">Выполнено</option>
                <option value="cancelled">Отменено</option>
              </select>
            </div>

            <div class="claim-note">
              <label>Примечание:</label>
              <textarea
                  v-model="claim.note"
                  class="form-input"
                  placeholder="Внутреннее примечание"
                  rows="2"
              ></textarea>
              <BaseButton
                  @click="saveClaimNote(claim)"
                  small
                  secondary
                  :disabled="savingNote"
              >
                Сохранить примечание
              </BaseButton>
            </div>
          </div>

          <div class="claim-actions">
            <BaseButton @click="contactUser(claim)" primary small>
              <i class="fas fa-comment"></i> Связаться с пользователем
            </BaseButton>
          </div>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue';
import { ApiService } from '../../services/apiService';
import BaseButton from '../ui/BaseButton.vue';
import BaseModal from '../ui/BaseModal.vue';
import LoadingSpinner from '../ui/LoadingSpinner.vue';

const notifications = inject('notifications');

// Состояние
const loading = ref(false);
const saving = ref(false);
const products = ref([]);
const showProductModal = ref(false);
const isEditMode = ref(false);
const currentProduct = ref({
  name: '',
  description: '',
  type: 'digital',
  requiredIncome: 1000,
  image: '',
  claimInstructions: '',
  gradient: 'linear-gradient(140.83deg, rgb(111, 95, 242) 0%, rgb(73, 51, 131) 100%)',
  active: true
});

// Состояние для заявок
const showClaimsModal = ref(false);
const loadingClaims = ref(false);
const productClaims = ref([]);
const claimsFilter = ref('all');
const selectedProduct = ref(null);
const savingNote = ref(false);

// Получение списка продуктов
const loadProducts = async () => {
  try {
    loading.value = true;
    const response = await ApiService.getProducts();

    if (response.success && response.data) {
      products.value = response.data;
    } else {
      console.error('Unexpected response from API:', response);
      notifications.addNotification({
        message: 'Ошибка загрузки продуктов',
        type: 'error'
      });
    }
  } catch (error) {
    console.error('Error loading products:', error);
    notifications.addNotification({
      message: 'Ошибка загрузки продуктов',
      type: 'error'
    });
  } finally {
    loading.value = false;
  }
};

// Открытие модального окна для создания/редактирования продукта
const openProductModal = (product = null) => {
  if (product) {
    currentProduct.value = { ...product };
    isEditMode.value = true;
  } else {
    currentProduct.value = {
      name: '',
      description: '',
      type: 'digital',
      requiredIncome: 1000,
      image: '',
      claimInstructions: '',
      gradient: 'linear-gradient(140.83deg, rgb(111, 95, 242) 0%, rgb(73, 51, 131) 100%)',
      active: true
    };
    isEditMode.value = false;
  }
  showProductModal.value = true;
};

// Закрытие модального окна продукта
const closeProductModal = () => {
  showProductModal.value = false;
};

// Сохранение продукта
const saveProduct = async () => {
  try {
    saving.value = true;

    // Валидация
    if (!currentProduct.value.name || !currentProduct.value.description) {
      notifications.addNotification({
        message: 'Пожалуйста, заполните все обязательные поля',
        type: 'warning'
      });
      return;
    }

    let response;
    if (isEditMode.value && currentProduct.value._id) {
      // Обновление существующего продукта
      response = await ApiService.updateProduct(
          currentProduct.value._id,
          currentProduct.value
      );
    } else {
      // Создание нового продукта
      response = await ApiService.createProduct(currentProduct.value);
    }

    if (response.success) {
      notifications.addNotification({
        message: isEditMode.value ? 'Продукт успешно обновлен' : 'Продукт успешно создан',
        type: 'success'
      });

      closeProductModal();
      await loadProducts();
    } else {
      throw new Error(response.error || 'Ошибка сохранения продукта');
    }
  } catch (error) {
    console.error('Error saving product:', error);
    notifications.addNotification({
      message: 'Ошибка сохранения продукта',
      type: 'error'
    });
  } finally {
    saving.value = false;
  }
};

// Удаление продукта
const deleteProduct = async (product) => {
  if (!confirm(`Вы уверены, что хотите удалить продукт "${product.name}"?`)) {
    return;
  }

  try {
    loading.value = true;
    const response = await ApiService.deleteProduct(product._id);

    if (response.success) {
      notifications.addNotification({
        message: 'Продукт успешно удален',
        type: 'success'
      });
      await loadProducts();
    } else {
      throw new Error(response.error || 'Ошибка удаления продукта');
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    notifications.addNotification({
      message: 'Ошибка удаления продукта',
      type: 'error'
    });
  } finally {
    loading.value = false;
  }
};

// Изменение статуса продукта (активен/неактивен)
const toggleProductStatus = async (product) => {
  try {
    loading.value = true;
    const response = await ApiService.updateProduct(
        product._id,
        { active: !product.active }
    );

    if (response.success) {
      notifications.addNotification({
        message: `Продукт "${product.name}" ${product.active ? 'деактивирован' : 'активирован'}`,
        type: 'success'
      });
      await loadProducts();
    } else {
      throw new Error(response.error || 'Ошибка изменения статуса продукта');
    }
  } catch (error) {
    console.error('Error toggling product status:', error);
    notifications.addNotification({
      message: 'Ошибка изменения статуса продукта',
      type: 'error'
    });
  } finally {
    loading.value = false;
  }
};

// Просмотр заявок на продукт
const viewProductClaims = async (product) => {
  try {
    selectedProduct.value = product;
    showClaimsModal.value = true;
    loadingClaims.value = true;

    const response = await ApiService.getProductClaims(product._id);

    if (response.success && response.data) {
      productClaims.value = response.data;
    } else {
      throw new Error(response.error || 'Ошибка загрузки заявок');
    }
  } catch (error) {
    console.error('Error loading product claims:', error);
    notifications.addNotification({
      message: 'Ошибка загрузки заявок на продукт',
      type: 'error'
    });
  } finally {
    loadingClaims.value = false;
  }
};

// Закрытие модального окна заявок
const closeClaimsModal = () => {
  showClaimsModal.value = false;
  productClaims.value = [];
  selectedProduct.value = null;
};

// Фильтрация заявок
const filteredClaims = computed(() => {
  if (claimsFilter.value === 'all') {
    return productClaims.value;
  }
  return productClaims.value.filter(claim => claim.status === claimsFilter.value);
});

// Обновление статуса заявки
const updateClaimStatus = async (claim) => {
  try {
    loading.value = true;

    const response = await ApiService.updateClaimStatus(
        claim._id,
        claim.status
    );

    if (response.success) {
      notifications.addNotification({
        message: 'Статус заявки обновлен',
        type: 'success'
      });

      // Обновляем локальные данные
      const index = productClaims.value.findIndex(c => c._id === claim._id);
      if (index !== -1) {
        productClaims.value[index] = response.data;
      }

      // Обновляем статистику продукта
      await loadProducts();
    } else {
      throw new Error(response.error || 'Ошибка обновления статуса заявки');
    }
  } catch (error) {
    console.error('Error updating claim status:', error);
    notifications.addNotification({
      message: 'Ошибка обновления статуса заявки',
      type: 'error'
    });
  } finally {
    loading.value = false;
  }
};

// Сохранение примечания к заявке
const saveClaimNote = async (claim) => {
  try {
    savingNote.value = true;

    const response = await ApiService.updateClaimStatus(
        claim._id,
        claim.status,
        { note: claim.note }
    );

    if (response.success) {
      notifications.addNotification({
        message: 'Примечание сохранено',
        type: 'success'
      });
    } else {
      throw new Error(response.error || 'Ошибка сохранения примечания');
    }
  } catch (error) {
    console.error('Error saving claim note:', error);
    notifications.addNotification({
      message: 'Ошибка сохранения примечания',
      type: 'error'
    });
  } finally {
    savingNote.value = false;
  }
};

// Связь с пользователем
const contactUser = (claim) => {
  if (claim.userData && claim.userData.username) {
    // Открываем чат в Telegram
    window.open(`https://t.me/${claim.userData.username}`, '_blank');
  } else {
    notifications.addNotification({
      message: 'У пользователя нет имени пользователя в Telegram',
      type: 'warning'
    });
  }
};

// Вспомогательные функции
const getProductTypeLabel = (type) => {
  const types = {
    physical: 'Физический товар',
    digital: 'Цифровой товар',
    service: 'Услуга'
  };
  return types[type] || type;
};

const formatMoney = (value) => {
  if (!value && value !== 0) return '';

  // Форматируем с разделителем тысяч
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

const formatDate = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  return date.toLocaleString('ru-RU');
};

// Загрузка продуктов при монтировании компонента
onMounted(async () => {
  await loadProducts();
});
</script>

<style scoped>
.products-management {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.products-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 20px;
  overflow-x: auto;
}

.products-table {
  width: 100%;
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
  background: #f5f5f5;
  font-weight: bold;
}

.product-image {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
}

.no-image {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 10px;
  color: #666;
  text-align: center;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.status-badge.active {
  background: #4caf50;
  color: white;
}

.status-badge.inactive {
  background: #f44336;
  color: white;
}

.claims-breakdown {
  font-size: 11px;
  color: #666;
}

.actions {
  display: flex;
  gap: 8px;
}

.icon-button {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: none;
  background: #f5f5f5;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.icon-button:hover {
  background: #e0e0e0;
}

.icon-button.delete:hover {
  background: #ffebee;
  color: #f44336;
}

.loading-state, .empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: #666;
  text-align: center;
}

/* Стили для модального окна и формы */
.product-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
}

.form-group.checkbox {
  flex-direction: row;
  align-items: center;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.gradient-preview {
  height: 30px;
  border-radius: 4px;
  margin-top: 8px;
}

/* Стили для заявок */
.claims-filter {
  margin-bottom: 16px;
}

.claims-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 70vh;
  overflow-y: auto;
}

.claim-card {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
}

.claim-header {
  background: #f5f5f5;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #eee;
}

.user-name {
  font-weight: 500;
}

.user-username {
  font-size: 12px;
  color: #666;
}

.claim-date {
  font-size: 12px;
  color: #666;
}

.claim-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.claim-status, .claim-note {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.claim-status label, .claim-note label {
  font-weight: 500;
  font-size: 14px;
}

.claim-actions {
  padding: 12px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #eee;
}

/* Стили для статусов заявок */
.status-pending {
  background-color: #fff9c4;
}

.status-processing {
  background-color: #e3f2fd;
}

.status-completed {
  background-color: #e8f5e9;
}

.status-cancelled {
  background-color: #ffebee;
}
</style>