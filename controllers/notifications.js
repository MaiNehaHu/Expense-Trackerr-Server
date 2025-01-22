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

module.exports = { getAllNotifications, getTodayNotifications }