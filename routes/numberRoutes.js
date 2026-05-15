// const express = require("express");
// const router = express.Router();

// const {
//   manualPublish,
//   selectNumber,
//   analytics,
//   getPublishedHistory,
// } = require("../controllers/numberController");

// router.post("/manual-publish", manualPublish);
// router.post("/select-number", selectNumber);
// router.get("/analytics", analytics);
// router.get("/published-history", getPublishedHistory);
// module.exports = router;
const express =
  require("express");

const router =
  express.Router();

const {
  manualPublish,
  selectNumber,
  analytics,
  getPublishedHistory,
} = require(
  "../controllers/numberController"
);

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.post(
  "/manual-publish",
  auth,
  role("admin"),
  manualPublish
);

router.post(
  "/select-number",
  auth,
  role("user"),
  selectNumber
);

router.get(
  "/analytics",
  analytics
);

router.get(
  "/published-history",
  getPublishedHistory
);

module.exports =
  router;