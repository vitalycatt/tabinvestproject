/**
 * Проверка подсчёта MAU (как в боте и админке).
 * Запуск на сервере (из папки backend):
 *   npm run check-mau
 *   или: node scripts/check-mau.js
 * Альтернатива — запрос к API (на сервере или с любого места):
 *   curl http://localhost:3002/api/stats/mau
 *   или: curl https://ВАШ_ДОМЕН/api/stats/mau
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import dbConnect from "../lib/dbConnect.js";
import { getMauStats } from "../lib/stats.js";

async function run() {
  await dbConnect();
  console.log("Подключение к БД: OK");

  const { activeThisMonth, totalUsers } = await getMauStats();

  console.log("---");
  console.log("MAU (активных за последние 30 дней):", activeThisMonth);
  console.log("Всего пользователей:", totalUsers);
  console.log("---");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
