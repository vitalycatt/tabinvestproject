# Инструкция по деплою (tabinvestproject)

## Общая схема

- **Фронтенд (Vue/Vite):** собирается **локально** на машине разработчика, готовый каталог `frontend/dist/` заливается на сервер в каталог статики (путь задаётся в `deploy.sh` через `DEPLOY_FRONT_DIR`).
- **Бэкенд (Node):** разворачивается **на сервере** через **Docker**. Код берётся из Git-репозитория в каталоге `/root/gitserver-app`; образ собирается из `backend/`, контейнер слушает **порт 3000**.
- **Сайт по домену:** раздаёт **nginx** (статика из каталога фронта + проксирование API на бэкенд на порт 3000).

На сервере **не** выполняется установка зависимостей Node вручную и **не** собирается фронт — бэкенд работает в контейнере, фронт собирается локально и копируется по rsync.

---

## Что нужно для деплоя

### Локально (ваш компьютер)

- Доступ в репозиторий: `git@github.com:vitalycatt/tabinvestproject.git`
- Node.js и npm (для сборки фронта)
- SSH-доступ к серверу: ключ должен быть добавлен в `~/.ssh/authorized_keys` пользователя, под которым выполняется деплой (см. `DEPLOY_SSH` в `deploy.sh`)

### На сервере

- Клон репозитория в каталоге `/root/gitserver-app`, ветка `main`
- Docker и Docker Compose (для сборки и запуска контейнера бэкенда)
- Каталог статики фронта — отдаётся nginx (путь задаётся в `deploy.sh` как `DEPLOY_FRONT_DIR`, по умолчанию `/var/www/tabinvestproject.ru/frontend`)
- Бэкенд слушает **порт 3000** (переменная `PORT=3000` в `backend/.env` на сервере)
- Файл `backend/.env` на сервере создаётся и редактируется вручную, в репозиторий не коммитится

---

## Как задеплоить

### 1. Подготовка (один раз)

- Убедиться, что в `frontend/.env.production` указаны продакшен-URL:
  - `VITE_API_BASE` — базовый URL сайта (например `https://ваш-домен.ru`)
  - `VITE_WS_URL` — URL для WebSocket (например `wss://ваш-домен.ru`)
- В корне монорепо выполнить: `chmod +x deploy.sh`

### 2. Обычный деплой

Из корня репозитория на своей машине:

```bash
./deploy.sh
```

или:

```bash
npm run deploy
```

Скрипт по шагам:

1. Собирает фронт: `npm run build:frontend` (используется `frontend/.env.production`).
2. Копирует `frontend/dist/` на сервер через `rsync` в каталог статики.
3. По SSH выполняет на сервере `deploy-server.sh`, который:
   - делает `git pull origin main` в `/root/gitserver-app`;
   - собирает образ приложения: `docker compose build --no-cache app`;
   - запускает контейнер: `docker compose up -d app`.

Бэкенд в контейнере слушает порт **3000**; nginx должен проксировать API на `http://127.0.0.1:3000`.

### 3. Переменные для деплоя

В начале `deploy.sh` (или через переменные окружения перед запуском):

- **DEPLOY_SSH** — строка для подключения по SSH (пользователь@хост).
- **DEPLOY_FRONT_DIR** — каталог на сервере, куда копируется статика фронта.

Пример запуска с другой конфигурацией:

```bash
export DEPLOY_SSH="user@другой-хост"
export DEPLOY_FRONT_DIR="/var/www/другой-сайт/frontend"
./deploy.sh
```

---

## Важные файлы

| Файл | Назначение |
|------|------------|
| `deploy.sh` | Запускается **локально**: сборка фронта, rsync, вызов по SSH `deploy-server.sh`. |
| `deploy-server.sh` | Выполняется **на сервере**: git pull, сборка и запуск контейнера через `docker compose`. |
| `docker-compose.yml` | Описание сервиса `app`: сборка из `backend/`, порт 3000, volume для uploads. |
| `backend/Dockerfile` | Сборка образа бэкенда (Node 18, запуск `node render-start.js`). |
| `backend/.dockerignore` | Исключения при сборке образа (node_modules, .env, uploads и т.д.). |
| `frontend/.env.production` | Переменные для **сборки** фронта под прод (VITE_API_BASE, VITE_WS_URL). Можно коммитить. |
| `frontend/.env` | Переменные для локальной разработки (например localhost). В `.gitignore` не попадает в репо. |
| `backend/.env` | Секреты и настройки бэкенда; на сервере создаётся вручную, в Git не коммитится. |

---

## Если что-то пошло не так

- **На проде в API нет полей `activeThisMonth` / `totalBalance` в `data.stats`** — чаще всего на сервере крутится **старая версия кода** (контейнер не пересобран после деплоя). Что проверить:
  1. **Заголовок ответа** — запрос к `GET /api/admin/users?page=1&limit=1` должен вернуть заголовок `X-Admin-Users-Stats: v2`. На сервере: `curl -sI "http://127.0.0.1:3000/api/admin/users?page=1&limit=1"` — в выводе должен быть `X-Admin-Users-Stats`. Если заголовка нет — пересоберите контейнер: `cd /root/gitserver-app && docker compose build --no-cache app && docker compose up -d app`.
  2. **Файлы на сервере** — убедиться, что в `/root/gitserver-app` актуальный код: `git branch`, `git pull origin main`, затем снова `docker compose build --no-cache app && docker compose up -d app`.
  3. В ответе API поля дублируются: `data.stats.activeThisMonth`, `data.stats.totalBalance` и на верхнем уровне `data` — фронт может брать из любого места.
- **Сайт не открывается по домену** — проверить nginx: `systemctl status nginx`. В конфиге сайта должны быть правильные `root` для статики и `proxy_pass` на `http://127.0.0.1:3000` для API.
- **Фронт ходит на localhost** — пересобрать фронт при актуальном `frontend/.env.production` и снова запустить `./deploy.sh`.
- **Порт 3000 занят** — убедиться, что старый процесс (PM2 или контейнер из другого каталога) остановлен. Проверить: `ss -tlnp | grep 3000` или `docker ps` (контейнер `tabinvest_app` должен быть из `/root/gitserver-app`).
- **Контейнер не стартует** — проверить логи: `docker compose logs app`. Убедиться, что в `backend/.env` на сервере заданы обязательные переменные (`TELEGRAM_BOT_TOKEN`, `MONGODB_URI`, `WEBAPP_URL`) и `PORT=3000`.
