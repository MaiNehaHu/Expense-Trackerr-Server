require("dotenv").config();

const express = require("express");
const connectDB = require("./db/connect");
const app = express();
const PORT = process.env.PORT || 2002;

// Middleware to parse JSON bodies
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hey Neha... Your Backend is running in browser 🎉");
});

const users_route = require("./routes/users");
app.use("/api/users", users_route);

const image_route = require("./routes/userImage");
app.use("/api/user-image", image_route);

const transactions_route = require("./routes/transactions");
app.use("/api/transactions", transactions_route);

const transaction_img_route = require("./routes/transactionImage");
app.use("/api/transaction-image", transaction_img_route);

const transh_route = require("./routes/trash");
app.use("/api/trash", transh_route);

const empty_transh_route = require("./routes/emptyTrash");
app.use("/api/empty-trash", empty_transh_route);

async function start() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Yay!! Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.log("Server Not Running: ", error);
  }
}

start();
