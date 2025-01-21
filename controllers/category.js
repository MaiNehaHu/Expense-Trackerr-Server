const User = require('../model/user');
const Category = require('../model/category');

// Get All Categories
const getAllCategories = async (req, res) => {
    const { id: userId } = req.params;

    try {
        const user = await User.findOne({ userId }).populate("categories");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ categories: user.categories });
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

        res.status(201).json({ message: "Category added successfully", category: savedCategory });
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
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Error Updating Category" });
    }
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
        user.categories = user.categories.filter((catId) => catId._id.toString() !== categoryId);

        if (user.categories.length === initialLength) {
            return res.status(404).json({ message: "Category not found in user's categories" });
        }

        // Mark the `categories` array as modified and save the user document
        user.markModified(`categories.${categoryId}`);
        await user.save();

        // Delete the category from the `Category` collection
        const deletedCategory = await Category.findByIdAndDelete(categoryId);
        if (!deletedCategory) {
            return res.status(404).json({ message: "Category not found in the database" });
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
