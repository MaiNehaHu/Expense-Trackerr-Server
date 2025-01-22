const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
    {
        type: { type: String, enum: ["month", "year"] },
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
        totalSpent: { type: Number },
        categories: {
            budget: { type: Number, required: true },
            spent: { type: Number },
            category: {
                name: { type: String, default: "Others", required: true },
                hexColor: { type: String, default: "#707070", required: true },
                sign: { type: String, default: "-", enum: ["+", "-"] },
                type: {
                    type: String,
                    enum: ["Spent", "Earned", "Borrowed", "Lend"],
                    default: "Spent"
                }
            }
        }
    });

const Budget = mongoose.model("Budget", budgetSchema);

module.exports = Budget;
