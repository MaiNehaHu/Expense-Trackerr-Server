const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: "User Name" },
    userId: { type: String, required: true, unique: true },
    contact: { type: Number, required: true, },
    otp: { type: Number },
    biometric: { type: boolean, default: false },
    userImage: { type: String, default: "" },
    transactions: {
      type: [Object],
      required: true,
    },
    recuringTransactions: {
      type: [Object],
      required: true,
    },
    trash: {
      type: [Object],
      required: true,
    },
    categories: {
      type: [Object],
      required: true,
    },
    people: {
      type: [Object],
      required: true,
    },
    notifications: {
      type: [Object],
      required: true,
    },
    budgets: {
      type: [Object],
      required: true,
    },
    settings: {
      theme: { type: String, default: "light" },
      language: {
        code: { type: String, default: "en" },
        name: { type: String, default: "English" },
      },
      currency: {
        symbol: { type: String, default: "₹" },
        side: { type: String, default: "left", enum: ["left", "right"] },
        decimalSeparator: { type: String, default: "." },
        thousandSeparator: { type: String, default: "," },
      },
      reminderToAddTrans: { type: Boolean, default: false },
      screenLock: { type: Boolean, default: false },
      autoBackup: { type: Boolean, default: true },
      autoCleanTrash: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
