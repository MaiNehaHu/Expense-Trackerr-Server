const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    userId: { type: String, required: true, unique: true },
    userImage: { type: String, default: "" },
    transactions: {
      type: [Object],
      required: true,
    },
    trash: {
      type: [Object],
      required: true,
    },
    settings: {
      theme: { type: String, default: "light" },
      language: {
        code: { type: String, default: "en" },
        name: { type: String, default: "English" },
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