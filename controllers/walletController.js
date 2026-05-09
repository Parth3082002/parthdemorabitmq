const supabase = require("../config/supabase");

const deposit = async (req, res) => {
  const { userId, amount } = req.body;

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", userId)
    .single();

  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const newBalance = Number(wallet.balance) + Number(amount);

  await supabase
    .from("wallets")
    .update({ balance: newBalance })
    .eq("user_id", user.id);

  res.json({
    balance: newBalance,
  });
};

module.exports = {
  deposit,
};