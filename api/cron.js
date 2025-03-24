const { runCronJob } = require("../controllers/cron");

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const result = await runCronJob();
  res.status(200).json(result);
}
