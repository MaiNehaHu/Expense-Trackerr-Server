const { checkAndaddRecuring } = require("./recurings");
const { autoDeleteOlderThanWeek } = require("./trash");
const User = require("../model/user");
const connectDB = require("../db/connect");

const runCronJob = async (req, res) => {
    try {
        await connectDB();
        console.log("MongoDB connected, running scheduled cron job...");

        const users = await User.find().select("userId settings.autoCleanTrash");

        for (const user of users) {
            const fakeReq = { params: { id: user.userId } };

            const fakeRes = {
                status: (code) => ({
                    json: (data) =>
                        console.log(
                            `User ${user.name} with _id ${user.userId} [${code}]:`,
                            data?.message || data
                        ),
                }),
            };

            try {
                await checkAndaddRecuring(fakeReq, fakeRes);
                console.log(`Processed recurring for ${user.name} with _id ${user.userId}`);
            } catch (err) {
                console.error(`Error processing recurring for ${user.name} with _id ${user.userId}:`, err);
            }

            if (user.settings?.autoCleanTrash) {
                try {
                    console.log(`User ${user.name} with _id ${user.userId}: Deleting old trash...`);
                    await autoDeleteOlderThanWeek(fakeReq, fakeRes);
                } catch (err) {
                    console.error(`Error cleaning trash for ${user.name} with _id ${user.userId}:`, err);
                }
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
