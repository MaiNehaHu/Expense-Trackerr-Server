const { checkAndAddRecuringTransactions } = require("../controllers/recuringTransactions");
const { autoDeleteOlderThanWeek } = require("../controllers/trash");
const User = require("../model/user");
const connectDB = require("../db/connect");

const runCronJob = async () => {
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

        return { message: "Cron job executed successfully" };
    } catch (error) {
        console.error("Cron job error:", error);
        return { message: "Error running cron job", error };
    }
};

module.exports = { runCronJob };
