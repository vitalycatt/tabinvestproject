# Контекст проекта Tabinvestproject

Краткая структура и ключевые точки входа — чтобы быстро ориентироваться в коде и подключать новых разработчиков или AI.

---

## Что это за проект

**Telegram Mini App** — игра-кликер с элементами инвестиций и пассивного дохода. Пользователь идентифицируется по `telegramId` из Telegram WebApp. Есть админ-панель (логин/пароль, JWT).

- **Backend:** Node.js, Express, MongoDB (Mongoose), Telegram Bot (webhook), WebSocket, cron для пассивного дохода.
- **Frontend:** Vue 3, Vue Router, Pinia, Vite. Запуск как WebApp внутри Telegram.

---

## Структура монорепо

```
tabinvestproject/
├── backend/          # API, бот, БД, cron
│   ├── Dockerfile    # образ для деплоя (порт 3000)
│   └── .dockerignore
├── frontend/         # Vue SPA (игровой клиент + админка)
├── docker-compose.yml  # деплой бэкенда (сервис app на порту 3000)
├── deploy.sh         # локальный скрипт деплоя
├── deploy-server.sh  # скрипт на сервере (git pull + docker compose)
├── .gitignore        # общий для всего репо
├── .gitattributes    # нормализация переносов строк
└── PROJECT_CONTEXT.md
```

---

## Backend

### Точка входа и конфиг

- **Запуск:** `backend/` → `npm run dev` (nodemon) или `npm start` (production через `render-start.js`).
- **Главный файл:** `backend/bot.js` — создаёт Express-приложение, подключает БД, маршруты, WebSocket, Telegram webhook, cron.
- **Конфиг:** `backend/config.js` — читает `backend/.env`. Обязательные переменные: `TELEGRAM_BOT_TOKEN`, `MONGODB_URI`, `WEBAPP_URL`. Остальное: `PORT` (на проде 3000), `API_URL`, `APP_URL`, `ADMIN_*`, `JWT_SECRET`, `UPLOAD_DIR` (production), `PASSIVE_INCOME_CRON`.

### Подключение БД

- `backend/lib/dbConnect.js` — подключение к MongoDB по `config.MONGODB_URI`.

### Маршруты API (все под префиксом в `bot.js`)

| Префикс                                      | Файл                           | Назначение                                                                            |
| -------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------- |
| `/api/admin`                                 | `routes/adminRoutes.js`        | Пользователи, топ-ап баланса, регенерация энергии, сброс прогресса, блокировка и т.д. |
| `/api/users`                                 | `routes/userRoutes.js`         | Получение/обновление пользователя по telegramId, gameData.                            |
| `/api/notifications`                         | `routes/notificationRoutes.js` | Уведомления.                                                                          |
| `/api/settings`                              | `routes/settingsRoutes.js`     | Игровые настройки (GameSettings).                                                     |
| `/api/referrals`                             | `routes/referralRoutes.js`     | Реферальная система.                                                                  |
| `/api/products`                              | `routes/productRoutes.js`      | Продукты, выдача продуктов пользователям.                                             |
| `/api/admin/investments`, `/api/investments` | `routes/investmentRoutes.js`   | Инвестиции (каталог, покупка).                                                        |
| `/api/tasks/user`                            | `routes/tasks/user.js`         | Задачи пользователя.                                                                  |
| `/api/tasks/complete`                        | `routes/tasks/complete.js`     | Завершение задачи.                                                                    |

Статика загрузок: `app.use('/uploads', express.static(uploadsPath))` (каталог из `config`).

### Модели (Mongoose)

- `models/User.js` — пользователь: `telegramId` (уникальный), профиль Telegram, `gameData` (balance, passiveIncome, energy, level, multipliers, investments, stats).
- `models/Referral.js`, `models/Product.js`, `models/ProductClaim.js`, `models/Investment.js`, `models/GameSettings.js`, `models/Notification.js`, `models/Task.js`, `models/UserTask.js`.

Идентификация пользователя в API — по `telegramId` (часто в URL как `:id`).

### Фоновые задачи

- `jobs/passiveIncomeJob.js` — cron начисляет пассивный доход. Запускается из `bot.js` (по env или только у лидера при pm2).

### Важные моменты

- Webhook Telegram: `POST /webhook/:token`.
- WebSocket: подключаются с `?userId=...`; `req.clients` — Map userId → ws.
- В `bot.js` включено детальное логирование каждого запроса/ответа (в dev может быть шумно).

---

## Frontend

### Точка входа и роутинг

- **Точка входа:** `frontend/src/main.js` — создаёт Vue-приложение, Pinia, Vue Router, настраивает Telegram WebApp (expand, фон, подтверждение закрытия).
- **Роуты:** объявлены в `main.js`:
  - `/` — Home (игровой экран).
  - `/loading` — загрузка перед инициализацией.
  - `/onboarding` — онбординг.
  - `/boost` — бусты.
  - `/growth` — инвестиции/рост.
  - `/friends` — друзья/рефералы.
  - `/tasks` — задачи.
  - `/products` — продукты.
  - `/admin` — админка (layout + дочерние: список, логин).

Защита: `meta.requiresAuth` — админ (JWT в localStorage); `meta.requiresOnboarding` — флаг `onboardingCompleted` в localStorage. Первый заход ведёт на `/loading`, затем при необходимости на `/onboarding`.

### Состояние приложения (Pinia)

- **gameStore** (`stores/gameStore.js`) — основное игровое состояние:
  - balance, passiveIncome, energy (current/max/regen), level, multipliers, boosts, investments, stats;
  - currentUser / gameData с сервера;
  - таймеры: пассивный доход, уровень, автосохранение, регенерация энергии.
  - Ключевые действия: `syncFromServer(userId)`, `tap(userId)`, `regenerateEnergy(userId)`, покупка бустов и инвестиций, работа с задачами.
- **adminStore** (`stores/adminStore.js`) — админ: логин, список пользователей, задачи, продукты, уведомления и т.д.

ID пользователя на фронте берётся из Telegram WebApp или из сохранённого состояния; на бек уходит как `telegramId`.

### Работа с API

- **apiService** (`services/apiService.js`) — единая точка запросов. Base URL из `import.meta.env.VITE_API_BASE` (в dev и на проде бэкенд на порту 3000).
  - Методы: getUser, tap, regenerateEnergy, updateUserBalance, задачи, продукты, инвестиции, уведомления, админ (login, getAllUsers, blockUser, resetUserProgress и т.д.).
- Дополнительно: `GameSettingsService`, `StorageService` (localStorage), `telegramService`, `referralService`, `userService`.

### Страницы и компоненты

- **Страницы:** `pages/Home.vue` (основной экран с тапом), `LoadingPage.vue`, `OnboardingPage.vue`, `Boost.vue`, `Growth.vue`, `Friends.vue`, `Tasks.vue`, `Products.vue`, `Admin.vue`, `AdminLogin.vue`.
- **Компоненты:** игровые (TapArea, Balance, EnergyBar, StatusBar), модалки (ProductModal, TaskModal), уведомления (NotificationPopup, ProductNotification, NotificationsProvider), админ-секции в `components/admin/`, UI в `components/ui/`.

### Сборка и env

- `npm run dev` — Vite, порт 5174.
- Переменные: `VITE_API_BASE`, `VITE_WS_URL` — для API и WebSocket при локальной разработке (указать на бекенд).

---

## Ключевые потоки данных

1. **Идентификация:** Telegram WebApp → `telegramId` → сохраняется и используется во всех запросах к API как ID пользователя.
2. **Игровые данные:** хранятся в `User.gameData` в MongoDB; на фронте дублируются в `gameStore` и синхронизируются через `syncFromServer`, после тапа, регенерации энергии и т.д.
3. **Энергия:** есть лимит и регенерация; эндпоинт `POST /api/admin/users/:id/regenerate-energy` при достижении максимума возвращает 200 с текущим состоянием (чтобы фронт перестал слать запросы).
4. **Админка:** логин через ApiService → JWT в localStorage → проверка в `router.beforeEach` и на бекенде для маршрутов `/api/admin/*`.

---

## Где что искать

- **Изменить логику тапа / баланса / энергии** — backend: `userRoutes.js`, `adminRoutes.js` (regenerate-energy); frontend: `gameStore.js`, `apiService.js`.
- **Модель пользователя / gameData** — `backend/models/User.js` и синхронные поля в `frontend/src/stores/gameStore.js`.
- **Добавить новый API-эндпоинт** — соответствующий `backend/routes/*.js` и при необходимости `bot.js` (если новый роут); фронт — `apiService.js` и store.
- **Задачи / продукты / инвестиции** — `backend/routes/tasks/`, `productRoutes.js`, `investmentRoutes.js`; модели Task, UserTask, Product, ProductClaim, Investment.
- **Настройки игры (константы, лимиты)** — backend: `GameSettings` модель и `settingsRoutes`; frontend: `GameSettingsService`, дефолты в `gameStore.js`.
- **Админка** — `frontend/src/pages/Admin.vue`, `components/admin/*`, `adminStore.js`; бек — `adminRoutes.js`.
- **Логи и шум в консоли бекенда** — middleware логирования в `backend/bot.js` (логирование каждого запроса/ответа).

---

## Запуск локально

- **Backend:** в `backend/` задать в `.env` `MONGODB_URI` (например локальный MongoDB), затем `npm run dev`.
- **Frontend:** в `frontend/` задать в `.env` `VITE_API_BASE=http://localhost:3000` (и при необходимости `VITE_WS_URL=ws://localhost:3000`), затем `npm run dev`.

**Деплой на прод:** см. [DEPLOY.md](DEPLOY.md). Бэкенд разворачивается через Docker в `/root/gitserver-app`, один порт **3000**; фронт собирается локально и копируется на сервер.
- Для полной игры нужен реальный или тестовый Telegram Bot и открытие WebApp в клиенте Telegram (или эмуляция `window.Telegram.WebApp`).
