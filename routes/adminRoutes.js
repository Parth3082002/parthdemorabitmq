const router = require("express").Router();
const { createUser } = require("../controllers/adminController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.post("/create-user", auth, role("admin"), createUser);

module.exports = router;