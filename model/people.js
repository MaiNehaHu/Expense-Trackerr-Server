const mongoose = require("mongoose");

const peopleSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        contact: { type: Number, required: true },
        relation: { type: String, required: true }
    });

const People = mongoose.model("People", peopleSchema);

module.exports = People;
