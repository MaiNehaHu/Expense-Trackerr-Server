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

const analyticss_route = require("./routes/analytics");
app.use("/api/analytics", analyticss_route);

const transactions_route = require("./routes/transactions");
app.use("/api/transactions", transactions_route);

const recuring_transactions_route = require("./routes/recuringTransactions");
app.use("/api/recuring-transactions", recuring_transactions_route);

const transaction_img_route = require("./routes/transactionImage");
app.use("/api/transaction-image", transaction_img_route);

const img_only_route = require("./routes/imageOnly");
app.use("/api/only-image", img_only_route);

const transh_route = require("./routes/trash");
app.use("/api/trash", transh_route);

const transh_older_than_week_route = require("./routes/trashOlderThanWeek");
app.use("/api/older-than-week-trash", transh_older_than_week_route);

const empty_transh_route = require("./routes/emptyTrash");
app.use("/api/empty-trash", empty_transh_route);

const categories_route = require("./routes/category");
app.use("/api/categories", categories_route);

const people_route = require("./routes/people");
app.use("/api/people", people_route);

const notifications_route = require("./routes/notifications");
app.use("/api/notifications", notifications_route);

const search_route = require("./routes/search");
app.use("/api/search", search_route);

const budgets_route = require("./routes/budgets");
app.use("/api/budgets", budgets_route);

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
