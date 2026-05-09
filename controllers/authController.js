const supabase = require("../config/supabase");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const adminLogin = async (req, res) => {
  const { username, password } = req.body;

  const { data } = await supabase
    .from("admins")
    .select("*")
    .eq("username", username)
    .single();

  if (!data) {
    return res.status(404).json({ message: "Admin not found" });
  }

  const match = await bcrypt.compare(password, data.password);

  if (!match) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: data.id, role: "admin" },
    process.env.JWT_SECRET
  );

  res.json({ token });
};

const userLogin = async (req, res) => {
  const { userId, password } = req.body;

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!data) {
    return res.status(404).json({ message: "User not found" });
  }

  const match = await bcrypt.compare(password, data.password);

  if (!match) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: data.id, role: "user" },
    process.env.JWT_SECRET
  );

  res.json({ token });
};

module.exports = {
  adminLogin,
  userLogin,
};