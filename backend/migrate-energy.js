/**
 * Одноразовый скрипт миграции энергии.
 *
 * Что делает:
 *   - Находит всех пользователей с gameData.energy.max > 100
 *   - Устанавливает max = 100
 *   - Если current > 100, обрезает current до 100
 *
 * Что НЕ делает:
 *   - НЕ трогает баланс, инвестиции, уровни или любые другие данные
 *   - НЕ удаляет пользователей
 *   - НЕ создаёт новых записей
 *
 * Запуск:  node migrate-energy.js
 * Из папки:  backend/
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const MONGODB_URI = process.env.MONGODB_URI;
const NEW_MAX = 100;

if (!MONGODB_URI) {
  console.error("MONGODB_URI не найден в .env");
  process.exit(1);
}

async function migrate() {
  console.log("Подключение к MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Подключено.\n");

  const db = mongoose.connection.db;
  const collection = db.collection("users");

  // Шаг 1: Посмотрим, сколько пользователей затронет миграция (dry run)
  const affectedCount = await collection.countDocuments({
    "gameData.energy.max": { $gt: NEW_MAX },
  });

  console.log(`Пользователей с energy.max > ${NEW_MAX}: ${affectedCount}`);

  if (affectedCount === 0) {
    console.log("Миграция не требуется — все пользователи уже обновлены.");
    await mongoose.disconnect();
    process.exit(0);
  }

  // Шаг 2: Обновляем max у всех затронутых
  const resultMax = await collection.updateMany(
    { "gameData.energy.max": { $gt: NEW_MAX } },
    { $set: { "gameData.energy.max": NEW_MAX } }
  );
  console.log(`Обновлено energy.max: ${resultMax.modifiedCount} пользователей`);

  // Шаг 3: Обрезаем current, если он превышает новый max
  const resultCurrent = await collection.updateMany(
    { "gameData.energy.current": { $gt: NEW_MAX } },
    { $set: { "gameData.energy.current": NEW_MAX } }
  );
  console.log(
    `Обрезано energy.current: ${resultCurrent.modifiedCount} пользователей`
  );

  // Шаг 4: Проверяем результат
  const remainingBad = await collection.countDocuments({
    $or: [
      { "gameData.energy.max": { $gt: NEW_MAX } },
      { "gameData.energy.current": { $gt: NEW_MAX } },
    ],
  });

  if (remainingBad === 0) {
    console.log("\nМиграция завершена успешно. Все пользователи обновлены.");
  } else {
    console.error(
      `\nВНИМАНИЕ: ${remainingBad} пользователей всё ещё имеют значения > ${NEW_MAX}`
    );
  }

  await mongoose.disconnect();
  console.log("Отключено от MongoDB.");
}

migrate().catch((err) => {
  console.error("Ошибка миграции:", err);
  mongoose.disconnect();
  process.exit(1);
});
