const User = require("../model/user");
const moment = require("moment");
const mongoose = require('mongoose');

async function getAllRecuringTransactions(req, res) {
  const { id: userId } = req.params;

  try {
    // Find user by userId and populate recuring transactions
    const user = await User.findOne({ userId }).populate(
      "recuringTransactions"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.recuringTransactions);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error getting recuring transaction", error });
  }
}

async function addRecuringTransactions(req, res) {
  const { id: userId } = req.params;
  const {
    recuring,
    amount,
    note,
    category,
    people,
    image,
    reminder,
  } = req.body;

  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const newTransaction = {
      recuring,
      amount,
      note,
      category,
      people,
      image,
      reminder,
      createdAt: new Date(),
      _id: new mongoose.Types.ObjectId(),
    };

    user.recuringTransactions.push(newTransaction);
    user.markModified("recuringTransactions");
    await user.save();

    res.status(201).json({
      message: "Recurring transaction added successfully",
      transaction: newTransaction,
    });
  } catch (error) {
    console.error("Error adding recurring transaction:", error);
    res.status(500).json({ message: "Error adding recurring transaction", error });
  }
}

async function deleteRecuringTransaction(req, res) {
  const { id: userId, recuringtransactionId } = req.params;

  try {
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const index = user.recuringTransactions.findIndex(
      (txn) => txn._id.toString() === recuringtransactionId
    );

    if (index === -1) {
      return res.status(404).json({ message: "Recurring transaction not found" });
    }

    user.recuringTransactions.splice(index, 1);
    user.markModified("recuringTransactions");
    await user.save();

    res.status(200).json({ message: "Recurring transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting recurring transaction:", error);
    res.status(500).json({ message: "Error deleting recurring transaction", error });
  }
}

async function editRecuringTransactions(req, res) {
  const { id: userId, recuringtransactionId } = req.params;
  const {
    recuring,
    amount,
    note,
    people,
    image,
    reminder,
    category,
  } = req.body;

  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const index = user.recuringTransactions.findIndex(
      (txn) => txn._id.toString() === recuringtransactionId
    );

    if (index === -1) {
      return res.status(404).json({
        message: "Recurring transaction not found",
      });
    }

    const transaction = user.recuringTransactions[index];

    if (recuring !== undefined) transaction.recuring = recuring;
    if (amount !== undefined) transaction.amount = amount;
    if (note !== undefined) transaction.note = note;
    if (image !== undefined) transaction.image = image;
    if (reminder !== undefined) transaction.reminder = reminder;
    if (category !== undefined) transaction.category = category;
    if (people !== undefined) transaction.people = people;

    user.markModified(`recuringTransactions.${index}`);
    await user.save();

    res.status(200).json({
      message: "Recurring transaction updated successfully",
      transaction,
    });
  } catch (error) {
    console.error("Error editing recurring transaction:", error);
    res.status(500).json({
      message: "Error editing recurring transaction",
      error,
    });
  }
}

const checkAndAddRecuringTransactions = async (req, res) => {
  const { id: userId } = req.params;

  try {
    const user = await User.findOne({ userId }).lean();

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    const today = moment().startOf("day");
    const currentWeekday = today.format("dddd");
    const currentMonth = today.month() + 1;
    // const currentYear = today.year();
    const currentDay = today.date();

    let recurringAdded = false;

    for (const recurring of user.recuringTransactions || []) {
      const { _id, recuring: meta, lastPushedAt } = recurring;
      if (!meta) continue;

      const { count, pushedCount, interval, when } = meta;

      // Skip if max count reached
      if (pushedCount >= count) continue;

      // Skip if already pushed today
      if (lastPushedAt && moment(lastPushedAt).isSame(today, "day")) continue;

      let shouldAdd = false;

      switch (interval) {
        case "Everyday":
          shouldAdd = true;
          break;

        case "Every week":
          shouldAdd = when?.everyWeek === currentWeekday;
          break;

        case "Every month":
          shouldAdd = currentDay === when?.everyMonth;
          break;

        case "Every year":
          shouldAdd =
            when?.everyYear?.month === currentMonth &&
            when?.everyYear?.date === currentDay;
          break;

        default:
          console.log(`Unknown interval type: ${interval}`);
          continue;
      }

      if (!shouldAdd) continue;

      const txnId = new mongoose.Types.ObjectId();
      const transactionPayload = {
        _id: txnId,
        amount: recurring.amount,
        note: recurring.note,
        category: recurring.category,
        people: recurring.people,
        createdAt: new Date(),
        reference_id: _id,
      };

      const notificationPayload = {
        _id: new mongoose.Types.ObjectId(),
        header: "Recurring Transaction Added!",
        type: "Recurring",
        read: false,
        transaction: transactionPayload,
      };

      const result = await User.findOneAndUpdate(
        {
          userId,
          "recuringTransactions._id": _id,
          "recuringTransactions.recuring.pushedCount": { $lt: count },
          $or: [
            { "recuringTransactions.lastPushedAt": { $exists: false } },
            { "recuringTransactions.lastPushedAt": { $lt: today.toDate() } }
          ]
        },
        {
          $inc: { "recuringTransactions.$.recuring.pushedCount": 1 },
          $set: { "recuringTransactions.$.lastPushedAt": new Date() },
          $push: {
            transactions: transactionPayload,
            notifications: notificationPayload
          }
        },
        { new: true }
      );

      if (result) {
        console.log(`Recurring transaction ${_id} pushed.`);
        recurringAdded = true;
      } else {
        console.log(`Skipped transaction ${_id}: may have been pushed already today.`);
      }
    }

    return res.status(200).json({
      message: recurringAdded
        ? "Recurring Transactions Processed Successfully"
        : "No Recurring Transactions Matched Conditions",
    });

  } catch (error) {
    console.error("Error processing recurring transactions:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

const deleteSelectedRecurrings = async (req, res) => {
  const { id: userId } = req.params;
  const { recurringIds } = req.body;

  try {
    if (!Array.isArray(recurringIds) || recurringIds.length === 0) {
      return res.status(400).json({ message: "No recurrings IDs provided" });
    }

    const validIds = [...new Set(recurringIds.filter(id => typeof id === 'string' && id.length > 0))];
    if (validIds.length === 0) {
      return res.status(400).json({ message: "No valid recurrings IDs provided" });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const deletedIds = [];
    const skippedIds = [];

    user.recuringTransactions = (user.recuringTransactions || []).filter(recurr => {
      const id = recurr._id?.toString();
      if (id && validIds.includes(id)) {
        deletedIds.push(id);
        return false; // Remove this
      }
      return true; // Keep it
    });

    user.markModified("recurrings");
    await user.save();

    skippedIds.push(...validIds.filter(id => !deletedIds.includes(id)));

    res.status(200).json({
      message: "Selected recurrings deleted successfully",
      deleted: deletedIds,
      skipped: skippedIds,
    });
  } catch (error) {
    console.error("Error deleting recurrings:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

module.exports = {
  checkAndAddRecuringTransactions,
  getAllRecuringTransactions,
  addRecuringTransactions,
  deleteRecuringTransaction,
  editRecuringTransactions,
  deleteSelectedRecurrings
};
