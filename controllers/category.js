const User = require("../model/user");
const Category = require("../model/category");

// Get All Categories
const getAllCategories = async (req, res) => {
  const { id: userId } = req.params;

  try {
    const user = await User.findOne({ userId }).populate("categories");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.categories || []);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error getting categories", error });
  }
};

// Add Category
const addCategory = async (req, res) => {
  const { id: userId } = req.params;
  const { name, hexColor, type, sign } = req.body;

  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const newCategory = new Category({
      name,
      hexColor,
      type,
      sign,
    });

    user.categories.push(newCategory);
    user.markModified("categories");
    await user.save();

    res.status(201).json({ message: "Category added", category: newCategory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding category", error });
  }
};

// Edit Category
const editCategory = async (req, res) => {
  const { id: userId, categoryId } = req.params;
  const { name, hexColor, type, sign } = req.body;

  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const categoryIndex = user.categories.findIndex(
      (cat) => cat._id.toString() === categoryId
    );

    if (categoryIndex === -1)
      return res.status(404).json({ message: "Category not found in user" });

    // Update the category in user.categories
    user.categories[categoryIndex] = {
      ...user.categories[categoryIndex],
      name,
      hexColor,
      type,
      // sign,
    };

    const updatedCategory = user.categories[categoryIndex];

    // Helper function to update matching embedded categories
    const updateCategory = (record) => {
      if (record.category && record.category._id.toString() === categoryId) {
        record.category.name = name;
        record.category.hexColor = hexColor;
        record.category.type = type;
        // record.category.sign = sign;
      }
    };

    // transactions
    if (user.transactions) {
      user.transactions.forEach(updateCategory);
      user.markModified("transactions");
    }

    // trash
    if (user.trash) {
      user.trash.forEach(updateCategory);
      user.markModified("trash");
    }

    // recurring
    if (user.recuringTransactions) {
      user.recuringTransactions.forEach(updateCategory);
      user.markModified("recuringTransactions");
    }

    // budgets
    if (user.budgets) {
      user.budgets.forEach((budget) => {
        if (Array.isArray(budget.categories)) {
          budget.categories.forEach((cat) => {
            if (cat._id.toString() === categoryId) {
              cat.name = name;
              cat.hexColor = hexColor;
              cat.type = type;
              // cat.sign = sign;
            }
          });
        }
      });
      user.markModified("budgets");
    }

    // notifications
    if (user.notifications) {
      user.notifications.forEach((not) => {
        if (not.transaction?.category?._id.toString() === categoryId) {
          not.transaction.category.name = name;
          not.transaction.category.hexColor = hexColor;
          not.transaction.category.type = type;
          // not.transaction.category.sign = sign;
        }
      });
      user.markModified("notifications");
    }

    // Save all user-level updates
    user.markModified("categories");
    await user.save();

    res.status(200).json({
      message: "Category updated in user and all embedded records",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Error editing category:", error);
    res.status(500).json({ message: "Error editing category", error });
  }
};

// Delete Category
const deleteCategory = async (req, res) => {
  const { id: userId, categoryId } = req.params;

  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const initialLength = user.categories.length;
    user.categories = user.categories.filter(
      (cat) => cat._id.toString() !== categoryId
    );

    if (user.categories.length === initialLength)
      return res.status(404).json({ message: "Category not found" });

    user.markModified("categories");
    await user.save();

    res.status(200).json({ message: "Category deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting category", error });
  }
};

module.exports = {
  getAllCategories,
  addCategory,
  editCategory,
  deleteCategory,
};
