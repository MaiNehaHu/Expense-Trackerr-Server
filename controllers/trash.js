const User = require("../model/user");
const Transaction = require("../model/transaction");

async function addTrash(req, res) {
  const { userId } = req.body;
  try {
  } catch (error) {}
}

async function getAllTrashs(req, res) {
  const { userId } = req.body;
  try {
  } catch (error) {}
}

async function editTrash(req, res) {
  const { userId } = req.body;
  try {
  } catch (error) {}
}

async function deleteTrash(req, res) {
  const { userId } = req.body;
  try {
  } catch (error) {}
}

async function emptyTrash(req, res) {
  const { userId } = req.body;
  try {
  } catch (error) {}
}

module.exports = { addTrash, getAllTrashs, editTrash, deleteTrash, emptyTrash };
