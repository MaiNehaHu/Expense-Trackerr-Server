const mongoose = require("mongoose");

const trashSchema = new mongoose.Schema(
    {
        createdAt: { type: Date, default: Date.now },
        editedAt: { type: Date },
        deletedAt: { type: Date, default: Date.now },
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
        transactor: { type: String },
        contactOfTransactor: { type: Number },
        image: { type: String },
        reminder: { type: Date },
        reminded: { type: Boolean }
    },
    { timestamps: true }
);

const Trash = mongoose.model("Trash", trashSchema);

module.exports = Trash;
