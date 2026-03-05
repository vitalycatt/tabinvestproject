<!-- src/pages/Growth.vue -->
<template>
  <div class="growth-page">
    <Header />

    <div class="main__container">
      <Balance />

      <div class="investments-container">
        <!-- Табы категорий -->
        <div class="investment-tabs">
          <button
            v-for="category in categories"
            :key="category.id"
            :class="{ active: currentCategory === category.id }"
            class="tab"
            @click="currentCategory = category.id"
          >
            {{ category.title }}
          </button>
        </div>

        <!-- Индикатор загрузки -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Загрузка инвестиций...</p>
        </div>

        <!-- Ошибка загрузки -->
        <div v-else-if="error" class="error-container">
          <p>{{ error }}</p>
          <button
            class="retry-button"
            @click="loadInvestments(currentCategory)"
          >
            Повторить загрузку
          </button>
        </div>

        <!-- Сетка инвестиций -->
        <div v-else class="investment-grid">
          <div
            v-for="investment in currentInvestments"
            :key="investment._id || investment.id"
            :class="{ disabled: !canBuyInvestment(investment) }"
            class="investment-card"
            @click="handleInvestment(investment)"
          >
            <div class="card-image">
              <img
                :alt="investment.name"
                :src="getInvestmentImageUrl(investment)"
              />
            </div>
            <div class="card-info">
              <h3>{{ investment.name }}</h3>

              <div class="income-info">
                <div>Пассивный доход в месяц</div>
                <div class="income-amount">
                  <img
                    alt="coin"
                    class="passive__income_cart"
                    src="../assets/images/coin.png"
                  />
                  <span>+{{ investment.nextIncome.toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <div class="level">lvl {{ investment.userLevel + 1 }}</div>
              <div class="price">
                <img
                  alt="coin"
                  class="price_cart"
                  src="../assets/images/coin.png"
                />
                <span>{{ investment.nextCost }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Navigation />
  </div>
</template>

<script setup>
import { inject, onMounted, ref, watch } from "vue";
import { useGameStore } from "@/stores/gameStore";
import { ApiService } from "@/services/apiService";
import Header from "@/components/layout/Header.vue";
import Balance from "@/components/game/Balance.vue";
import Navigation from "@/components/layout/Navigation.vue";

const store = useGameStore();
const logger = inject("logger", {
  log: (...args) => console.log("[Growth]", ...args),
  error: (...args) => console.error("[Growth Error]", ...args),
});

const currentCategory = ref("finances");
const currentInvestments = ref([]);
const purchasedInvestments = ref({}); // Локальное отслеживание купленных инвестиций
const investmentCosts = ref({}); // Локальное отслеживание стоимости инвестиций
const loading = ref(false);
const error = ref(null);

// Категории инвестиций
const categories = [
  { id: "finances", title: "Финансы" },
  { id: "technology", title: "Технологии" },
  { id: "business", title: "Бизнес" },
  { id: "realestate", title: "Недвижимость" },
];

// Загрузка инвестиций с сервера по категории
const loadInvestments = async (category) => {
  const userId = store.currentUserId;
  if (!userId) {
    logger.error("loadInvestments: userId не определён, пропускаем загрузку");
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    logger.log("Загрузка инвестиций для категории:", category);

    const response = await ApiService.getInvestmentsByCategory(
      userId,
      category
    );

    if (response?.success && Array.isArray(response.data)) {
      currentInvestments.value = response.data;
      logger.log(
        "Инвестиции успешно загружены:",
        currentInvestments.value.length
      );
    } else if (response && Array.isArray(response.data)) {
      // Ответ без success или success: false, но data есть — используем data
      currentInvestments.value = response.data;
      logger.log(
        "Инвестиции загружены (ответ без success):",
        currentInvestments.value.length
      );
    } else {
      logger.error("Неверный формат ответа API:", response);
      throw new Error("Некорректный формат данных от сервера");
    }
  } catch (err) {
    logger.error("Ошибка загрузки инвестиций:", err);
    error.value =
      "Не удалось загрузить инвестиции: " +
      (err.message || "Неизвестная ошибка");
    currentInvestments.value = [];
  } finally {
    loading.value = false;
  }
};

// Получение URL изображения инвестиции
const getInvestmentImageUrl = (investment) => {
  if (!investment.image) {
    // Возвращаем заглушку, если изображение не указано
    return "@/assets/images/investments/default.png";
  }

  // Если URL начинается с http, возвращаем как есть
  if (investment.image.startsWith("http")) {
    return investment.image;
  }

  // Если это относительный путь с uploads
  if (investment.image.startsWith("/uploads/")) {
    return ApiService.API_URL + investment.image;
  }

  // Иначе обрабатываем как локальное изображение из assets
  return investment.image;
};

// Функция для поиска базовой инвестиции по категории и id
const findPurchasedInvestment = (category, id) => {
  if (!store.investments || !Array.isArray(store.investments.purchased)) {
    return null;
  }

  return store.investments.purchased.find(
    (item) => item.type === category && (item.id === id || item._id === id)
  );
};

// Получение текущего уровня инвестиции
const getInvestmentLevel = (investment) => {
  const key = `${investment.category || currentCategory.value}_${
    investment._id || investment.id
  }`;

  // Проверяем в локальном кэше
  if (purchasedInvestments.value[key]) {
    return purchasedInvestments.value[key];
  }

  // Ищем в купленных инвестициях
  const purchased = findPurchasedInvestment(
    investment.category || currentCategory.value,
    investment._id || investment.id
  );

  if (purchased) {
    // Запоминаем в локальном кэше
    purchasedInvestments.value[key] = purchased.level;
    return purchased.level;
  }

  // Иначе возвращаем начальный уровень
  return investment.level || 1;
};

// Получение текущей стоимости инвестиции
const getInvestmentCost = (investment) => {
  const key = `${investment.category || currentCategory.value}_${
    investment._id || investment.id
  }`;

  // Если инвестиция уже куплена и есть в кэше стоимостей
  if (purchasedInvestments.value[key] && investmentCosts.value[key]) {
    return investmentCosts.value[key];
  }

  // Ищем в купленных инвестициях
  const purchased = findPurchasedInvestment(
    investment.category || currentCategory.value,
    investment._id || investment.id
  );

  if (purchased && purchased.cost) {
    // Запоминаем в локальном кэше
    investmentCosts.value[key] = purchased.cost;
    return purchased.cost;
  }

  // Иначе рассчитываем стоимость для текущего уровня
  const currentLevel = getInvestmentLevel(investment);
  if (currentLevel > (investment.level || 1)) {
    return calculateCostForLevel(investment, currentLevel);
  }

  // Или возвращаем базовую стоимость
  return investment.cost;
};

// Расчет стоимости для определенного уровня
const calculateCostForLevel = (investment, level) => {
  // Базовая стоимость
  const baseCost = investment.cost || 0;
  // Коэффициент роста цены
  const costMultiplier = investment.multiplier || 1.5;

  // Рассчитываем стоимость: базовая стоимость * (множитель ^ (уровень - базовый уровень))
  const baseLevel = investment.level || 1;
  const levelDifference = level - baseLevel;

  if (levelDifference <= 0) {
    return baseCost;
  }

  return Math.round(baseCost * Math.pow(costMultiplier, levelDifference));
};

// Проверка возможности покупки
const canBuyInvestment = (investment) => {
  const cost = getInvestmentCost(investment);
  return store.balance >= cost;
};

// Обработка покупки инвестиции
const handleInvestment = async (investment) => {
  logger.log("handleInvestment called for:", investment.name);

  try {
    const currentCost = getInvestmentCost(investment);
    logger.log("Current cost:", currentCost, "Current balance:", store.balance);

    if (!canBuyInvestment(investment)) {
      logger.log("Not enough balance to buy investment");
      return;
    }

    // const investmentCopy = {...investment}
    // const category = investment.category || currentCategory.value
    // const key = `${category}_${investment._id || investment.id}`
    //
    // const currentLevel = getInvestmentLevel(investment)
    // logger.log('Current level:', currentLevel)
    //
    // const newLevel = currentLevel + 1
    // investmentCopy.level = newLevel
    // logger.log('New level:', newLevel)
    //
    // const income = calculateIncome(investmentCopy)
    // logger.log('Calculated income for this level:', income)
    //
    // const newCost = calculateCostForLevel(investment, newLevel + 1)
    // logger.log('New cost for next level:', newCost)
    //
    // investmentCopy.cost = currentCost
    // investmentCopy.type = category

    logger.log("Before purchase, passiveIncome =", store.passiveIncome || 0);
    // Передаем только доход за текущую покупку
    const data = await store.buyInvestment(store.currentUserId, investment._id);

    console.log(data);

    // После покупки хотим показывать доход следующего уровня (next level),
    // поэтому используем nextIncome из ответа, а при его отсутствии — income как fallback.
    const nextIncomeForCard = data.nextIncome ?? data.income;

    currentInvestments.value = currentInvestments.value.map((invest) =>
      invest._id === investment._id
        ? {
            ...invest,
            nextIncome: nextIncomeForCard,
            userLevel: data.newLevel,
            nextCost: data.nextCost,
          }
        : invest
    );
  } catch (error) {
    logger.error("Error in handleInvestment:", error);
  }
};

// Форматирование чисел
const formatMoney = (num) => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(2) + "B";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

onMounted(async () => {
  logger.log("Growth component mounted");
  logger.log("Current store investments:", store.investments);

  if (typeof store.purchaseInvestment !== "function") {
    logger.error("purchaseInvestment is not a function in store!");
  }

  if (store.investments && store.investments.purchased) {
    logger.log(
      "Loading purchased investments:",
      store.investments.purchased.length
    );

    store.investments.purchased.forEach((investment) => {
      const key = `${investment.type}_${investment._id || investment.id}`;
      purchasedInvestments.value[key] = investment.level;

      if (investment.cost) {
        investmentCosts.value[key] = investment.cost;
      }
    });
  }

  // Ждём завершения синхронизации, если userId ещё не доступен
  if (!store.currentUserId) {
    await new Promise((resolve) => {
      const unwatch = watch(
        () => store.currentUserId,
        (id) => {
          if (id) {
            unwatch();
            resolve();
          }
        },
        { immediate: true }
      );
      setTimeout(() => {
        unwatch();
        resolve();
      }, 10000);
    });
  }

  // Загружаем инвестиции текущей категории
  await loadInvestments(currentCategory.value);

  // ===== Серверное начисление пассивного дохода =====
  async function addPassiveIncomeServer() {
    if (!store.passiveIncome || store.passiveIncome <= 0) return;

    try {
      const res = await ApiService.addPassiveIncome(
        store.currentUserId,
        store.passiveIncome
      );

      if (res.success) {
        const serverBalance = Number(res.balance ?? store.balance + (res.added || 0));
        const added = Number(res.added || 0);
        // Не перезаписываем баланс меньшим значением: только если сервер вернул не меньше текущего или явно начислил и новый баланс правдоподобен
        const isReasonable = serverBalance >= store.balance || (added > 0 && serverBalance >= store.balance + added * 0.5);
        if (isReasonable) {
          store.balance = serverBalance;
        }
        logger.log(
          "Пассивный доход начислен серверно:",
          added,
          "→ новый баланс:",
          store.balance
        );
        // Пассивный доход (месячная ставка) не обнуляем — он начисляется по времени, а не «разово»
      }
    } catch (err) {
      logger.error("Ошибка при начислении пассивного дохода серверно:", err);
    }
  }

  // Догоняем пропущенный доход сразу
  await addPassiveIncomeServer();

  // Обновляем баланс каждые 60 секунд
  setInterval(addPassiveIncomeServer, 60000);
});

// Добавляем watch после onMounted
watch(currentCategory, (newCategory) => {
  logger.log("Категория изменена:", newCategory);
  loadInvestments(newCategory);
});
</script>

<style scoped>
.growth-page {
  min-height: 100vh;
  padding: 100px 0 80px 0;
  background: url("@/assets/images/bg-2.jpg") center top no-repeat;
}

.investments-container {
  margin-top: 20px;
  height: 100vh;
  overflow: scroll;
}

.investment-tabs {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 16px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.tab {
  padding: 8px 4px;
  border: none;
  border-radius: 8px;
  background: none;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab.active {
  background: var(--primary-color);
}

.investment-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  max-height: 50vh;
  overflow-y: scroll;
  overflow-x: hidden;
  padding-bottom: 100px;
}

.investment-card {
  display: flex;
  flex-wrap: wrap;
  background: #422263f7;
  border-radius: 12px;
  padding: 10px 0 5px 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.investment-card:not(.disabled):hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

.investment-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.card-image img {
  width: 59px;
  height: 57px;
  margin-right: 10px;
  object-fit: cover;
}

.card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
}

.card-info h3 {
  color: white;
  font-size: 9px;
  margin: 0 0 4px 0;
}

.income-info div {
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
  font-size: 7px;
  line-height: 8.8px;
}

.income-info span {
  font-size: 12px;
}

.income-amount {
  display: flex;
  align-items: center;
  margin-top: 3px;
  gap: 4px;
  font-size: 14px;
}

.income-amount span {
  color: white;
}

.card-footer {
  width: 100%;
  height: 24px;
  margin-top: 5px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  box-sizing: border-box;
  position: relative;
}

.card-footer::after {
  content: "";
  position: absolute;
  left: -10px;
  top: 0;
  height: 1px;
  width: 107%;
  background: rgba(255, 255, 255, 0.1);
}

.level {
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-content: center;
  align-items: center;
  padding-right: 10px;
  margin-right: 10px;
  height: 100%;
  font-size: 12px;
  border-right: solid 1px rgba(255, 255, 255, 0.1);
}

.price {
  display: flex;
  align-items: center;
  gap: 4px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  line-height: 15.4px;
}

.passive__income_cart {
  width: 12px;
  height: 12px;
}

.price_cart {
  width: 17px;
  height: 17px;
}

.main__container {
  padding: 0 1rem;
  border-top: 4px solid var(--primary-color);
  border-radius: 40px 40px 0 0;
  background: url("../../images/bg.jpg");
  margin-top: 20px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: var(--primary-color, #8c60e3);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-container {
  padding: 20px;
  text-align: center;
  color: white;
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
  border-radius: 10px;
  margin: 20px 0;
}

.retry-button {
  background: var(--primary-color, #8c60e3);
  color: white;
  border: none;
  border-radius: 5px;
  padding: 8px 16px;
  margin-top: 10px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.retry-button:hover {
  background: #7550c8;
}
</style>
