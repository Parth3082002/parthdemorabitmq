const router = require("express").Router();
const {
  adminLogin,
  userLogin,
} = require("../controllers/authController");

router.post("/admin/login", adminLogin);
router.post("/user/login", userLogin);

module.exports = router;