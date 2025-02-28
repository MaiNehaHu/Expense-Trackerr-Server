const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
    {
        type: { type: String, enum: ["month", "year"], required: true },
        period: {
            monthAndYear: {
                month: {
                    type: String,
                    required: function () {
                        return this.type === "month";
                    }
                },
                year: {
                    type: String,
                    required: function () {
                        return this.type === "month";
                    }
                }
            },
            year: {
                type: String,
                required: function () {
                    return this.type === "year";
                }
            },
        },
        totalBudget: { type: Number, required: true },
        totalSpent: { type: Number, default: 0 },
        categories: [
            {
                name: { type: String, default: "Others", required: true },
                budget: { type: Number, default: 0 },
                spent: { type: Number, default: 0 },
                included: { type: Boolean, required: true, default: true, enum: [true, false] },
                hexColor: { type: String, default: "#707070", required: true },
                sign: { type: String, default: "-", enum: ["+", "-"] },
                type: {
                    type: String,
                    enum: ["Spent", "Earned", "Borrowed", "Lend"],
                    default: "Spent"
                },
                _id: { type: String, required: true },
            }
        ]
    });

const Budget = mongoose.model("Budget", budgetSchema);

module.exports = Budget;
