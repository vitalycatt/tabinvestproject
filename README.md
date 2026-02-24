# Tabinvestproject

Telegram Mini App — игра-кликер с инвестициями и пассивным доходом. Пользователи заходят через Telegram WebApp, данные хранятся в MongoDB. Есть админ-панель для управления пользователями, задачами, продуктами и уведомлениями.

---

## Стек

| Часть    | Технологии                                                                             |
| -------- | -------------------------------------------------------------------------------------- |
| Backend  | Node.js, Express, MongoDB (Mongoose), Telegram Bot API (webhook), WebSocket, node-cron |
| Frontend | Vue 3, Vue Router, Pinia, Vite                                                         |
| Инфра    | Один репозиторий (монорепо): папки `backend/` и `frontend/`                            |

Подробная структура и точки входа — в [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md).

---

## Требования

- **Node.js** 18+ (рекомендуется LTS)
- **MongoDB** 6+ (локально или MongoDB Atlas)
- **Telegram Bot** — токен от [@BotFather](https://t.me/BotFather)

---

## Структура репозитория

```
├── backend/          # API, бот, БД, cron
│   ├── bot.js        # точка входа, Express, маршруты, WebSocket, webhook
│   ├── config.js     # конфиг из .env
│   ├── .env          # переменные окружения (создать вручную)
│   ├── models/       # Mongoose-модели
│   ├── routes/       # API-маршруты
│   ├── jobs/         # cron (пассивный доход)
│   └── lib/          # dbConnect и др.
├── frontend/         # Vue SPA
│   ├── src/
│   │   ├── main.js   # точка входа, роутер, Pinia
│   │   ├── pages/    # страницы приложения
│   │   ├── stores/   # Pinia (gameStore, adminStore)
│   │   ├── services/ # apiService и др.
│   │   └── components/
│   ├── .env          # переменные окружения (создать вручную)
│   └── package.json
├── README.md
└── PROJECT_CONTEXT.md
```

---

## Установка и первый запуск

### 1. Клонирование и установка зависимостей

```bash
git clone <url-репозитория> tabinvestproject
cd tabinvestproject

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### 2. Переменные окружения

Файлы `.env` в репозиторий не попадают. Их нужно создать вручную.

#### Backend (`backend/.env`)

| Переменная            | Обязательно | Описание                                                                                                             |
| --------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------- |
| `TELEGRAM_BOT_TOKEN`  | да          | Токен бота от BotFather                                                                                              |
| `MONGODB_URI`         | да          | Строка подключения MongoDB (локально: `mongodb://localhost:27017/tabinvestproject_local`)                            |
| `WEBAPP_URL`          | да          | URL фронтенда (для CORS и бота), например `https://your-app.ru` или для локальной разработки `http://localhost:5174` |
| `PORT`                | нет         | Порт сервера (по умолчанию 3000)                                                                                     |
| `API_URL`             | нет         | Публичный URL API (для production)                                                                                   |
| `APP_URL`             | нет         | Публичный URL приложения (для production)                                                                            |
| `ADMIN_LOGIN`         | нет         | Логин админки (по умолчанию admin)                                                                                   |
| `ADMIN_PASSWORD`      | нет         | Пароль админки                                                                                                       |
| `JWT_SECRET`          | нет         | Секрет для JWT (production — обязательно свой)                                                                       |
| `UPLOAD_DIR`          | нет         | Путь к папке загрузок в production                                                                                   |
| `PASSIVE_INCOME_CRON` | нет         | Включить/выключить cron пассивного дохода (`true`/`false`)                                                           |

#### Frontend (`frontend/.env`)

| Переменная      | Описание                                       |
| --------------- | ---------------------------------------------- |
| `VITE_API_BASE` | URL бекенда. Локально: `http://localhost:3000` |
| `VITE_WS_URL`   | URL WebSocket. Локально: `ws://localhost:3000` |

Остальные переменные из `frontend/.env` (например `TELEGRAM_BOT_TOKEN`, `WEBAPP_URL`) могут использоваться для сборки или серверных скриптов; для запуска dev-сервера важны в первую очередь `VITE_*`.

### 3. База данных

- **Локально:** установи MongoDB и запусти (например `brew services start mongodb-community` на macOS). В `backend/.env` укажи `MONGODB_URI=mongodb://localhost:27017/tabinvestproject_local`.
- **Облако:** создай кластер на [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), скопируй connection string в `MONGODB_URI`.

При первом обращении к API база и коллекции создадутся автоматически. Тестового пользователя при необходимости можно создать скриптом (см. [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) или скрипты в `backend/scripts/`).

### 4. Запуск в режиме разработки

Два терминала:

**Терминал 1 — backend**

```bash
cd backend
npm run dev
```

Сервер поднимется на `http://localhost:3000` (или на порт из `PORT`).

**Терминал 2 — frontend**

```bash
cd frontend
npm run dev
```

Фронт откроется на `http://localhost:5174`. В браузере приложение будет работать без Telegram; для полного сценария (WebApp) нужен настроенный бот и открытие мини-приложения из Telegram.

### 5. Telegram Bot (для полного сценария)

1. Создай бота через [@BotFather](https://t.me/BotFather), получи токен.
2. Вставь токен в `backend/.env` как `TELEGRAM_BOT_TOKEN`.
3. Для production: настрой Web App URL в BotFather и webhook на твой сервер: `POST https://your-domain/webhook/<TELEGRAM_BOT_TOKEN>`.

Локально webhook можно не поднимать, если достаточно тестировать только API и фронт.

---

## Скрипты

### Backend (`backend/`)

| Команда       | Описание                                     |
| ------------- | -------------------------------------------- |
| `npm run dev` | Запуск с nodemon (перезапуск при изменениях) |
| `npm start`   | Production: запуск через `render-start.js`   |

### Frontend (`frontend/`)

| Команда                | Описание                      |
| ---------------------- | ----------------------------- |
| `npm run dev`          | Dev-сервер Vite на порту 5174 |
| `npm run build`        | Сборка для production         |
| `npm run preview`      | Просмотр собранной версии     |
| `npm run vercel-build` | Сборка под Vercel             |

---

## Полезные советы

- **Локальная разработка без влияния на прод:** используй отдельную базу (например `mongodb://localhost:27017/tabinvestproject_local`) и не подставляй продовые `MONGODB_URI`, `TELEGRAM_BOT_TOKEN` и т.д. в `.env` при локальном запуске.
- **Админка:** после запуска фронта зайди на `http://localhost:5174/admin`, логин и пароль — из `ADMIN_LOGIN` и `ADMIN_PASSWORD` в `backend/.env`.
- **Шум в консоли бекенда:** в `backend/bot.js` включено логирование каждого запроса/ответа; при необходимости его можно отключить или сократить.
- **Архитектура и «где что лежит»:** см. [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md).

---

## Частые проблемы

| Проблема                                       | Что проверить                                                                                                                                                                                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| «User not found» / 404 при запросах            | Пользователь с таким `telegramId` отсутствует в БД. Для локальной разработки создай тестового пользователя (скрипт или вручную в БД).                                                                                                      |
| CORS-ошибки                                    | В `backend/config.js` и CORS middleware учтён `WEBAPP_URL`. Для локального фронта укажи в backend `.env`: `WEBAPP_URL=http://localhost:5174`.                                                                                              |
| Фронт не видит API                             | Убедись, что в `frontend/.env` задан `VITE_API_BASE=http://localhost:3000` (без слэша в конце) и бекенд запущен на том же порту.                                                                                                           |
| Много запросов «Достигнут максимум» по энергии | Ожидаемое поведение при полной энергии: бекенд возвращает 200 с текущим состоянием; фронт после этого перестаёт слать запросы. Если запросы не прекращаются — см. логику в `gameStore.js` и эндпоинт regenerate-energy в `adminRoutes.js`. |

---

## Документация

- [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) — структура проекта, маршруты API, модели, хранилища, где что искать в коде.
