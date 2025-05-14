const { checkAndAddRecuringTransactions } = require("./recuringTransactions");
const { autoDeleteOlderThanWeek } = require("./trash");
const User = require("../model/user");
const connectDB = require("../db/connect");

const runCronJob = async (req, res) => {
    try {
        await connectDB(); // Ensure database connection

        console.log("Running scheduled job...");

        const users = await User.find().select("userId settings.autoCleanTrash");

        for (const user of users) {
            const fakeReq = { params: { id: user.userId } };
            const fakeRes = { status: () => ({ json: console.log }) };

            await checkAndAddRecuringTransactions(fakeReq, fakeRes);

            if (user.settings?.autoCleanTrash) {
                console.log(`User ${user.userId}: Deleting old transactions...`);
                await autoDeleteOlderThanWeek(fakeReq, fakeRes);
            }
        }

        res.status(200).json({ message: "Cron job executed successfully" });
        console.log({ message: "Cron job executed successfully" });
    } catch (error) {
        console.error("Cron job error:", error);
        res.status(500).json({ message: "Cron job not executed" });
        console.log({ message: "Error running cron job", error });
    }
};

module.exports = { runCronJob };
