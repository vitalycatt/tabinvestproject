// src/admin/main.js
import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import { createPinia } from "pinia";
import AdminLayout from "../layouts/AdminLayout.vue";
import Admin from "../pages/Admin.vue";
import AdminLogin from "../pages/AdminLogin.vue";

const router = createRouter({
  history: createWebHistory("/admin"),
  routes: [
    {
      path: "/",
      component: AdminLayout,
      children: [
        { path: "", component: Admin },
        { path: "login", component: AdminLogin },
      ],
    },
  ],
});

// Проверка авторизации
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem("token");

  if (to.path === "/admin/login") return next();

  if (!token) return next("/admin/login");

  const { success } = await ApiService.checkAuth(token);

  if (!success) {
    return next("/admin/login"); // ❗ только 1 раз
  } else {
    next();
  }
});

const app = createApp(AdminLayout);
const pinia = createPinia();

app.use(router);
app.use(pinia);

app.mount("#app");
