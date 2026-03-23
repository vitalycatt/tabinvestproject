import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    senderTelegramId: { type: String, required: true, index: true },
    receiverTelegramId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    senderBalanceBefore: { type: Number, required: true },
    senderBalanceAfter: { type: Number, required: true },
    receiverBalanceBefore: { type: Number, required: true },
    receiverBalanceAfter: { type: Number, required: true },
    status: {
      type: String,
      enum: ["completed", "failed", "pending"],
      default: "pending",
    },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

TransactionSchema.index({ senderTelegramId: 1, createdAt: -1 });
TransactionSchema.index({ receiverTelegramId: 1, createdAt: -1 });

export default mongoose.models.Transaction ||
  mongoose.model("Transaction", TransactionSchema);
