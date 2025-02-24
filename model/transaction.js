const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    createdAt: { type: Date, default: Date.now },
    editedAt: { type: Date },
    amount: { type: Number, required: true },
    note: { type: String, default: "" },
    status: { type: String, default: "Pending" },
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
      name: { type: String },
      contact: { type: Number }
    },
    transactor: { type: String },
    contactOfTransactor: { type: Number },
    image: { type: String },
    reminder: { type: Date },
    reminded: { type: Boolean }
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
