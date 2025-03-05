// Import models
const User = require("../model/user");
const Transaction = require("../model/transaction");


// Add a transaction
async function addTransaction(req, res) {
  const { id: userId } = req.params;
  const { amount, note, category, people, image, reminder } = req.body;

  try {
    // Find the user by userId
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create a new transaction
    const transaction = new Transaction({
      amount,
      note,
      category,
      people,
      image,
      reminder,
    });

    // Save the transaction
    const savedTransaction = await transaction.save();

    // Add the transaction to the user's transactions array
    user.transactions.push(savedTransaction);

    await user.save();

    res.status(201).json({
      message: "Transaction added successfully",
      transaction: savedTransaction,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding transaction", error });
  }
}

// Get all transactions for a user
async function getAllTransactions(req, res) {
  const { id: userId } = req.params;

  try {
    // Find user by userId and populate transactions
    const user = await User.findOne({ userId }).populate("transactions");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching transactions", error });
  }
}

// Edit a transaction
async function editTransaction(req, res) {
  const { id: userId, transactionId } = req.params;
  const { amount, note, status, people, image, category, createdAt, pushedIntoTransactions } = req.body;

  try {
    // Find the user by userId
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Locate the transaction in the user's transactions
    const transaction = user.transactions.find((txn) => txn._id.toString() === transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found in user's records" });
    }

    // Update transaction fields in the user's transactions
    if (amount !== undefined) transaction.amount = amount;
    if (note !== undefined) transaction.note = note;
    if (status !== undefined) transaction.status = status;
    if (people !== undefined) transaction.people = people;
    if (image !== undefined) transaction.image = image;
    if (category !== undefined) transaction.category = category;
    if (createdAt !== undefined) transaction.createdAt = createdAt;
    if (pushedIntoTransactions !== undefined) transaction.pushedIntoTransactions = pushedIntoTransactions;

    // Mark the transactions field as modified
    user.markModified("transactions");

    // Save the updated user data
    await user.save();

    // If "pushedIntoTransactions" is present, skip updating the Transaction model
    if (pushedIntoTransactions !== undefined) {
      return res.status(200).json({
        message: "Transaction updated successfully in User model (Reminder update only)",
        transaction
      });
    }

    // Update the transaction in the Transaction model
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      transactionId,
      {
        $set: {
          amount, note, status, people, image, category,
        },
      },
      { new: true } // Return the updated document
    );

    if (!updatedTransaction && pushedIntoTransactions == undefined) {
      return res.status(404).json({ message: "Transaction not found in the Transaction model" });
    }

    // Respond with the updated transaction
    res.status(200).json({ message: "Transaction updated successfully", transaction: updatedTransaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating transaction", error });
  }
}


// Delete a transaction (move to trash)
async function deleteTransaction(req, res) {
  const { id: userId, transactionId } = req.params;

  try {
    // Find the user by userId
    const user = await User.findOne({ userId }).populate("transactions");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Locate the transaction in the user's transactions
    const transactionIndex = user.transactions.findIndex(
      (txn) => txn._id.toString() === transactionId
    );
    if (transactionIndex === -1) {
      return res.status(404).json({ message: "Transaction not found in user's records" });
    }

    // Remove the transaction from the transactions array
    const [removedTransaction] = user.transactions.splice(transactionIndex, 1);

    // Add the entire transaction object to the trash array
    user.trash = user.trash || [];

    // Convert to plain object if using Mongoose
    user.trash.push({ ...removedTransaction, deletedAt: new Date().toISOString() });

    // Save the updated user data
    await user.save();

    // Respond with the deleted transaction details
    res.status(200).json({ message: "Transaction moved to trash", transaction: removedTransaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting transaction", error });
  }
}

const checkAndPushReminder = async (req, res) => {
  const { id: userId } = req.params;

  try {
    const user = await User.findOne({ userId }).populate("recuringTransactions");
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    const currentDate = new Date();

    // Calculate the date for two days from today
    const twoDaysLater = new Date();
    twoDaysLater.setDate(currentDate.getDate() + 2);

    let notificationAdded = false;

    for (const reminderTransaction of user.transactions) {
      const { reminded, reminder } = reminderTransaction;

      if (!reminder || reminded) {
        console.log("Skipping transaction with no reminder or already reminded.");
        continue; // Skip this transaction
      }

      const reminderDate = new Date(reminder);

      // Check if the `reminder` matches two days after today
      const isTwoDaysLater =
        reminderDate.getFullYear() === twoDaysLater.getFullYear() &&
        reminderDate.getMonth() === twoDaysLater.getMonth() &&
        reminderDate.getDate() === twoDaysLater.getDate();

      const isToday =
        reminderDate.getFullYear() === currentDate.getFullYear() &&
        reminderDate.getMonth() === currentDate.getMonth() &&
        reminderDate.getDate() === currentDate.getDate();

      if (isTwoDaysLater || isToday) {
        const notification = {
          header: "Reminder For You!!",
          type: "Reminder",
          read: false,
          transaction: reminderTransaction,
        };

        if (!reminded) {
          user.notifications.push(notification);

          const transactionIndex = user.transactions.findIndex(
            (rem) => rem._id.toString() === reminderTransaction._id.toString()
          );

          if (transactionIndex !== -1) {
            // Ensure the `transaction` property exists before modifying
            user.transactions[transactionIndex].reminded = true;

            user.markModified(`transactions.${transactionIndex}`);
            notificationAdded = true;
          } else {
            console.error(`Reminder transaction with ID: ${reminderTransaction._id} not found in user's transactions.`);
          }
        }
      }
    }

    if (notificationAdded) {
      await user.save();
      console.log("Reminders processed and saved successfully.");
    }

    if (notificationAdded) {
      res.status(200).json({ message: "Reminders processed successfully" });
    } else {
      res.status(200).json({ message: "No reminders matched the condition." });
    }
  } catch (error) {
    console.error("Error checking and pushing reminders:", error);
    res.status(500).json({ message: "Error processing reminders", error });
  }
};

module.exports = {
  addTransaction,
  getAllTransactions,
  editTransaction,
  deleteTransaction,
  checkAndPushReminder
};
