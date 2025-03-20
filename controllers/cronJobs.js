const cron = require("node-cron");
const { checkAndAddRecuringTransactions } = require("../controllers/recuringTransactions"); // Update the correct path
const { autoDeleteOlderThanWeek } = require("../controllers/trash");
const User = require("../model/user");

// Schedule the cron job to run every day at 12:01 AM (Update the time format if needed)
cron.schedule("1 0 * * *", async () => {
    console.log("Starting daily cron job: Recurring transactions check & auto-delete...");

    try {
        // Fetch only users with autoCleanTrash enabled
        const users = await User.find().select("userId settings.autoCleanTrash");

        for (const user of users) {
            const fakeReq = { params: { id: user.userId } };
            const fakeRes = {
                status: (code) => ({
                    json: (msg) => console.log(`User ${user.userId}:`, msg)
                })
            };

            // Always run recurring transactions
            await checkAndAddRecuringTransactions(fakeReq, fakeRes);

            // Only delete trash if autoCleanTrash is enabled
            if (user.settings?.autoCleanTrash) {
                console.log(`User ${user.userId}: autoCleanTrash is ON. Deleting old transactions...`);
                await autoDeleteOlderThanWeek(fakeReq, fakeRes);
            } else {
                console.log(`User ${user.userId}: autoCleanTrash is OFF. Skipping deletion.`);
            }
        }

        console.log("Daily cron job completed successfully.");
    } catch (error) {
        console.error("Error running daily cron job:", error);
    }
});

module.exports = cron;
