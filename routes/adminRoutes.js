const router = require("express").Router();
const {
  createUser,
  getAllUsers,
} = require("../controllers/adminController");

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.post("/create-user", auth, role("admin"), createUser);
router.get("/users", auth, role("admin"), getAllUsers);

module.exports = router;