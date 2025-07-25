const app = require("express");
const { cronTodedupeRecurring } = require("../controllers/cronTodedupeRecurring");

const router = app.Router();

router.route("/").post(cronTodedupeRecurring).get(cronTodedupeRecurring);

module.exports = router;