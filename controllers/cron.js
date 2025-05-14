const { checkAndAddRecuringTransactions } = require("./recuringTransactions");
const { autoDeleteOlderThanWeek } = require("./trash");
const User = require("../model/user");
const connectDB = require("../db/connect");

const runCronJob = async (req, res) => {
    try {
        await connectDB();
        console.log("Running scheduled cron job...");

        const users = await User.find().select("userId settings.autoCleanTrash");

        for (const user of users) {
            const fakeReq = { params: { id: user.userId } };
            const fakeRes = {
                status: () => ({
                    json: (data) =>
                        console.log(`User ${user.userId}:`, data?.message || data),
                }),
            };

            await checkAndAddRecuringTransactions(fakeReq, fakeRes);

            if (user.settings?.autoCleanTrash) {
                console.log(`User ${user.userId}: Deleting old trash...`);
                await autoDeleteOlderThanWeek(fakeReq, fakeRes);
            }
        }

        if (res) {
            return res.status(200).json({ message: "Cron job executed successfully" });
        } else {
            console.log("Cron job executed successfully");
            return { message: "Cron job executed successfully" };
        }
    } catch (error) {
        console.error("Cron job error:", error);

        if (res) {
            return res.status(500).json({
                message: "Cron job failed",
                error: error.message || error,
            });
        } else {
            return { message: "Cron job failed", error: error.message || error };
        }
    }
};

module.exports = { runCronJob };
