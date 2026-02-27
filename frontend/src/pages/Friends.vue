<!-- src/pages/Friends.vue -->
<template>
  <div class="friends-page">
    <Header />
    <Balance />

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Загрузка данных...</p>
    </div>

    <div v-else class="friends-container">
      <h2 class="friends-title">Пригласите друзей!</h2>
      <p class="friends-subtitle">Вы и ваш друг получите бонусы</p>

      <!-- Награды за приглашения -->
      <div class="rewards-list">
        <div
          v-for="reward in rewards"
          :key="reward.count"
          class="reward-item"
          :class="{
            'reward-completed': reward.completed,
            'reward-available': reward.available,
          }"
          @click="handleRewardClaim(reward)"
        >
          <div class="reward-image">
            <img
              :src="reward.image"
              :alt="'Пригласи ' + reward.count + ' друзей'"
            />
          </div>
          <div class="reward-info">
            <div class="reward-text">Пригласи {{ reward.count }} друзей</div>
            <div class="reward-amount">
              <img
                src="@/assets/images/coin.png"
                alt="coin"
                class="coin-icon"
              />
              <span>+{{ reward.amount }}K</span>
            </div>
          </div>
          <div class="reward-progress" v-if="!reward.completed">
            {{ Math.min(friends.length, reward.count) }}/{{ reward.count }}
          </div>
          <div class="reward-completed-icon" v-else>✓</div>
        </div>
      </div>

      <!-- Список друзей -->
      <div class="friends-section">
        <div class="friends-header">
          <h3>Список ваших друзей ({{ friends.length }})</h3>
          <button
            class="refresh-button"
            @click="loadReferrals"
            :disabled="loading"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              :class="{ rotating: refreshing }"
            >
              <path
                d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>

        <div class="friends-list">
          <div v-if="friends.length === 0" class="no-friends">
            <p>У вас пока нет рефералов</p>
            <p class="no-friends-hint">Пригласите друзей и получите награды!</p>
          </div>
          <div v-else>
            <div
              v-for="friend in friends"
              :key="friend._id || friend.id"
              class="friend-item"
            >
              <div class="friend-avatar">
                <svg
                  v-if="!friend.userData?.photo_url"
                  viewBox="0 0 32 33"
                  fill="none"
                >
                  <rect width="32" height="33" rx="8" fill="#423361" />
                  <path
                    d="M16.5 16.5C15.3312 16.5 14.3307 16.0839 13.4984 15.2516C12.6661 14.4193 12.25 13.4187 12.25 12.25C12.25 11.0812 12.6661 10.0807 13.4984 9.24844C14.3307 8.41615 15.3312 8 16.5 8C17.6687 8 18.6693 8.41615 19.5016 9.24844C20.3339 10.0807 20.75 11.0812 20.75 12.25C20.75 13.4187 20.3339 14.4193 19.5016 15.2516C18.6693 16.0839 17.6687 16.5 16.5 16.5Z"
                    fill="#8776AA"
                  />
                </svg>
                <img
                  v-else
                  :src="friend.userData.photo_url"
                  :alt="friend.userData.first_name"
                  class="avatar-image"
                />
              </div>
              <div class="friend-info">
                <div class="friend-name">
                  {{
                    friend.userData?.first_name ||
                    "Пользователь #" + (index + 1)
                  }}
                </div>
                <div class="friend-joined-date">
                  {{ formatDate(friend.joinedAt) }}
                </div>
              </div>
              <div class="friend-reward" v-if="!friend.rewardClaimed">
                <img
                  src="@/assets/images/coin.png"
                  alt="coin"
                  class="coin-icon"
                />
                <span>+175K</span>
              </div>
              <div class="friend-claimed" v-else>Награда получена</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Статус API-запроса (для отладки) -->
      <div v-if="apiError" class="api-error">
        <p>Произошла ошибка при загрузке данных:</p>
        <p>{{ apiError }}</p>
        <button @click="loadReferrals">Попробовать снова</button>
      </div>

      <!-- Кнопка приглашения -->
      <button class="invite-button" @click="inviteFriend">
        Пригласить друга
      </button>
    </div>

    <Navigation />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, inject } from "vue";
import { useGameStore } from "@/stores/gameStore";
import { useTelegram } from "@/composables/useTelegram";
import { useApi } from "@/composables/useApi";
import Header from "@/components/layout/Header.vue";
import Balance from "@/components/game/Balance.vue";
import Navigation from "@/components/layout/Navigation.vue";

const store = useGameStore();
const { tg, user } = useTelegram();
const api = useApi();
const logger = inject("logger", console);

// Состояние загрузки
const loading = ref(true);
const refreshing = ref(false);
const apiError = ref(null);

// Награды за приглашения
const rewards = ref([
  {
    count: 3,
    amount: 175,
    image: "/images/friends/1.png",
    completed: false,
    available: false,
  },
  {
    count: 7,
    amount: 175,
    image: "/images/friends/2.png",
    completed: false,
    available: false,
  },
  {
    count: 10,
    amount: 175,
    image: "/images/friends/3.png",
    completed: false,
    available: false,
  },
  {
    count: 25,
    amount: 175,
    image: "/images/friends/4.png",
    completed: false,
    available: false,
  },
]);

// Список друзей-рефералов
const friends = ref([]);

// Загрузка рефералов
const loadReferrals = async () => {
  if (!user.value?.id) {
    logger.log("Невозможно загрузить рефералов: пользователь не определен");
    apiError.value = "Ошибка: пользователь не авторизован";
    loading.value = false;
    return;
  }

  refreshing.value = true;
  loading.value = true;
  apiError.value = null;

  try {
    logger.log("Загрузка рефералов для пользователя:", user.value.id);

    // Прямой запрос к API для большей прозрачности отладки
    const API_BASE = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_BASE || "https://tabinvestproject.ru");
    const response = await fetch(
      `${API_BASE}/api/referrals?userId=${user.value.id}`
    );

    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    logger.log("Ответ API рефералов:", data);

    if (data.success && Array.isArray(data.data)) {
      friends.value = data.data;
      logger.log("Обновлен список друзей:", friends.value);
    } else {
      logger.error("Неверный формат данных в ответе API:", data);
      apiError.value = "Неверный формат данных в ответе API";

      // Пытаемся обработать другие возможные форматы ответа
      if (Array.isArray(data)) {
        friends.value = data;
        apiError.value = null;
      }
    }

    checkRewardsProgress();
  } catch (error) {
    logger.error("Ошибка загрузки рефералов:", error);
    apiError.value = error.message || "Ошибка при загрузке рефералов";
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

// Возвращает правильное склонение слова "реферал"
const getRefCountText = (count) => {
  if (count % 10 === 1 && count % 100 !== 11) {
    return "реферал";
  } else if (
    [2, 3, 4].includes(count % 10) &&
    ![12, 13, 14].includes(count % 100)
  ) {
    return "реферала";
  } else {
    return "рефералов";
  }
};

// Форматирование даты
const formatDate = (dateString) => {
  if (!dateString) return "Неизвестная дата";

  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Форматирование чисел
const formatMoney = (num) => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + "B";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

// Проверка доступности наград
const checkRewardsProgress = () => {
  rewards.value.forEach((reward) => {
    // Считаем всех рефералов для определения прогресса
    const totalReferrals = friends.value.length;

    // Считаем незавершенных рефералов для определения доступности награды
    const unclaimedReferrals = friends.value.filter(
      (f) => !f.rewardClaimed
    ).length;

    // Обновляем состояние награды
    reward.available = unclaimedReferrals >= reward.count && !reward.completed;
    reward.completed =
      reward.completed ||
      (totalReferrals >= reward.count && unclaimedReferrals < reward.count);
  });
};

// Обработка получения награды
const handleRewardClaim = async (reward) => {
  if (reward.completed) {
    return;
  }

  if (!reward.available) {
    const unclaimedCount = friends.value.filter((f) => !f.rewardClaimed).length;
    const remainingNeeded = reward.count - unclaimedCount;
    return;
  }

  try {
    // Получаем необходимое количество невознагражденных рефералов
    const unclaimedReferrals = friends.value
      .filter((f) => !f.rewardClaimed)
      .slice(0, reward.count);

    logger.log("Получение награды для рефералов:", unclaimedReferrals);

    // Отмечаем рефералов как вознагражденных
    for (const referral of unclaimedReferrals) {
      const referralId = referral._id || referral.id;
      await api.updateReferral(referralId, { rewardClaimed: true });
      logger.log("Отмечен реферал как вознагражденный:", referralId);
    }

    // Начисляем награду
    store.balance += reward.amount * 1000;
    reward.completed = true;
    reward.available = false;

    // Обновляем список рефералов
    await loadReferrals();
  } catch (error) {
    logger.error("Ошибка получения награды:", error);
  }
};

// Приглашение друга
const inviteFriend = () => {
  if (!user.value) {
    logger.log("Нет доступного пользователя для приглашения");
    return;
  }

  const startCommand = `ref_${user.value.id}`;
  const botUsername = "Capital_passive_bot"; // Замените на имя вашего бота
  const referralLink = `https://t.me/${botUsername}?start=${startCommand}`;

  const message = `Привет! У меня есть кое-что крутое для тебя - первая игра генерирующая пассивный доход\n\nПрисоединяйся, будем генерить доход вместе: ${referralLink}`;

  if (tg.value) {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
      referralLink
    )}&text=${encodeURIComponent(message)}`;
    window.open(shareUrl, "_blank");
  } else {
    navigator.clipboard.writeText(message);
  }
};

// Загрузка данных при монтировании
onMounted(() => {
  logger.log("Friends.vue компонент загружен");
  if (user.value) {
    logger.log("Пользователь доступен при монтировании:", user.value.id);
    loadReferrals();
  } else {
    logger.log("Пользователь не доступен при монтировании");
  }
});

// Следим за изменением пользователя
watch(
  () => user.value,
  (newUser) => {
    if (newUser) {
      logger.log("Пользователь изменен:", newUser.id);
      loadReferrals();
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.friends-page {
  min-height: 100vh;
  padding: 100px 0 80px 0;
  background: url("@/assets/images/bg.jpg") center top no-repeat;
}

.friends-container {
  margin-top: 20px;
  overflow: scroll;
  height: 70vh;
  padding-bottom: 180px;
}

.friends-title {
  font-size: 24px;
  font-weight: 700;
  color: white;
  text-align: center;
  margin-bottom: 8px;
}

.friends-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  margin-bottom: 24px;
}

.rewards-list {
  display: flex;
  flex-direction: column;
  padding: 0 1rem;
  gap: 12px;
  margin-bottom: 24px;
}

.reward-item {
  background: #2a163b;
  border: 1px solid rgba(140, 96, 227, 0.3);
  border-radius: 16px;
  padding: 12px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.reward-item:hover:not(.reward-completed) {
  background: rgba(140, 96, 227, 0.1);
}

.reward-image {
  width: 64px;
  height: 64px;
  margin-right: 12px;
}

.reward-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.reward-info {
  flex: 1;
}

.reward-text {
  font-size: 16px;
  font-weight: 500;
  color: white;
  margin-bottom: 4px;
}

.reward-amount {
  display: flex;
  align-items: center;
  gap: 4px;
  color: white;
}

.coin-icon {
  width: 16px;
  height: 16px;
}

.reward-progress {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin-right: 8px;
}

.reward-completed-icon {
  width: 24px;
  height: 24px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
}

.friends-section {
  background: none;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 24px;
}

.friends-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.friends-header h3 {
  font-size: 14px;
  color: white;
}

.refresh-button {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 4px;
}

.refresh-button:hover:not(:disabled) {
  color: white;
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.no-friends {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  padding: 20px;
}

.no-friends-hint {
  font-size: 12px;
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.5);
}

.friends-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.friend-item {
  display: flex;
  align-items: center;
  padding: 8px;
  background: none;
  border: 1px solid rgba(140, 96, 227, 0.3);
  border-radius: 12px;
}

.friend-avatar {
  width: 40px;
  height: 40px;
  margin-right: 12px;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.friend-info {
  flex: 1;
}

.friend-name {
  font-size: 14px;
  font-weight: 500;
  color: white;
  margin-bottom: 4px;
}

.friend-joined-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.friend-reward {
  display: flex;
  align-items: center;
  gap: 4px;
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.friend-claimed {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.invite-button {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translate(-50%, 0);
  width: 80%;
  z-index: 9999;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.invite-button:hover {
  opacity: 0.9;
}

.invite-button:active {
  transform: translate(-50%, 1px);
}

.reward-completed {
  opacity: 0.5;
  cursor: not-allowed;
}

.reward-available {
  animation: pulse 2s infinite;
  border-color: var(--primary-color);
}

/* Анимации */
@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(140, 96, 227, 0.4);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 0 0 10px rgba(140, 96, 227, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(140, 96, 227, 0);
  }
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Стили для скроллбара */
.friends-container::-webkit-scrollbar {
  width: 6px;
}

.friends-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.friends-container::-webkit-scrollbar-thumb {
  background: var(--primary-color);
  border-radius: 3px;
}

/* Состояния загрузки */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  color: white;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Секция ошибки API */
.api-error {
  margin: 20px;
  padding: 15px;
  background: rgba(229, 62, 62, 0.2);
  border: 1px solid rgba(229, 62, 62, 0.5);
  border-radius: 10px;
  color: white;
  text-align: center;
}

.api-error button {
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 8px 16px;
  margin-top: 10px;
  cursor: pointer;
}

/* Адаптивность для маленьких экранов */
@media (max-width: 360px) {
  .friends-title {
    font-size: 20px;
  }

  .friends-subtitle {
    font-size: 12px;
  }

  .reward-item {
    padding: 8px;
  }

  .reward-image {
    width: 48px;
    height: 48px;
  }

  .reward-text {
    font-size: 14px;
  }

  .invite-button {
    width: 90%;
    font-size: 14px;
    padding: 12px;
  }
}

/* Дополнительные стили для состояний и анимаций */
.friend-item:hover {
  border-color: rgba(140, 96, 227, 0.5);
  background: rgba(140, 96, 227, 0.1);
}

.friend-reward {
  animation: glow 1.5s ease-in-out infinite alternate;
}

@keyframes glow {
  from {
    text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px var(--primary-color);
  }
  to {
    text-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px var(--primary-color);
  }
}
</style>
