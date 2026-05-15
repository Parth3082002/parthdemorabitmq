const router = require("express").Router();
const {
  createUser,
  getAllUsers,
} = require("../controllers/adminController");

const {
  getGames,
  getGameById,
  getUserById,
  getAdminDashboard,
} = require("../controllers/adminReportsController");

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.post("/create-user", auth, role("admin"), createUser);
router.get("/users", auth, role("admin"), getAllUsers);

router.get("/dashboard", auth, role("admin"), getAdminDashboard);
router.get("/games", auth, role("admin"), getGames);
router.get("/games/:gameId", auth, role("admin"), getGameById);
router.get("/users/:userId", auth, role("admin"), getUserById);

module.exports = router;