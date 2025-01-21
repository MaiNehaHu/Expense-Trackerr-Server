const RecuringTransaction = require('../model/recuringTransactions');
const User = require('../model/user');

async function getAllRecuringTransactions(req, res) {
    const { id: userId } = req.params;

    try {
        // Find user by userId and populate recuring transactions
        const user = await User.findOne({ userId }).populate("recuringTransactions");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ transactions: user.recuringTransactions });
    } catch (error) {
        res.status(500).json({ message: "Error getting recuring transaction", error });
    }
}

async function addRecuringTransactions(req, res) {
    const { id: userId } = req.params;
    const { recuring, amount, note, category, transactor, contactOfTransactor, image, reminder } = req.body;

    try {
        // Find user by userId and populate recuring transactions
        const user = await User.findOne({ userId }).populate("recuringTransactions");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Create a new transaction
        const transaction = new RecuringTransaction({
            recuring,
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

        // Add to user's Recuring Transactions array
        user.recuringTransactions.push(savedTransaction);
        await user.save();

        res.status(201).json({ message: "Recuring Transaction added successfully", transaction: savedTransaction });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error Adding Recuring Transaction", error });
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
            return res.status(404).json({ message: "Recuring transaction not found" });
        }

        // Remove from the user's recuringTransactions array
        user.recuringTransactions.splice(recuringTransactionIndex, 1);

        // Save the updated user
        await user.save();

        // Delete the recuring transaction from the RecuringTransaction model
        await RecuringTransaction.findByIdAndDelete(recuringtransactionId);

        res.status(200).json({ message: "Recuring Transaction deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error Deleting Recuring Transaction", error });
    }
}

async function editRecuringTransactions(req, res) {
    const { id: userId, recuringtransactionId } = req.params;
    const { recuring, amount, note, status, transactor, contactOfTransactor, image, reminder, category } = req.body;

    try {
        // Fetch the user document
        const user = await User.findOne({ userId })
            .populate("recuringTransactions")
            .populate("transactions");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find the index of the recurring transaction in the user's transactions
        const transactionIndex = user.recuringTransactions.findIndex((txn) => txn._id.toString() === recuringtransactionId);
        if (transactionIndex === -1) {
            return res.status(404).json({ message: "Recurring Transaction not found in user's records" });
        }

        // Update the fields for the recurring transaction
        const recuringTransactions = user.recuringTransactions[transactionIndex];

        if (recuring !== undefined) recuringTransactions.recuring = recuring;
        if (amount !== undefined) recuringTransactions.amount = amount;
        if (note !== undefined) recuringTransactions.note = note;
        if (status !== undefined) recuringTransactions.status = status;
        if (transactor !== undefined) recuringTransactions.transactor = transactor;
        if (contactOfTransactor !== undefined) recuringTransactions.contactOfTransactor = contactOfTransactor;
        if (image !== undefined) recuringTransactions.image = image;
        if (reminder !== undefined) recuringTransactions.reminder = reminder;
        if (category !== undefined) recuringTransactions.category = category;

        // Mark the transactions array as modified to notify Mongoose
        user.markModified(`recuringTransactions.${transactionIndex}`);

        // Save the updated user document
        await user.save();

        res.status(200).json({ message: "Recurring Transaction updated successfully", recuringTransactions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error Editing Recurring Transaction", error });
    }
}

const checkAndAddRecuringTransactions = async (req, res) => {
    const { id: userId } = req.params;

    try {
        const user = await User.findOne({ userId }).populate("recuringTransactions");
        if (!user) {
            console.log("User not found");
            res.status(404).json({ message: "User not found" });
            return;
        }

        const currentDate = new Date();
        const currentDayOfMonth = currentDate.getDate();
        const currentTime = currentDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
        const currentWeekName = currentDate.toLocaleDateString("en-US", { weekday: "long" });
        const currentMonthName = currentDate.toLocaleDateString("en-US", { month: "long" });

        for (const recuring of user.recuringTransactions) {
            const { recuring: { count, pushedCount, interval, when } } = recuring;

            if (count <= 0) {
                console.log("Recurring transaction has a count of 0 and cannot be processed.");
                continue; // Skip this transaction
            }

            let shouldAdd = false;

            switch (interval) {
                case "Everyday":
                    shouldAdd = when.everyDay === currentTime;
                    console.log(when.everyDay, currentTime);
                    break;
                case "Every week":
                    shouldAdd = when.everyWeek === currentWeekName;
                    console.log(when.everyWeek, currentWeekName);
                    break;
                case "Every month":
                    shouldAdd = when.everyMonth === currentDayOfMonth;
                    console.log(when.everyMonth, currentDayOfMonth);
                    break;
                case "Every year":
                    shouldAdd =
                        when.everyYear.month === currentMonthName &&
                        when.everyYear.date === currentDayOfMonth;
                    console.log(when.everyYear.month, currentMonthName, when.everyYear.date, currentDayOfMonth);
                    break;
            }

            if (shouldAdd) {
                const transaction = {
                    amount: recuring.amount,
                    note: recuring.note,
                    category: recuring.category,
                    transactor: recuring.transactor,
                    contactOfTransactor: recuring.contactOfTransactor,
                    image: recuring.image,
                    status: "Pending",
                    createdAt: new Date(),
                    _id: recuring._id,
                };

                if (count >= 1 && count > pushedCount) {
                    user.transactions.push(transaction);
                
                    // Ensure `pushedCount` is a valid number
                    recuring.pushedCount = recuring.pushedCount || 0;
                
                    const result = await RecuringTransaction.updateOne(
                        { _id: recuring._id },
                        { $inc: { "recuring.pushedCount": 1 } } 
                        // Use `$inc` to increment the field
                    );
                
                    // Update the `recuringTransactions` array in `user`
                    const recuringIndex = user.recuringTransactions.findIndex(
                        (rec) => rec._id.toString() === recuring._id.toString()
                    );
                
                    if (recuringIndex !== -1) {
                        user.recuringTransactions[recuringIndex].recuring.pushedCount += 1;
                
                        user.markModified(`recuringTransactions.${recuringIndex}`);
                    } else {
                        console.error(`Recurring transaction with ID: ${recuring._id} not found in user's recuringTransactions.`);
                    }
                
                    // Save the `user` document
                    await user.save();
                
                    if (result.modifiedCount > 0) {
                        console.log(`Transaction pushed and pushedCount incremented to: ${recuring.pushedCount + 1}`);
                    } else {
                        console.error("Failed to update pushedCount for recurring transaction.");
                    }
                } else {
                    console.log(`pushedCount:${pushedCount} matches count:${count}`);
                }                
            }
        }

        // save
        await user.save();

        // Send Success Response
        res.status(200).json({ message: "Recurring Transactions Processed Successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error Processing Recurring Transactions", error });
    }
};

module.exports = { checkAndAddRecuringTransactions, getAllRecuringTransactions, addRecuringTransactions, deleteRecuringTransaction, editRecuringTransactions }