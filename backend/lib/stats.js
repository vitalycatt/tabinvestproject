/**
 * Единый подсчёт статистики пользователей (MAU и т.д.).
 * Используется в боте, API /api/stats/mau и скрипте check-mau.
 */
import User from "../models/User.js";

/**
 * Считает MAU (активные за последние 30 дней) и общее число пользователей.
 * Логика совпадает с админкой (GET /api/admin/users).
 * @returns {{ activeThisMonth: number, totalUsers: number }}
 */
export async function getMauStats() {
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const [activeThisMonth, totalUsers] = await Promise.all([
    User.countDocuments({ lastLogin: { $gte: monthAgo } }),
    User.countDocuments({}),
  ]);

  return {
    activeThisMonth: Number(activeThisMonth) || 0,
    totalUsers: Number(totalUsers) || 0,
  };
}
