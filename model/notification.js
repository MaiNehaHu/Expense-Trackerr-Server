const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        header: { type: String, default: "", required: true },
        type: { type: String, enum: ["Recuring", "Reminder"], required: true },
        read: { type: Boolean, default: false, required: true },
        transaction: {
            type: Object,
            required: true,
        },
    },
    { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
