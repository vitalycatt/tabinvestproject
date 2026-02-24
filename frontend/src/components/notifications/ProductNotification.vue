<!-- src/components/notifications/ProductNotification.vue -->
<template>
  <div
    v-if="showNotification"
    class="product-notification"
    @click="handleClick"
  >
    <div
      class="notification-content"
      :style="{
        background:
          activeProduct?.gradient ||
          'linear-gradient(140.83deg, rgb(140, 96, 227) 0%, rgb(73, 51, 131) 100%)',
      }"
    >
      <img
        :src="getProductImage(activeProduct)"
        alt="Новый продукт"
        class="notification-image"
      />
      <div class="notification-text">
        <div class="notification-title">Новый доступный продукт</div>
        <div class="notification-product">{{ activeProduct?.name }}</div>
      </div>
      <div class="notification-button">
        <span>Активировать</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, inject, onMounted } from "vue";
import { useGameStore } from "@/stores/gameStore";
import { useRouter } from "vue-router";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "https://tabinvestproject.ru";
const API_URL = `${API_BASE}/api`;
const BASE_URL = API_BASE;
const disableNotifications = true; // ← временно отключает уведомления

const store = useGameStore();
const router = useRouter();
const notifications = inject("notifications");

// Состояние уведомления
const showNotification = ref(false);
const activeProduct = ref(null);
const allProducts = ref([]);
const userClaims = ref([]);

// Получаем все продукты при загрузке компонента
onMounted(async () => {
  await fetchProducts();

  // Проверяем доступные продукты при загрузке
  checkAvailableProducts();
});

// Отслеживаем изменение пассивного дохода
watch(
  () => store.passiveIncome,
  (newValue, oldValue) => {
    // Если доход увеличился, проверяем доступные продукты
    if (newValue > oldValue) {
      checkAvailableProducts();
    }
  }
);

// Загрузка продуктов
const fetchProducts = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/products`);

    if (response.data.success) {
      allProducts.value = response.data.data
        .filter((product) => product.active)
        .map((product) => ({
          ...product,
          image: getFullImageUrl(product.image),
        }));

      // Загружаем заявки пользователя, если возможно
      if (store.user?.id) {
        await fetchUserClaims(store.user.id);
      }
    }
  } catch (error) {
    console.error("Ошибка загрузки продуктов:", error);
  }
};

// Загрузка заявок пользователя
const fetchUserClaims = async (userId) => {
  try {
    const response = await axios.get(
      `${API_URL}/products/claims/user/${userId}`
    );

    if (response.data.success) {
      userClaims.value = response.data.data;
    }
  } catch (error) {
    console.error("Ошибка загрузки заявок пользователя:", error);
  }
};

// Проверка доступных продуктов
const checkAvailableProducts = () => {
  if (disableNotifications) return; // <-- просто выход

  if (!allProducts.value.length) return;

  const newlyAvailableProduct = allProducts.value.find((product) => {
    const isAvailable = store.passiveIncome >= product.requiredIncome;
    const isAlreadyClaimed = userClaims.value.some(
      (claim) => claim.productId === product._id
    );
    return isAvailable && !isAlreadyClaimed;
  });

  if (newlyAvailableProduct) {
    activeProduct.value = newlyAvailableProduct;
    showNotification.value = true;

    setTimeout(() => {
      showNotification.value = false;
    }, 5000);
  }
};

// Обработка клика по уведомлению
const handleClick = () => {
  // Если мы на странице продуктов, просто скрываем уведомление
  if (router.currentRoute.value.path === "/products") {
    showNotification.value = false;
    return;
  }

  // Иначе переходим на страницу продуктов
  router.push("/products");

  // После перехода скрываем уведомление
  showNotification.value = false;

  // Показываем информационное сообщение
  notifications.addNotification({
    message: "Теперь вы можете активировать новый продукт!",
    type: "info",
  });
};

// Получение полного пути к изображению
const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) return "/images/products/default.png";

  // Если URL уже полный, возвращаем как есть
  if (imageUrl.startsWith("http")) return imageUrl;

  // Если URL начинается с /, это локальный URL
  if (imageUrl.startsWith("/")) {
    return `${BASE_URL}${imageUrl}`;
  }

  // Добавляем / если его нет
  return `${BASE_URL}/${imageUrl}`;
};

// Получение изображения для продукта (с проверкой на null)
const getProductImage = (product) => {
  if (!product) return "/images/products/default.png";
  return product.image || "/images/products/default.png";
};
</script>

<style scoped>
.product-notification {
  position: fixed;
  bottom: 80px;
  left: 0;
  right: 0;
  z-index: 900;
  padding: 0 16px;
  cursor: pointer;
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.notification-content {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.notification-image {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  margin-right: 12px;
}

.notification-text {
  flex: 1;
  color: white;
}

.notification-title {
  font-size: 12px;
  opacity: 0.8;
}

.notification-product {
  font-size: 16px;
  font-weight: 600;
}

.notification-button {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 8px 16px;
  color: white;
  font-size: 14px;
  font-weight: 500;
}
</style>
