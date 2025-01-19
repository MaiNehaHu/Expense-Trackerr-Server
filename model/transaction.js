const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    createdAt: { type: Date, default: Date.now },
    editedAt: { type: Date },
    amount: { type: Number, required: true },
    note: { type: String, default: "" },
    status: { type: String, default: "Pending" },
    category: {
      hexColor: { type: String, default: "#707070" },
      name: { type: String, default: "Others" },
      sign: { type: String, default: "-" },
      type: {
          type: String,
          enum: ["Spent", "Earned", "Borrowed", "Lend"],
          default: "Spent",
      }
    },
    transactor: { type: String },
    contactOfTransactor: { type: Number },
    image: { type: String },
    reminder: { type: Date },
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
