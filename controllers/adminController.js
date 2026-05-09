const supabase = require("../config/supabase");
const bcrypt = require("bcrypt");
const generateUserId = require("../utils/generateUserId");

const createUser = async (req, res) => {
  const { phoneNumber, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = generateUserId();

  const { data: user } = await supabase
    .from("users")
    .insert([
      {
        phone_number: phoneNumber,
        password: hashedPassword,
        user_id: userId,
      },
    ])
    .select()
    .single();

  await supabase.from("wallets").insert([
    {
      user_id: user.id,
      balance: 0,
    },
  ]);

  res.json({
    message: "User created",
    userId,
  });
};

module.exports = {
  createUser,
};