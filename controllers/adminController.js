const supabase = require("../config/supabase");
const bcrypt = require("bcrypt");
const generateUserId = require("../utils/generateUserId");

const createUser = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateUserId();

    const { data: user, error } = await supabase
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

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    await supabase.from("wallets").insert([
      {
        user_id: user.id,
        balance: 0,
      },
    ]);

    res.json({
      success: true,
      message: "User created",
      userId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        user_id,
        phone_number,
        status,
        created_at,
        wallets (
          balance,
          total_deposit,
          total_withdraw
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      total: data.length,
      users: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createUser,
  getAllUsers,
};