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
    // Find user by userId and populate recuring transactions
    const user = await User.findOne({ userId }).populate(
      "recuringTransactions"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create a new transaction
    const transaction = new RecuringTransaction({
      recuring,
      amount,
      note,
      category,
      people,
      image,
      reminder,
    });

    // Save the transaction
    const savedTransaction = await transaction.save();

    // Add to user's Recuring Transactions array
    user.recuringTransactions.push(savedTransaction);
    await user.save();

    res.status(201).json({
      message: "Recuring Transaction added successfully",
      transaction: savedTransaction,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error Adding Recuring Transaction", error });
  }
}

async function deleteRecuringTransaction(req, res) {
  const { id: userId, recuringtransactionId } = req.params;

  try {
    const user = await User.findOne({ userId })
      .populate("recuringTransactions")
      .populate("transactions");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const recuringTransactionIndex = user.recuringTransactions.findIndex(
      (transaction) => transaction._id.toString() === recuringtransactionId
    );
    if (recuringTransactionIndex === -1) {
      return res
        .status(404)
        .json({ message: "Recuring transaction not found" });
    }

    // Remove from the user's recuringTransactions array
    user.recuringTransactions.splice(recuringTransactionIndex, 1);

    // Save the updated user
    await user.save();

    // Delete the recuring transaction from the RecuringTransaction model
    await RecuringTransaction.findByIdAndDelete(recuringtransactionId);

    res
      .status(200)
      .json({ message: "Recuring Transaction deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error Deleting Recuring Transaction", error });
  }
}

async function editRecuringTransactions(req, res) {
  const { id: userId, recuringtransactionId } = req.params;
  const {
    recuring,
    amount,
    note,
    status,
    people,
    image,
    reminder,
    category,
  } = req.body;

  try {
    // Fetch the user document
    const user = await User.findOne({ userId })
      .populate("recuringTransactions")
      .populate("transactions");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the recurring transaction in the user's records
    const transactionIndex = user.recuringTransactions.findIndex(
      (txn) => txn._id.toString() === recuringtransactionId
    );

    if (transactionIndex === -1) {
      return res
        .status(404)
        .json({ message: "Recurring Transaction not found in user's records" });
    }

    // Get the recurring transaction from the user's transactions
    const recuringTransaction = user.recuringTransactions[transactionIndex];

    // Update fields in the `RecuringTransaction` document
    const updatedFields = {};
    if (recuring !== undefined) updatedFields.recuring = recuring;
    if (amount !== undefined) updatedFields.amount = amount;
    if (note !== undefined) updatedFields.note = note;
    if (status !== undefined) updatedFields.status = status;
    if (image !== undefined) updatedFields.image = image;
    if (reminder !== undefined) updatedFields.reminder = reminder;
    if (category !== undefined) updatedFields.category = category;
    if (people !== undefined) updatedFields.people = people;

    // Update the transaction in the `RecuringTransaction` database
    const updatedTransaction = await RecuringTransaction.findByIdAndUpdate(
      recuringtransactionId,
      { $set: updatedFields },
      { new: true }
    );

    if (!updatedTransaction) {
      return res
        .status(404)
        .json({ message: "Recurring Transaction not found in the database" });
    }

    // Update the transaction in the user's document
    Object.assign(recuringTransaction, updatedFields);
    user.markModified(`recuringTransactions.${transactionIndex}`);

    // Save the user document
    await user.save();

    res.status(200).json({
      message: "Recurring Transaction updated successfully",
      updatedTransaction,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error Editing Recurring Transaction", error });
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
    const today = currentDate.toISOString().split("T")[0]; // Get YYYY-MM-DD format
    const currentDayOfMonth = currentDate.getDate();
    const currentTime = currentDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    const currentWeekName = currentDate.toLocaleDateString("en-US", { weekday: "long" });
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based
    const currentYear = currentDate.getFullYear();
    let recurringAdded = false;

    for (const recuring of user.recuringTransactions) {
      const { recuring: { count, pushedCount, interval, when }, lastPushedAt } = recuring;

      if (count <= pushedCount) {
        console.log(`Skipping transaction ${recuring._id}: reached max count.`);
        continue;
      }

      if (lastPushedAt) {
        const lastPushedDate = new Date(lastPushedAt).toISOString().split("T")[0];
        if (lastPushedDate === today) {
          console.log(`Skipping transaction ${recuring._id}: already pushed today.`);
          continue; // Skip if already added today
        }
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
          // Handle invalid dates (e.g., Feb 30, April 31)
          const validTransactionDate = getValidTransactionDate(currentYear, currentMonth, when.everyMonth);
          shouldAdd = validTransactionDate === today;
          break;
        case "Every year":
          shouldAdd = when.everyYear?.month == currentMonth && when.everyYear?.date == currentDayOfMonth;
          break;
        default:
          console.log(`Unknown interval: ${interval}`);
          continue;
      }

      if (shouldAdd) {
        const transaction = {
          amount: recuring.amount,
          note: recuring.note,
          category: recuring.category,
          people: recuring.people,
          image: recuring.image,
          status: "Done",
          createdAt: new Date(),
          pushedIntoTransactions: true,
          _id: recuring._id,
        };

        const notification = new Notification({
          header: "Recurring Transaction Added!",
          type: "Recurring",
          read: false,
          transaction,
        });

        user.transactions.push(transaction);
        user.notifications.push(notification);
        recurringAdded = true;

        // Increment pushedCount and update lastPushedAt
        recuring.pushedCount = (recuring.pushedCount || 0) + 1;
        recuring.lastPushedAt = new Date();

        await RecuringTransaction.updateOne(
          { _id: recuring._id },
          { $inc: { "recuring.pushedCount": 1 }, $set: { lastPushedAt: new Date() } }
        );

        // Update user's local recurring transactions
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
