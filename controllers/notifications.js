const Notification = require('../model/notification')
const User = require('../model/user')

const getAllNotifications = async (req, res) => {
    const { id: userId } = req.params;

    try {
        const user = await User.findOne({ userId }).populate("notifications");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user.notifications);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Error Getting Notifications: ", error });
    }
}

const getTodayNotifications = async (req, res) => {
    const { id: userId } = req.params;

    try {
        // Get today's date range
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        // Find the user and filter notifications by today's date
        const user = await User.findOne({ userId }).populate({
            path: 'notifications',
            match: { createdAt: { $gte: startOfToday, $lt: endOfToday } },
            // Filter notifications by createdAt
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user.notifications);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error Getting Notifications', error });
    }
};

const getMonthNotifications = async (req, res) => {
    const { id: userId } = req.params;

    try {
        // Get the start and end of the current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1); // Set to the first day of the month
        startOfMonth.setHours(0, 0, 0, 0); // Reset the time to the start of the day

        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1); // Move to the next month
        endOfMonth.setDate(0); // Set to the last day of the current month
        endOfMonth.setHours(23, 59, 59, 999); // Set time to the end of the day

        // Find the user and filter notifications by the current month
        const user = await User.findOne({ userId }).populate({
            path: 'notifications',
            match: { createdAt: { $gte: startOfMonth, $lte: endOfMonth } },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return only the notifications for the current month
        res.status(200).json(user.notifications);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error Getting Notifications', error });
    }
};

async function editNotifcationTransaction(req, res) {
    const { id: userId, notificationId } = req.params;
    const { read, header, type, transaction: originalTransaction } = req.body;

    try {
        // Find the user by userId
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Locate the transaction in the user's transactions
        const transaction = user.notifications.find((noti) => noti._id.toString() === notificationId);
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found in user's records" });
        }

        // Update transaction fields in the user's notifications
        if (read !== undefined) transaction.read = read;
        if (header !== undefined) transaction.header = header;
        if (type !== undefined) transaction.type = type;
        if (originalTransaction !== undefined) transaction.transaction = originalTransaction;

        // Mark the notifications field as modified
        user.markModified('notifications');

        // Save the updated user data
        await user.save();

        // Respond with the updated recurring transaction
        res.status(200).json({ message: "Recurring transaction updated successfully", transaction });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating recurring transaction", error });
    }
}

async function deleteNotification(req, res) {
    const { id: userId, notificationId } = req.params;

    try {
        // Find the user by userId
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find the index of the transaction in the notifications array
        const transactionIndex = user.notifications.findIndex((noti) => noti._id.toString() === notificationId);
        if (transactionIndex === -1) {
            return res.status(404).json({ message: "Notification not found in user's records" });
        }

        // Remove the transaction from the notifications array
        user.notifications.splice(transactionIndex, 1);

        // Mark the notifications field as modified
        user.markModified('notifications');

        // Save the updated user data
        await user.save();

        res.status(200).json({ message: "Transaction deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting transaction", error });
    }
}

async function deleteAllNotifications(req, res) {
    const { id: userId } = req.params;

    try {
        // Find the user by userId
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Ensure notifications exist before deleting
        if (user.notifications && user.notifications.length > 0) {
            const notificationIds = user.notifications.map(n => n._id);
            await Notification.deleteMany({ _id: { $in: notificationIds } });
        }

        // Clear all notifications from the user's notifications array
        user.notifications = [];
        user.markModified("notifications");
        await user.save();

        res.status(200).json({ message: "All notifications deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting notifications", error });
    }
}

module.exports = {
    getAllNotifications,
    getTodayNotifications,
    getMonthNotifications,
    editNotifcationTransaction,
    deleteNotification,
    deleteAllNotifications
}