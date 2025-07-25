const connectDB = require("../db/connect");
const User = require("../model/user");

const cronTodedupeRecurring = async (req, res) => {
  try {
    await connectDB();
    console.log("MongoDB connected. Starting transaction deduplication...");

    const users = await User.find({}, { _id: 1, email: 1, transactions: 1 });

    for (const user of users) {
      const seen = new Map(); // key: `${reference_id}_${date}`, value: one transaction
      const deduped = [];
      const removed = [];

      for (const txn of user.transactions || []) {
        const ref = txn.reference_id;
        if (!ref) {
          deduped.push(txn); // skip ones without reference_id
          continue;
        }

        const dateStr = new Date(txn.createdAt).toISOString().slice(0, 10); // YYYY-MM-DD
        const key = `${ref}_${dateStr}`;

        if (!seen.has(key)) {
          seen.set(key, txn);
          deduped.push(txn); // keep first
        } else {
          removed.push(txn._id); // remove duplicates
        }
      }

      if (removed.length > 0) {
        await User.updateOne(
          { _id: user._id },
          { $set: { transactions: deduped } }
        );
        console.log(`User ${user.email}: removed ${removed.length} duplicate transactions`);
      } else {
        console.log(`User ${user.email}: no duplicates`);
      }
    }

    console.log("Transaction deduplication complete.");
    return res.status(200).json({ message: "Transaction deduplication complete" });

  } catch (error) {
    console.error("Error during deduplication:", error);
    return res.status(500).json({ message: "Deduplication failed", error });
  }
};

module.exports = { cronTodedupeRecurring };
