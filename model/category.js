const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
    {
        name: { type: String, default: "Others", required: true },
        hexColor: { type: String, default: "#707070", required: true },
        sign: { type: String, default: "-", enum: ["+", "-"], required: true },
        type: {
            type: String,
            enum: ["Spent", "Earned", "Borrowed", "Lend"],
            default: "Spent",
            required: true
        }
    });

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
