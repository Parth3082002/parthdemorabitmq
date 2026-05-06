const express = require("express");
const router = express.Router();

const {
  manualPublish,
  selectNumber,
  analytics,
  getPublishedHistory,
} = require("../controllers/numberController");

router.post("/manual-publish", manualPublish);
router.post("/select-number", selectNumber);
router.get("/analytics", analytics);
router.get("/published-history", getPublishedHistory);
module.exports = router;