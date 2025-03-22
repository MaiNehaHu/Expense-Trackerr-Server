const cron = require("node-cron");
const mongoose = require("mongoose");
const { checkAndAddRecuringTransactions } = require("../controllers/recuringTransactions");
const { autoDeleteOlderThanWeek } = require("../controllers/trash");
const User = require("../model/user");

// Connect to MongoDB (Ensure it's the same DB as your main app)
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("Cron Worker connected to DB"))
  .catch(err => console.error("DB Connection Error:", err));

console.log("Cron Worker Started...");

// Schedule cron jobs
cron.schedule("1 0 * * *", async () => {
    console.log("Starting daily cron job: Recurring transactions check & auto-delete...");

    try {
        const users = await User.find().select("userId settings.autoCleanTrash");

        for (const user of users) {
            const fakeReq = { params: { id: user.userId } };
            const fakeRes = {
                status: (code) => ({
                    json: (msg) => console.log(`User ${user.userId}:`, msg)
                })
            };

            await checkAndAddRecuringTransactions(fakeReq, fakeRes);

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
