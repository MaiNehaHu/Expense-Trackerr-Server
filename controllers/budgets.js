const User = require('../model/user')
const Budget = require('../model/budget')

const getAllBudgets = async (req, res) => {
    const { id: userId } = req.params;

    try {
        const user = await User.findOne({ userId }).populate("budgets");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user.budgets);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Error Getting Budgets: ", error });
    }
}

const addBudget = async (req, res) => {
    const { id: userId } = req.params;
    const { type, period, totalBudget, totalSpent, categories } = req.body

    try {
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Create new budget
        const newBudget = new Budget({ type, period, totalBudget, totalSpent, categories });
        const savedBudget = await newBudget.save();

        // Add budget to user's budgets
        user.budgets.push(savedBudget);
        await user.save();

        res.status(201).json({ message: "Budget added successfully", budget: savedBudget });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Error Adding Budgets: ", error });
    }
}

const deleteBudget = async (req, res) => {
    const { id: userId, budgetId } = req.params;

    try {
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Filter out the budget from the user's categories array
        const initialLength = user.budgets.length;
        user.budgets = user.budgets.filter((bud) => bud._id.toString() !== budgetId);

        if (user.budgets.length === initialLength) {
            return res.status(404).json({ message: "Budget not found in user's budgets" });
        }

        // Mark the `budgets` array as modified and save the user document
        user.markModified(`budgets.${budgetId}`);
        await user.save();

        // Delete the budget from the `Budget` collection
        const deletedBudget = await Budget.findByIdAndDelete(budgetId);
        if (!deletedBudget) {
            return res.status(404).json({ message: "Budget not found in the database" });
        }

        res.status(200).json({ message: "Budget deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Error Deleting Budget: ", error });
    }
}

module.exports = { getAllBudgets, addBudget, deleteBudget }