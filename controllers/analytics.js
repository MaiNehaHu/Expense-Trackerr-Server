const User = require("../model/user");

const getAnalytics = async (req, res) => {
  const { id: userId } = req.params;

  try {
    // Find user by userId and populate transactions
    const user = await User.findOne({ userId }).populate("transactions");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get current date in IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30 in milliseconds
    const currentIST = new Date(now.getTime() + istOffset);
    const currentMonthIST = currentIST.getMonth();
    const currentYearIST = currentIST.getFullYear();

    // Filter transactions for the current month (in IST)
    const transactionsThisMonth = user.transactions.filter((transaction) => {
      const transactionDateUTC = new Date(transaction.createdAt);
      const transactionIST = new Date(transactionDateUTC.getTime() + istOffset);

      return (
        transactionIST.getMonth() === currentMonthIST &&
        transactionIST.getFullYear() === currentYearIST
      );
    });

    // Calculate total spent and earned
    let totalSpent = 0;
    let totalEarned = 0;

    transactionsThisMonth.forEach((transaction) => {
      if (transaction.category.sign === "-") {
        totalSpent += transaction.amount;
      } else if (transaction.category.sign === "+") {
        totalEarned += transaction.amount;
      }
    });

    res.status(200).json({
      totalSpent,
      totalEarned,
      totalAmount: totalEarned + totalSpent,
      balance: totalEarned - totalSpent,
    });
  } catch (error) {
    res.status(500).json({ message: "Error getting analytics", error });
  }
};

module.exports = { getAnalytics };
