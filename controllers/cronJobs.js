const cron = require("node-cron");
const { checkAndAddRecuringTransactions } = require("../controllers/recuringTransactions"); // Update the correct path
const User = require("../model/user");

// Schedule the cron job to run every day at 12:01 AM
cron.schedule("1 0 * * *", async () => {
    console.log("Running recurring transactions check...");

    try {
        const users = await User.find().select("_id");
        for (const user of users) {
            await checkAndAddRecuringTransactions({ params: { id: user._id } }, { status: () => ({ json: console.log }) });
        }
        console.log("Recurring transactions processed successfully.");
    } catch (error) {
        console.error("Error running cron job:", error);
    }
});

module.exports = cron;
