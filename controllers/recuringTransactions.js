const RecuringTransaction = require("../model/recuringTransaction");
const Notification = require("../model/notification");
const User = require("../model/user");
const moment = require("moment");

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

    const newTransaction = new RecuringTransaction({
      recuring,
      amount,
      note,
      category,
      people,
      image,
      reminder,
      createdAt: new Date(),
    });

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

function getValidTransactionDate(year, month, day) {
  let selectedDate = moment(`${year}-${month}-${day}`, "YYYY-MM-DD");

  // If the date is invalid, adjust to the last day of the month
  if (selectedDate.date() !== day) {
    selectedDate = moment(`${year}-${month}-01`, "YYYY-MM-DD").endOf("month");
  }

  return selectedDate.format("YYYY-MM-DD");
}

const checkAndAddRecuringTransactions = async (req, res) => {
  const { id: userId } = req.params;

  try {
    const user = await User.findOne({ userId }).populate("recuringTransactions");

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    const currentDate = new Date();
    const today = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD
    const currentDayOfMonth = currentDate.getDate();
    const currentWeekName = currentDate.toLocaleDateString("en-US", { weekday: "long" });
    const currentMonth = currentDate.getMonth() + 1; // 0-based
    const currentYear = currentDate.getFullYear();

    let recurringAdded = false;

    for (const recuring of user.recuringTransactions) {
      const { recuring: { count, pushedCount, interval, when }, lastPushedAt } = recuring;

      // Skip if max push count reached
      if (count <= pushedCount) {
        console.log(`Skipping transaction ${recuring._id}: reached max count.`);
        continue;
      }

      // Skip if already pushed today
      if (lastPushedAt && new Date(lastPushedAt).toISOString().split("T")[0] === today) {
        console.log(`Skipping transaction ${recuring._id}: already pushed today.`);
        continue;
      }

      let shouldAdd = false;

      switch (interval) {
        // case "Everyday":
        //   shouldAdd = when.everyDay === currentTime;
        //   break;
        // Only push transactions at 12:01 AM
        case "Everyday":
          shouldAdd = true;
          break;
        case "Every week":
          shouldAdd = when.everyWeek === currentWeekName;
          break;
        case "Every month":
          const validDate = getValidTransactionDate(currentYear, currentMonth, when.everyMonth);
          shouldAdd = validDate === today;
          break;
        case "Every year":
          shouldAdd = when.everyYear?.month === currentMonth && when.everyYear?.date === currentDayOfMonth;
          break;
        default:
          console.log(`Unknown interval: ${interval}`);
          continue;
      }

      if (shouldAdd) {
        const newTransaction = {
          amount: recuring.amount,
          note: recuring.note,
          category: recuring.category,
          people: recuring.people,
          image: recuring.image,
          createdAt: new Date(),
          pushedIntoTransactions: true,
          _id: recuring._id, // Keep recurring _id reference
        };

        const notification = new Notification({
          header: "Recurring Transaction Added!",
          type: "Recurring",
          read: false,
          transaction: newTransaction,
        });

        // we are not doing notification.save because we don't want that to be in db.
        // Just to create a unique ID we are using it

        user.transactions.push(newTransaction);
        user.notifications.push(notification);
        recurringAdded = true;

        // Update pushedCount and lastPushedAt
        recuring.pushedCount = (recuring.pushedCount || 0) + 1;
        recuring.lastPushedAt = new Date();

        await RecuringTransaction.updateOne(
          { _id: recuring._id },
          { $inc: { "recuring.pushedCount": 1 }, $set: { lastPushedAt: new Date() } }
        );

        // Update the user's populated data
        const recuringIndex = user.recuringTransactions.findIndex(
          (rec) => rec._id.toString() === recuring._id.toString()
        );

        if (recuringIndex !== -1) {
          user.recuringTransactions[recuringIndex].recuring.pushedCount += 1;
          user.recuringTransactions[recuringIndex].lastPushedAt = new Date();
          user.markModified(`recuringTransactions.${recuringIndex}`);
        } else {
          console.error(`Recurring transaction ${recuring._id} not found in user's records.`);
        }

        console.log(`Transaction processed: pushedCount updated to ${recuring.pushedCount}`);
      }
    }

    await user.save();

    if (recurringAdded) {
      return res.status(200).json({ message: "Recurring Transactions Processed Successfully" });
    } else {
      return res.status(200).json({ message: "No Recurring Transactions Matched Conditions" });
    }
  } catch (error) {
    console.error("Error Processing Recurring Transactions:", error);
    return res.status(500).json({ message: "Error Processing Recurring Transactions", error });
  }
};

module.exports = {
  checkAndAddRecuringTransactions,
  getAllRecuringTransactions,
  addRecuringTransactions,
  deleteRecuringTransaction,
  editRecuringTransactions,
};
