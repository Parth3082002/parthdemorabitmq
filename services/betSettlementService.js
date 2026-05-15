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
        skipped: true,
      };
    }

    const { data: gameRow } =
      await supabase
        .from("games")
        .select("status")
        .eq("id", gameId)
        .single();

    if (
      !gameRow ||
      gameRow.status ===
        "settled"
    ) {
      return {
        settledCount: 0,
        skipped: true,
        reason:
          "already_settled",
      };
    }

    const { data: locked } =
      await supabase
        .from("games")
        .update({
          status: "settling",
        })
        .eq("id", gameId)
        .in("status", [
          "open",
          "active",
        ])
        .select("id")
        .maybeSingle();

    if (!locked) {
      return {
        settledCount: 0,
        skipped: true,
        reason:
          "not_open_for_settlement",
      };
    }

    const winKey =
      String(publishedNumber);

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
      pending.length === 0
    ) {
      return {
        settledCount: 0,
        skipped: false,
      };
    }

    const payoutByUser =
      new Map();
    const settledBetIds = [];

    for (const bet of pending) {
      const won =
        String(bet.bet_number) ===
        winKey;
      const newStatus = won
        ? "won"
        : "lost";

      const { data: updated } =
        await supabase
          .from("bets")
          .update({
            status: newStatus,
          })
          .eq("id", bet.id)
          .eq(
            "status",
            "pending"
          )
          .select("id");

      if (
        !updated ||
        updated.length === 0
      ) {
        continue;
      }

      settledBetIds.push(bet.id);

      if (won) {
        const payout =
          WIN_MULTIPLIER *
          Number(bet.amount);
        const prev =
          payoutByUser.get(
            bet.user_id
          ) || 0;
        payoutByUser.set(
          bet.user_id,
          prev + payout
        );
      }
    }

    for (const [
      userId,
      totalPayout,
    ] of payoutByUser) {
      if (totalPayout <= 0) {
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
        settledBetIds.length,
      winnersPaid:
        payoutByUser.size,
    };
  };

module.exports = {
  settlePendingBetsForGame,
  WIN_MULTIPLIER,
};
