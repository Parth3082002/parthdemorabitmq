const router = require("express").Router();

const {
  deposit,
  withdraw,
  myWallet,
  walletHistory,
} = require("../controllers/walletController");

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

/**
 * Admin Routes
 */
router.post("/deposit", auth, role("admin"), deposit);
router.post("/withdraw", auth, role("admin"), withdraw);

/**
 * User Routes
 */
router.get("/my-wallet", auth, role("user"), myWallet);
router.get("/history", auth, role("user"), walletHistory);

module.exports = router;