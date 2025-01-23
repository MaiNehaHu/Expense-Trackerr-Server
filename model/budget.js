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
                budget: { type: Number, required: true },
                spent: { type: Number, default: 0 },
                category: {
                    _id: { type: String, required: true },
                    name: { type: String, default: "Others", required: true },
                    hexColor: { type: String, default: "#707070", required: true },
                    sign: { type: String, default: "-", enum: ["+", "-"] },
                    type: {
                        type: String,
                        enum: ["Spent", "Earned", "Borrowed", "Lend"],
                        default: "Spent"
                    },
                }
            }
        ]
    });

const Budget = mongoose.model("Budget", budgetSchema);

module.exports = Budget;
