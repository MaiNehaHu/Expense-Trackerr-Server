const User = require('../model/user');

const getAllNotifications = async (req, res) => {
    const { id: userId } = req.params;

    try {
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user.notifications || []);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Error Getting Notifications", error });
    }
};

const getTodayNotifications = async (req, res) => {
    const { id: userId } = req.params;

    try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const todaysNotifications = (user.notifications || []).filter(n =>
            new Date(n.createdAt) >= startOfToday && new Date(n.createdAt) <= endOfToday
        );

        res.status(200).json(todaysNotifications);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error Getting Notifications', error });
    }
};

const getMonthNotifications = async (req, res) => {
    const { id: userId } = req.params;

    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const monthNotifications = (user.notifications || []).filter(n =>
            new Date(n.createdAt) >= startOfMonth && new Date(n.createdAt) <= endOfMonth
        );

        res.status(200).json(monthNotifications);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error Getting Notifications', error });
    }
};

async function editNotifcationTransaction(req, res) {
    const { id: userId, notificationId } = req.params;
    const { read, header, type, transaction: originalTransaction } = req.body;

    try {
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const notification = user.notifications.find(noti => noti._id.toString() === notificationId);
        if (!notification) {
            return res.status(404).json({ message: "Notification not found in user's records" });
        }

        if (read !== undefined) notification.read = read;
        if (header !== undefined) notification.header = header;
        if (type !== undefined) notification.type = type;
        if (originalTransaction !== undefined) notification.transaction = originalTransaction;

        user.markModified('notifications');
        await user.save();

        res.status(200).json({ message: "Notification updated successfully", notification });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating notification", error });
    }
}

async function deleteNotification(req, res) {
    const { id: userId, notificationId } = req.params;

    try {
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const index = user.notifications.findIndex(noti => noti._id.toString() === notificationId);
        if (index === -1) {
            return res.status(404).json({ message: "Notification not found in user's records" });
        }

        user.notifications.splice(index, 1);
        user.markModified('notifications');
        await user.save();

        res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting notification", error });
    }
}

async function deleteAllNotifications(req, res) {
    const { id: userId } = req.params;

    try {
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.notifications = [];
        user.markModified("notifications");
        await user.save();

        res.status(200).json({ message: "All notifications deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting notifications", error });
    }
}

const deleteSelectedNotifications = async (req, res) => {
    const { id: userId } = req.params;
    const { notificationIds } = req.body;

    try {
        if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
            return res.status(400).json({ message: "No notification IDs provided" });
        }

        const validIds = [...new Set(notificationIds.filter(id => typeof id === 'string' && id.length > 0))];
        if (validIds.length === 0) {
            return res.status(400).json({ message: "No valid notification IDs provided" });
        }

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const deletedIds = [];
        const skippedIds = [];

        user.notifications = (user.notifications || []).filter(notification => {
            const id = notification._id?.toString();
            if (id && validIds.includes(id)) {
                deletedIds.push(id);
                return false; // Remove this
            }
            return true; // Keep it
        });

        user.markModified("notifications");
        await user.save();

        skippedIds.push(...validIds.filter(id => !deletedIds.includes(id)));

        res.status(200).json({
            message: "Selected notifications deleted successfully",
            deleted: deletedIds,
            skipped: skippedIds,
        });
    } catch (error) {
        console.error("Error deleting notifications:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

module.exports = {
    getAllNotifications,
    getTodayNotifications,
    getMonthNotifications,
    editNotifcationTransaction,
    deleteNotification,
    deleteAllNotifications,
    deleteSelectedNotifications,
};