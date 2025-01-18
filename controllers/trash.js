const User = require("../model/user");

async function getAllTrashs(req, res) {
  const { id: userId } = req.params;

  try {
    // Find the user by userId
    const user = await User.findOne({ userId }).populate("trash");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Respond with the trash array
    res.status(200).json(user.trash);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving trash", error });
  }
}

async function deleteTrash(req, res) {
  const { id: userId } = req.params;
  const { trashTransactionId } = req.body;

  try {
    // Find the user by userId
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the transaction exists in the trash
    const trashIndex = user.trash.findIndex((txn) => txn._id.toString() === trashTransactionId);
    if (trashIndex === -1) {
      return res.status(404).json({ message: "Transaction not found in trash" });
    }

    // Remove the transaction
    user.trash.splice(trashIndex, 1);

    // Save the updated user data
    await user.save();

    // Respond with success message
    res.status(200).json({ message: "Transaction deleted from trash successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting transaction from trash", error });
  }
}


async function emptyTrash(req, res) {
  const { id: userId } = req.params;

  try {
    // Find the user by userId
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Clear the trash array
    user.trash = [];

    // Save the updated user data
    await user.save();

    res.status(200).json({ message: "Trash emptied successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error emptying trash", error });
  }
}

module.exports = { getAllTrashs, deleteTrash, emptyTrash };
