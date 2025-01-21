const Notification = require('../model/notification')
const User = require('../model/user')

const getAllNotifications = async (req, res) => {
    const { id: userId } = req.params;

    try {
        const user = await User.findOne({ userId }).populate("notifications");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ notifications: user.notifications });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Error Getting Notifications: ", error });
    }
}

module.exports = { getAllNotifications }