import mongoose from "mongoose";

const AdminLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  adminTelegramId: { type: String },
  action: { type: String, required: true },
  targetUserId: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

AdminLogSchema.index({ createdAt: -1 });
AdminLogSchema.index({ targetUserId: 1, createdAt: -1 });

export default mongoose.models.AdminLog ||
  mongoose.model("AdminLog", AdminLogSchema);
