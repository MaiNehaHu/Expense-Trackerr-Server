const User = require("../model/user");
const Category = require("../model/category");
const Transaction = require("../model/transaction");
const RecuringTransaction = require("../model/recuringTransaction");
const Budget = require("../model/budget");
const Trash = require("../model/trash");
const Notification = require("../model/notification");

// Get All Categories
const getAllCategories = async (req, res) => {
  const { id: userId } = req.params;

  try {
    const user = await User.findOne({ userId }).populate("categories");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.categories);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error Getting Categories: ", error });
  }
};

// Add Category
const addCategory = async (req, res) => {
  const { id: userId } = req.params;
  const { name, hexColor, type, sign } = req.body;

  try {
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create new category
    const newCategory = new Category({ name, hexColor, type, sign });
    const savedCategory = await newCategory.save();

    // Add category to user's categories
    user.categories.push(savedCategory);
    await user.save();

    res.status(201).json({
      message: "Category added successfully",
      category: savedCategory,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error Adding Category" });
  }
};

// Edit Category
const editCategory = async (req, res) => {
  const { id: userId, categoryId } = req.params;
  const { name, hexColor, type, sign } = req.body;

  try {
    // Update category in the Category collection
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { name, hexColor, type, sign },
      { new: true } // Return the updated document
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Update the category in the user's document
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const categoryIndex = user.categories.findIndex(
      (cat) => cat._id.toString() === categoryId
    );

    if (categoryIndex !== -1) {
      user.categories[categoryIndex] = updatedCategory;

      user.markModified(`categories`);
      await user.save();
    }

    res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory,
    });

    await updateCategoryInUserData(user, categoryId, updatedCategory);
    await updateInAllOtherList(userId, updatedCategory);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error Updating Category" });
  }
};

const updateInAllOtherList = async (updatedCategory) => {
  try {
    const categoryUpdate = {
      "category.name": updatedCategory.name,
      "category.hexColor": updatedCategory.hexColor,
      "category.type": updatedCategory.type,
      // "category.sign": updatedCategory.sign,
    };

    // Update Transactions
    await Transaction.updateMany(
      { "category._id": updatedCategory._id },
      { $set: categoryUpdate }
    );

    // Update Recurring Transactions
    await RecuringTransaction.updateMany(
      { "category._id": updatedCategory._id },
      { $set: categoryUpdate }
    );

    // Update Trash
    await Trash.updateMany(
      { "category._id": updatedCategory._id },
      { $set: categoryUpdate }
    );

    // Update Notifications
    await Notification.updateMany(
      { "transaction.category._id": updatedCategory._id },
      { $set: { "transaction.$[].category": updatedCategory } }
    );

    // Update Budget
    await Budget.updateMany(
      { "categories._id": updatedCategory._id },
      {
        $set: {
          "categories.$[elem].name": updatedCategory.name,
          "categories.$[elem].hexColor": updatedCategory.hexColor,
          "categories.$[elem].type": updatedCategory.type,
          // "categories.$[elem].sign": updatedCategory.sign,
        },
      },
      { arrayFilters: [{ "elem._id": updatedCategory._id }] }
    );

    console.log("Category updated in all related lists.");
  } catch (error) {
    console.error("Error updating category in other lists:", error);
  }
};

const updateCategoryInUserData = async (user, categoryId, updatedCategory) => {
  const { name, hexColor, type, sign } = updatedCategory;

  const updateCategory = (item) => {
    if (item.category._id === categoryId) {
      item.category.name = name;
      item.category.hexColor = hexColor;
      item.category.type = type;
      item.category.sign = sign;
    }
  };

  // Update category in user.categories array
  const categoryIndex = user.categories.findIndex(
    (cat) => cat._id.toString() === categoryId
  );

  if (categoryIndex !== -1) {
    user.categories[categoryIndex].name = name;
    user.categories[categoryIndex].hexColor = hexColor;
    user.categories[categoryIndex].type = type;
    user.categories[categoryIndex].sign = sign;
    user.markModified("categories");
  }

  // Update category in transactions
  if (user.transactions) {
    user.transactions.forEach(updateCategory);
    user.markModified("transactions");
  }

  // Update category in trash
  if (user.trash) {
    user.trash.forEach(updateCategory);
    user.markModified("trash");
  }

  //   // Update category in recurring transactions
  if (user.recuringTransactions) {
    user.recuringTransactions.forEach(updateCategory);
    user.markModified("recuringTransactions");
  }

  // Update category in budgets
  if (user.budgets && Array.isArray(user.budgets)) {
    user.budgets.forEach((budget) => {
      if (budget.categories && Array.isArray(budget.categories)) {
        budget.categories.forEach((category) => {
          if (category._id === categoryId) {
            category.name = name;
            category.hexColor = hexColor;
            category.type = type;
            category.sign = sign;
          }
        });
      }
    });
    user.markModified("budgets");
  }

  // Update category in notifications
  if (user.notifications) {
    user.notifications.forEach((notification) => {
      if (notification.transaction && notification.transaction.category) {
        if (notification.transaction.category._id === categoryId) {
          notification.transaction.category.name = name;
          notification.transaction.category.hexColor = hexColor;
          notification.transaction.category.type = type;
          notification.transaction.category.sign = sign;
        }
      }
    });
    user.markModified("notifications");
  }

  // Save changes to the user document
  await user.save();
  console.log("Category updated in all user's lists");
};

// Delete Category
const deleteCategory = async (req, res) => {
  const { id: userId, categoryId } = req.params;

  try {
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Filter out the category from the user's categories array
    const initialLength = user.categories.length;
    user.categories = user.categories.filter(
      (catId) => catId._id.toString() !== categoryId
    );

    if (user.categories.length === initialLength) {
      return res
        .status(404)
        .json({ message: "Category not found in user's categories" });
    }

    // Mark the `categories` array as modified and save the user document
    user.markModified(`categories.${categoryId}`);
    await user.save();

    // Delete the category from the `Category` collection
    const deletedCategory = await Category.findByIdAndDelete(categoryId);
    if (!deletedCategory) {
      return res
        .status(404)
        .json({ message: "Category not found in the database" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error Deleting Category", error });
  }
};

module.exports = {
  getAllCategories,
  addCategory,
  editCategory,
  deleteCategory,
};
