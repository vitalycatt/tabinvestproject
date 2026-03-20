import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

const MAX_TRANSACTION_AMOUNT = 1_000_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

// In-memory rate limiter per telegramId
const rateLimitMap = new Map();

function checkRateLimit(telegramId) {
  const now = Date.now();
  const entry = rateLimitMap.get(telegramId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(telegramId, { windowStart: now, count: 1 });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// Периодическая очистка устаревших записей
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitMap.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW_MS * 5);

// POST /api/transfer/search
router.post("/search", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Введите username или Telegram ID" });
    }

    const searchTerm = query.trim().replace(/^@/, "");

    const filter = {
      $or: [
        { username: { $regex: `^${searchTerm}$`, $options: "i" } },
        { telegramId: searchTerm },
      ],
    };

    const user = await User.findOne(filter).select(
      "telegramId username first_name last_name photo_url"
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Пользователь не найден" });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        telegramId: user.telegramId,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        photo_url: user.photo_url,
      },
    });
  } catch (error) {
    console.error("[transfer/search] error:", error);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
});

// POST /api/transfer/send
router.post("/send", async (req, res) => {
  try {
    const { senderTelegramId, receiverTelegramId, amount } = req.body;

    // Валидация входных данных
    if (!senderTelegramId || !receiverTelegramId || !amount) {
      return res
        .status(400)
        .json({ success: false, message: "Все поля обязательны" });
    }

    const transferAmount = Math.floor(Number(amount));

    if (!Number.isFinite(transferAmount) || transferAmount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Сумма должна быть больше нуля" });
    }

    if (transferAmount > MAX_TRANSACTION_AMOUNT) {
      return res.status(400).json({
        success: false,
        message: `Максимальная сумма перевода: ${MAX_TRANSACTION_AMOUNT.toLocaleString()} монет`,
      });
    }

    if (String(senderTelegramId) === String(receiverTelegramId)) {
      return res
        .status(400)
        .json({ success: false, message: "Нельзя переводить самому себе" });
    }

    // Rate limiting
    if (!checkRateLimit(String(senderTelegramId))) {
      return res.status(429).json({
        success: false,
        message: "Слишком много переводов. Подождите минуту",
      });
    }

    // Находим обоих пользователей
    const [sender, receiver] = await Promise.all([
      User.findOne({ telegramId: String(senderTelegramId) }),
      User.findOne({ telegramId: String(receiverTelegramId) }),
    ]);

    if (!sender) {
      return res
        .status(404)
        .json({ success: false, message: "Отправитель не найден" });
    }
    if (!receiver) {
      return res
        .status(404)
        .json({ success: false, message: "Получатель не найден" });
    }

    const senderBalanceBefore = Math.floor(
      Number(sender.gameData?.balance ?? 0)
    );
    const receiverBalanceBefore = Math.floor(
      Number(receiver.gameData?.balance ?? 0)
    );

    if (senderBalanceBefore < transferAmount) {
      return res
        .status(400)
        .json({ success: false, message: "Недостаточно средств" });
    }

    // Атомарное списание — обновляем только если баланс >= сумме
    const senderUpdate = await User.findOneAndUpdate(
      {
        telegramId: String(senderTelegramId),
        "gameData.balance": { $gte: transferAmount },
      },
      { $inc: { "gameData.balance": -transferAmount } },
      { new: true }
    );

    if (!senderUpdate) {
      return res
        .status(400)
        .json({ success: false, message: "Недостаточно средств" });
    }

    // Зачисление получателю
    const receiverUpdate = await User.findOneAndUpdate(
      { telegramId: String(receiverTelegramId) },
      { $inc: { "gameData.balance": transferAmount } },
      { new: true }
    );

    if (!receiverUpdate) {
      // Откат: возвращаем средства отправителю
      await User.findOneAndUpdate(
        { telegramId: String(senderTelegramId) },
        { $inc: { "gameData.balance": transferAmount } }
      );
      return res
        .status(500)
        .json({ success: false, message: "Ошибка зачисления. Средства возвращены" });
    }

    const senderBalanceAfter = Math.floor(
      Number(senderUpdate.gameData?.balance ?? 0)
    );
    const receiverBalanceAfter = Math.floor(
      Number(receiverUpdate.gameData?.balance ?? 0)
    );

    // Создаём запись транзакции
    const transaction = await Transaction.create({
      senderId: sender._id,
      receiverId: receiver._id,
      senderTelegramId: String(senderTelegramId),
      receiverTelegramId: String(receiverTelegramId),
      amount: transferAmount,
      senderBalanceBefore,
      senderBalanceAfter,
      receiverBalanceBefore,
      receiverBalanceAfter,
      status: "completed",
      completedAt: new Date(),
    });

    console.log(
      `[transfer/send] ${senderTelegramId} -> ${receiverTelegramId}: ${transferAmount} монет (tx: ${transaction._id})`
    );

    res.json({
      success: true,
      data: {
        transactionId: transaction._id,
        amount: transferAmount,
        senderBalance: senderBalanceAfter,
        receiver: {
          telegramId: receiver.telegramId,
          username: receiver.username,
          first_name: receiver.first_name,
          last_name: receiver.last_name,
        },
      },
    });
  } catch (error) {
    console.error("[transfer/send] error:", error);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
});

// GET /api/transfer/history
router.get("/history", async (req, res) => {
  try {
    const { telegramId, page = 1, limit = 20 } = req.query;

    if (!telegramId) {
      return res
        .status(400)
        .json({ success: false, message: "telegramId обязателен" });
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = {
      status: "completed",
      $or: [
        { senderTelegramId: String(telegramId) },
        { receiverTelegramId: String(telegramId) },
      ],
    };

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    // Собираем telegramId контрагентов для подгрузки их данных
    const counterpartyIds = new Set();
    for (const tx of transactions) {
      if (tx.senderTelegramId === String(telegramId)) {
        counterpartyIds.add(tx.receiverTelegramId);
      } else {
        counterpartyIds.add(tx.senderTelegramId);
      }
    }

    const counterparties = await User.find({
      telegramId: { $in: [...counterpartyIds] },
    })
      .select("telegramId username first_name last_name photo_url")
      .lean();

    const counterpartyMap = {};
    for (const u of counterparties) {
      counterpartyMap[u.telegramId] = u;
    }

    const items = transactions.map((tx) => {
      const isSender = tx.senderTelegramId === String(telegramId);
      const counterpartyTgId = isSender
        ? tx.receiverTelegramId
        : tx.senderTelegramId;
      const counterparty = counterpartyMap[counterpartyTgId] || {};

      return {
        id: tx._id,
        type: isSender ? "outgoing" : "incoming",
        amount: tx.amount,
        counterparty: {
          telegramId: counterpartyTgId,
          username: counterparty.username || null,
          first_name: counterparty.first_name || null,
          last_name: counterparty.last_name || null,
          photo_url: counterparty.photo_url || null,
        },
        status: tx.status,
        createdAt: tx.createdAt,
      };
    });

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          total,
          pageSize: limitNum,
        },
      },
    });
  } catch (error) {
    console.error("[transfer/history] error:", error);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
});

export default router;
