const supabase = require("../config/supabase");

const deposit = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const beforeBalance = Number(wallet.balance);
    const newBalance = beforeBalance + Number(amount);

    await supabase
      .from("wallets")
      .update({
        balance: newBalance,
        total_deposit:
          Number(wallet.total_deposit) + Number(amount),
      })
      .eq("user_id", user.id);

    await supabase.from("wallet_transactions").insert([
      {
        user_id: user.id,
        type: "deposit",
        amount,
        before_balance: beforeBalance,
        after_balance: newBalance,
        created_by: req.user.id,
      },
    ]);

    res.json({
      success: true,
      message: "Amount deposited",
      balance: newBalance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const withdraw = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const beforeBalance = Number(wallet.balance);

    if (beforeBalance < Number(amount)) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
    }

    const newBalance = beforeBalance - Number(amount);

    await supabase
      .from("wallets")
      .update({
        balance: newBalance,
        total_withdraw:
          Number(wallet.total_withdraw) + Number(amount),
      })
      .eq("user_id", user.id);

    await supabase.from("wallet_transactions").insert([
      {
        user_id: user.id,
        type: "withdraw",
        amount,
        before_balance: beforeBalance,
        after_balance: newBalance,
        created_by: req.user.id,
      },
    ]);

    res.json({
      success: true,
      message: "Amount withdrawn",
      balance: newBalance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const myWallet = async (req, res) => {
  try {
    const { data } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", req.user.id)
      .single();

    res.json({
      success: true,
      wallet: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const walletHistory = async (req, res) => {
  try {
    const { data } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", {
        ascending: false,
      });

    res.json({
      success: true,
      transactions: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  deposit,
  withdraw,
  myWallet,
  walletHistory,
};