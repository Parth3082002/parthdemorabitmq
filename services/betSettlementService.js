const supabase = require("../config/supabase");

const WIN_MULTIPLIER = 9;

const creditWalletOnce =
  async (
    userId,
    credit
  ) => {
    const { data: wallet, error: wErr } =
      await supabase
        .from("wallets")
        .select("*")
        .eq(
          "user_id",
          userId
        )
        .single();

    if (
      wErr ||
      !wallet
    ) {
      throw new Error(
        `Wallet missing for user ${userId}`
      );
    }

    const before =
      Number(
        wallet.balance
      );
    const add =
      Number(credit);
    const after =
      before + add;

    const { data: updated, error: uErr } =
      await supabase
        .from("wallets")
        .update({
          balance: after,
        })
        .eq(
          "user_id",
          userId
        )
        .eq(
          "balance",
          before
        )
        .select("id");

    if (
      uErr ||
      !updated ||
      updated.length ===
        0
    ) {
      throw new Error(
        "Concurrent wallet update during payout"
      );
    }

    return {
      before,
      after,
    };
  };

const insertWinTransaction =
  async (
    userId,
    amount,
    beforeBalance,
    afterBalance
  ) => {
    await supabase
      .from(
        "wallet_transactions"
      )
      .insert([
        {
          user_id:
            userId,
          type: "bet_win",
          amount,
          before_balance:
            beforeBalance,
          after_balance:
            afterBalance,
          created_by:
            null,
        },
      ]);
  };

const settlePendingBetsForGame =
  async (
    gameId,
    publishedNumber
  ) => {
    if (!gameId) {
      return {
        settledCount: 0,
      };
    }

    const winKey =
      String(
        publishedNumber
      );

    const { data: pending, error } =
      await supabase
        .from("bets")
        .select("*")
        .eq(
          "game_id",
          gameId
        )
        .eq(
          "status",
          "pending"
        );

    if (error) {
      throw new Error(
        error.message
      );
    }

    if (
      !pending ||
      pending.length ===
        0
    ) {
      return {
        settledCount: 0,
      };
    }

    const payoutByUser =
      new Map();

    for (
      const bet of pending
    ) {
      const won =
        String(
          bet.bet_number
        ) === winKey;

      if (won) {
        const payout =
          WIN_MULTIPLIER *
          Number(
            bet.amount
          );
        const prev =
          payoutByUser.get(
            bet.user_id
          ) || 0;
        payoutByUser.set(
          bet.user_id,
          prev + payout
        );
      }

      await supabase
        .from("bets")
        .update({
          status: won
            ? "won"
            : "lost",
        })
        .eq("id", bet.id);
    }

    for (const [
      userId,
      totalPayout,
    ] of payoutByUser) {
      if (
        totalPayout <=
        0
      ) {
        continue;
      }

      const { before, after } =
        await creditWalletOnce(
          userId,
          totalPayout
        );

      await insertWinTransaction(
        userId,
        totalPayout,
        before,
        after
      );
    }

    return {
      settledCount:
        pending.length,
    };
  };

module.exports = {
  settlePendingBetsForGame,
  WIN_MULTIPLIER,
};
