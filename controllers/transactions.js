// Import models
const User = require("../model/user");
const Transaction = require("../model/transaction");

// Add a transaction
async function addTransaction(req, res) {
  const { id: userId } = req.params;
  const { amount, note, category, transactor, contactOfTransactor, image, reminder } = req.body;

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
      transactor,
      contactOfTransactor,
      image,
      reminder,
    });

    // Save the transaction
    const savedTransaction = await transaction.save();

    // Add the transaction to the user's transactions array
    user.transactions.push(savedTransaction);
    await user.save();

    res.status(201).json({ message: "Transaction added successfully", transaction: savedTransaction });
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

    res.status(200).json({ transactions: user.transactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching transactions", error });
  }
}

// Edit a transaction
async function editTransaction(req, res) {
  const { id: userId, transactionId } = req.params;
  const { amount, note, status, transactor, contactOfTransactor, image, reminder, category } = req.body;

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

    // Update transaction fields
    if (amount !== undefined) transaction.amount = amount;
    if (note !== undefined) transaction.note = note;
    if (status !== undefined) transaction.status = status;
    if (transactor !== undefined) transaction.transactor = transactor;
    if (contactOfTransactor !== undefined) transaction.contactOfTransactor = contactOfTransactor;
    if (image !== undefined) transaction.image = image;
    if (reminder !== undefined) transaction.reminder = reminder;
    if (category !== undefined) transaction.category = category;

    // Save the updated user data
    await user.save();

    // Respond with the updated transaction
    res.status(200).json({ message: "Transaction updated successfully", transaction });
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
    user.trash.push(removedTransaction);

    // Save the updated user data
    await user.save();

    // Respond with the deleted transaction details
    res.status(200).json({ message: "Transaction moved to trash", transaction: removedTransaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting transaction", error });
  }
}

module.exports = { addTransaction, getAllTransactions, editTransaction, deleteTransaction };
