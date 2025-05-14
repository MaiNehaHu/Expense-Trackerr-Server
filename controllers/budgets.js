const User = require('../model/user')
const Budget = require('../model/budget')

const getAllBudgets = async (req, res) => {
    const { id: userId } = req.params;

    try {
        const user = await User.findOne({ userId }).populate("budgets");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user.budgets || []);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Error getting budgets", error });
    }
};

const addBudget = async (req, res) => {
    const { id: userId } = req.params;
    const { type, period, totalBudget, totalSpent, categories } = req.body;

    try {
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const newBudget = new Budget({
            type,
            period,
            totalBudget,
            totalSpent,
            categories,
        });

        user.budgets.push(newBudget);
        user.markModified("budgets");
        await user.save();

        res.status(201).json({ message: "Budget added successfully", budget: newBudget });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Error adding budget", error });
    }
}

const editBudget = async (req, res) => {
    const { id: userId, budgetId } = req.params;
    const updatedBudgetData = req.body;

    try {
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const index = user.budgets.findIndex(
            (b) => b._id.toString() === budgetId
        );

        if (index === -1) {
            return res.status(404).json({ message: "Budget not found" });
        }

        Object.assign(user.budgets[index], updatedBudgetData);
        user.markModified(`budgets.${index}`);
        await user.save();

        res.status(200).json({ message: "Budget updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Error updating budget", error });
    }
};

const deleteBudget = async (req, res) => {
    const { id: userId, budgetId } = req.params;

    try {
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const initialLength = user.budgets.length;
        user.budgets = user.budgets.filter(
            (budget) => budget._id.toString() !== budgetId
        );

        if (user.budgets.length === initialLength) {
            return res.status(404).json({ message: "Budget not found" });
        }

        user.markModified("budgets");
        await user.save();

        res.status(200).json({ message: "Budget deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Error deleting budget", error });
    }
};

module.exports = { getAllBudgets, addBudget, editBudget, deleteBudget }