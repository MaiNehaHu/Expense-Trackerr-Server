const People = require("../model/people");
const User = require('../model/user');

async function addPerson(req, res) {
    const { id: userId } = req.params;
    const { name, contact } = req.body;

    try {
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Create new Person
        const newPerson = new People({ name, contact });
        const savedPerson = await newPerson.save();

        // Add Person to user's people
        user.people.push(savedPerson);
        await user.save();

        res.status(201).json({ message: "Person added successfully", person: savedPerson });
    } catch (error) {
        console.error("Error adding person:", error);
        res.status(500).json({ error: "Failed to add person" });
    }
}

// Get all users
async function getAllPeople(req, res) {
    const { id: userId } = req.params;

    try {
        const user = await User.findOne({ userId }).populate("people");
        if (!user) {
            return res.status(404).json({ message: "People not found" });
        }

        res.status(200).json(user.people);
    } catch (error) {
        console.error("Error fetching people:", error);
        res.status(500).json({ error: "Failed to fetch people" });
    }
}

// Get a user by their unique ID
async function editPerson(req, res) {
    const { id: userId, personId } = req.params;
    const { name, contact } = req.body;

    try {
        // Update Person in the Person collection
        const updatedPerson = await People.findByIdAndUpdate(
            personId,
            { name, contact },
            { new: true } // Return the updated document
        );

        if (!updatedPerson) {
            return res.status(404).json({ message: "Person not found" });
        }

        // Update the Person in the user's document
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const personIndex = user.people.findIndex(
            (person) => person._id.toString() === personId
        );

        if (personIndex !== -1) {
            user.people[personIndex] = updatedPerson;

            user.markModified(`people`);
            await user.save();
        }

        res.status(200).json({
            message: "Person updated successfully",
            person: updatedPerson,
        });
    } catch (error) {
        console.error("Error updating person:", error);
        res.status(500).json({ error: "Failed to update person" });
    }
}

async function deletePerson(req, res) {
    const { id: userId, personId } = req.params;

    try {
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Filter out the People from the user's people array
        const initialLength = user.people.length;
        user.people = user.people.filter((catId) => catId._id.toString() !== personId);

        if (user.people.length === initialLength) {
            return res.status(404).json({ message: "Person not found in user's people" });
        }

        // Mark the `people` array as modified and save the user document
        user.markModified(`people.${personId}`);
        await user.save();

        // Delete the People from the `People` collection
        const deletedPerson = await People.findByIdAndDelete(personId);
        if (!deletedPerson) {
            return res.status(404).json({ message: "Person not found in the database" });
        }

        res.status(200).json({ message: "Person deleted successfully" });
    } catch (error) {
        console.error("Error deleting person:", error);
        res.status(500).json({ error: "Failed to delete person" });
    }
}

module.exports = { addPerson, getAllPeople, editPerson, deletePerson }