// src/main.js
import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import { createPinia } from "pinia";
import App from "./App.vue";

// Импортируем компоненты для маршрутизации
import Home from "./pages/Home.vue";
import Boost from "./pages/Boost.vue";
import Growth from "./pages/Growth.vue";
import AdminLayout from "./layouts/AdminLayout.vue";
import Admin from "./pages/Admin.vue";
import AdminLogin from "./pages/AdminLogin.vue";
import Friends from "./pages/Friends.vue";
import Loading from "./pages/LoadingPage.vue";
import Onboarding from "./pages/OnboardingPage.vue";
import ApiService from "./services/apiService";

// Функция для настройки Telegram WebApp в полноэкранном режиме
function setupTelegramWebApp() {
  if (window.Telegram && window.Telegram.WebApp) {
    try {
      // Активируем полноэкранный режим
      window.Telegram.WebApp.expand();

      // Устанавливаем цвет фона соответствующий вашему приложению
      window.Telegram.WebApp.setBackgroundColor("#08070D");

      // Включаем подтверждение закрытия для предотвращения случайного выхода из игры
      window.Telegram.WebApp.enableClosingConfirmation();

      console.log("Telegram WebApp настроен в полноэкранном режиме");
    } catch (error) {
      console.error("Ошибка при настройке Telegram WebApp:", error);
    }
  } else {
    console.log("Telegram WebApp API не обнаружен");
  }
}

// Создаем маршруты
const routes = [
  {
    path: "/",
    component: Home,
    meta: { requiresOnboarding: true },
  },
  {
    path: "/loading",
    component: Loading,
  },
  {
    path: "/onboarding",
    component: Onboarding,
  },
  { path: "/boost", component: Boost, meta: { requiresOnboarding: true } },
  { path: "/growth", component: Growth, meta: { requiresOnboarding: true } },
  { path: "/friends", component: Friends, meta: { requiresOnboarding: true } },
  {
    path: "/tasks",
    component: () => import("@/pages/Tasks.vue"),
    meta: { requiresOnboarding: true },
  },
  {
    path: "/products",
    component: () => import("@/pages/Products.vue"),
    meta: { requiresOnboarding: true },
  },
  {
    path: "/transfer",
    component: () => import("@/pages/Transfer.vue"),
    meta: { requiresOnboarding: true },
  },
  {
    path: "/admin",
    component: AdminLayout,
    children: [
      { path: "", component: Admin },
      { path: "login", component: AdminLogin },
    ],
    meta: { requiresAuth: true },
  },
];

// Создаем экземпляр маршрутизатора
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Добавляем защиту роутов
router.beforeEach(async (to, from, next) => {
  // Проверяем, не зациклилось ли приложение
  const MAX_REDIRECTS = 10;
  const redirectCount = localStorage.getItem("redirectCount")
    ? parseInt(localStorage.getItem("redirectCount"))
    : 0;

  if (redirectCount > MAX_REDIRECTS) {
    console.error(
      "Обнаружен бесконечный цикл перенаправлений. Сбрасываем счетчик и идем на главную.",
    );
    localStorage.removeItem("redirectCount");
    localStorage.setItem("onboardingCompleted", "true"); // Форсируем завершение онбординга
    return next("/");
  }

  // Для всех маршрутов, кроме /loading
  if (to.path !== "/loading") {
    localStorage.setItem("redirectCount", redirectCount + 1);
  }

  // Проверка, загружено ли приложение
  const isAppLoaded = localStorage.getItem("appLoaded") === "true";

  // Если приложение еще не загружено и пользователь не на странице загрузки, перенаправляем
  console.log("Telegram.WebApp:", window.Telegram?.WebApp);
  console.log("appLoaded flag:", isAppLoaded);

  console.log("document.readyState:", document.readyState);
  if (!isAppLoaded && to.path !== "/loading") {
    console.log("Приложение еще не загружено, перенаправляем на /loading");
    return next("/loading");
  }

  // Проверка требований авторизации админа
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    const token = localStorage.getItem("token");

    if (to.path === "/admin/login") return next();

    if (!token) return next("/admin/login");

    const { success } = await ApiService.checkAuth(token);

    if (!success) {
      return next("/admin/login"); // ❗ только 1 раз
    } else {
      next();
    }
  }

  // Проверка требований онбординга
  if (to.matched.some((record) => record.meta.requiresOnboarding)) {
    const onboardingCompleted =
      localStorage.getItem("onboardingCompleted") === "true";
    if (!onboardingCompleted && to.path !== "/onboarding") {
      console.log("Онбординг не завершен, перенаправляем на /onboarding");
      return next("/onboarding");
    }
  }

  // Сбрасываем счетчик перенаправлений при успешном переходе
  if (to.path !== "/loading") {
    localStorage.setItem("redirectCount", "0");
  }

  next();
});

const pinia = createPinia();
const app = createApp(App);

// Используем плагины
app.use(router);
app.use(pinia);

// Активируем Telegram WebApp при смене маршрута
router.afterEach(() => {
  // Немного задерживаем вызов, чтобы страница успела отрендериться
  setTimeout(setupTelegramWebApp, 100);
});

// Также вызываем функцию настройки при инициализации
document.addEventListener("DOMContentLoaded", setupTelegramWebApp);

// Добавляем еще попытку активации через 1 секунду после загрузки (для надежности)
setTimeout(setupTelegramWebApp, 1000);

// Монтируем приложение
app.mount("#app");
