const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: "Your Name" },
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    biometric: { type: Boolean, default: false },
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
    sharedLinks: {
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
      autoBackup: { type: Boolean, default: false },
      autoCleanTrash: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
