const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    createdAt: { type: Date, default: Date.now },
    editedAt: { type: Date },
    amount: { type: Number, required: true },
    note: { type: String, default: "" },
    category: {
      _id: { type: String, required: true },
      name: { type: String, default: "Others" },
      hexColor: { type: String, default: "#707070" },
      sign: { type: String, default: "-", enum: ["+", "-"] },
      type: {
        type: String,
        enum: ["Spent", "Earned", "Borrowed", "Lend"],
        default: "Spent",
      },
    },
    people: {
      _id: { type: String },
      name: { type: String },
      contact: { type: Number },
      relation: { type: String }
    },
    image: { type: String },
    pushedIntoTransactions: { type: Boolean }
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
