const app = require("express");
const { runCronJob } = require("../controllers/cron");

const router = app.Router();

router.route("/").post(runCronJob);

module.exports = router;