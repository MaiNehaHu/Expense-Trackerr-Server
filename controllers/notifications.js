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

module.exports = { getAllNotifications, getTodayNotifications, getMonthNotifications }