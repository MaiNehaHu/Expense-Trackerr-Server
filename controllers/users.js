const User = require("../model/user");

// Utility function to generate unique IDs
function generateUniqueId() {
  const randomString1 = Math.random().toString(36).substring(2, 8);
  const randomString2 = Math.random().toString(36).substring(2, 8);
  const randomNumber = Math.floor(Math.random() * 100);
  return `Exp-${randomString1}${randomNumber}${randomString2}`;
}

// Add a new user
async function addUser(req, res) {
  try {
    const uniqueId = generateUniqueId();
    const userData = { ...req.body, userId: uniqueId };

    const newUser = await User.create(userData);
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
}

// Get all users
async function getAllUsers(req, res) {
  try {
    const users = await User.find(); // Fetch all users from the database
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}

// Get a user by their unique ID
async function getUserById(req, res) {
  try {
    const { id } = req.params;

    const user = await User.findOne({ userId: id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
}

// Edit a user's data
async function editUser(req, res) {
  try {
    const { id } = req.params; // User's unique ID
    const updatedData = req.body; // Data to update

    const user = await User.findOneAndUpdate(
      { userId: id }, 
      updatedData, 
      { new: true, runValidators: true } 
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    const user = await User.findOneAndDelete({ userId: id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
}

module.exports = { addUser, getAllUsers, getUserById, editUser, deleteUser };
