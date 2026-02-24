# Контекст проекта tabinproject-api-main

Документ для онбординга и доработок. Краткое описание: о чём проект, для какого приложения, стек, структура, API и механики.

---

## 1. Назначение проекта

- **Что это:** бэкенд (REST API + Telegram webhook) для **Telegram Mini App** в виде **экономической игры** (в README — `tg-game-tab-server`).
- **Для какого приложения:** Telegram-бот + веб-клиент (Mini App), открываемый по кнопке «Открыть игру». Пользователи заходят через `/start` или реферальную ссылку (`ref_*`).
- **Суть продукта:** игра «развивай виртуальный бизнес, зарабатывай деньги, соревнуйся с друзьями» — баланс, пассивный доход, инвестиции по категориям, задания с наградами, заявки на «продукты» по достижении дохода. Есть админка для управления контентом и пользователями.

---

## 2. Стек и конфигурация

| Компонент            | Технология                                              |
| -------------------- | ------------------------------------------------------- |
| Runtime              | Node.js (ES modules)                                    |
| Фреймворк            | Express                                                 |
| БД                   | MongoDB (Mongoose)                                      |
| Бот                  | node-telegram-bot-api (webhook)                         |
| Реальное время       | WebSocket (`ws`) по `userId`                            |
| Админ-аутентификация | JWT                                                     |
| Файлы                | multer (изображения для продуктов, инвестиций, заданий) |
| Планировщик          | node-cron (пассивный доход раз в минуту)                |

- **Конфигурация:** `config.js` — TELEGRAM_BOT_TOKEN, WEBAPP_URL, API_URL, MONGODB_URI, PORT, ADMIN_LOGIN, ADMIN_PASSWORD, JWT_SECRET.
- **Точки входа:** продакшен — `render-start.js`; разработка — `npm run dev` → `bot.js`.

---

## 3. Структура репозитория

```
.
├── bot.js              # Основной сервер (Express, WebSocket, webhook)
├── render-start.js     # Точка входа для production
├── config.js           # Конфиг из .env
├── package.json
├── .env
├── models/             # Mongoose: User, Product, ProductClaim, Investment, Task, UserTask, Referral, Notification, GameSettings
├── routes/             # API: user, admin, product, investment, referral, settings, notification, tasks/user, tasks/complete
├── lib/                # dbConnect.js
├── jobs/               # passiveIncomeJob.js (cron раз в минуту)
├── services/           # botService.js
├── scripts/            # Миграции (например migrateSetDefaultPassiveIncome.js)
└── uploads/            # Загруженные изображения (в dev — локально, в prod — UPLOAD_DIR)
```

Маршруты подключаются в `bot.js` (строки 196–205). Webhook Telegram: `POST /webhook/:TELEGRAM_BOT_TOKEN`.

---

## 4. API

| Префикс                    | Назначение                                                                 |
| -------------------------- | -------------------------------------------------------------------------- |
| `/api/admin`               | Админка: JWT auth, пользователи, продукты, заявки, инвестиции, задания, уведомления, загрузка файлов |
| `/api/users`               | Пользователи: получение по ID, addPassiveIncome, покупка инвестиций        |
| `/api/notifications`       | Отправка/тест/планирование уведомлений, отметка прочтения                  |
| `/api/settings`            | Настройки игры (GET/PUT)                                                   |
| `/api/referrals`           | Рефералы: список по userId, создание, обновление (rewardClaimed)           |
| `/api/products`            | Продукты: заявка на активацию (claim), заявки пользователя                 |
| `/api/admin/investments`   | CRUD инвестиций, загрузка картинок                                         |
| `/api/investments`         | Инвестиции по категории с данными пользователя, покупка (buy)              |
| `/api/tasks/user`          | Задачи пользователя (список с флагом completed)                           |
| `/api/tasks/complete`      | Завершение задачи (начисление награды)                                     |

Статика: `/uploads/*`, тест: `GET /test-uploads`.

---

## 5. Модели и механики

- **User** — telegramId, профиль Telegram, `gameData`: баланс, пассивный доход, энергия, уровень, множители, купленные инвестиции.
- **Investment** — категории (finances, technology, business, realestate), типы дохода (linear, parabolic, exponential, inverse_parabolic), cost, level, image.
- **Product** / **ProductClaim** — продукты с requiredIncome и заявки пользователей (pending/processing/completed/cancelled).
- **Task** / **UserTask** — задания (daily/achievement/special/platform) с наградой и завершением.
- **Referral** — реферер и награда (rewardClaimed).
- **Notification** — рассылки (all/level/income/test/one), кнопки, условия.
- **GameSettings** — глобальные настройки игры (tapValue, energy, бусты, курс монеты, levelRequirements), синглтон по `isDefault: true`.

**Джоб пассивного дохода** (`jobs/passiveIncomeJob.js`): раз в минуту начисляет пассивный доход по `gameData.passiveIncome` в `gameData.balance` с учётом `lastPassiveIncomeAt`.

---

## 6. Важные замечания

- **Cron пассивного дохода** запускается только у «лидера» (`NODE_APP_INSTANCE=0`) или при явном включении через `PASSIVE_INCOME_CRON` (не `'false'`). Иначе в многопроцессном режиме (например PM2) дублируются начисления.
- **CORS:** в production разрешён только origin из `WEBAPP_URL`; в development — любой origin.
- **Загрузки:** в dev файлы в `uploads/` (относительно корня), в production — каталог из `UPLOAD_DIR`. Раздача статики: `app.use('/uploads', express.static(uploadsPath))`.
