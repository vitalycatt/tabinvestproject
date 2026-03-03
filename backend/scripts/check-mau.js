/**
 * Проверка подсчёта MAU (как в боте и админке).
 * Запуск на сервере (из папки backend):
 *   npm run check-mau
 *   или: node scripts/check-mau.js
 * Альтернатива — запрос к API (на сервере или с любого места):
 *   curl http://localhost:3000/api/stats/mau
 *   или: curl https://ВАШ_ДОМЕН/api/stats/mau
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import dbConnect from "../lib/dbConnect.js";
import User from "../models/User.js";

async function run() {
  await dbConnect();
  console.log("Подключение к БД: OK");

  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const mauCount = await User.countDocuments({
    lastLogin: { $gte: monthAgo },
  });

  const totalUsers = await User.countDocuments({});

  console.log("---");
  console.log("MAU (активных за последние 30 дней):", mauCount);
  console.log("Всего пользователей:", totalUsers);
  console.log("---");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
