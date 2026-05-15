const supabase = require("../config/supabase");

const MAX_BETS_PER_REQUEST = 50;

const debitWalletOnce =
  async (
    userId,
    amount
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
      return {
        ok: false,
        code: "wallet_not_found",
        message:
          "Wallet not found",
      };
    }

    const before =
      Number(
        wallet.balance
      );
    const stake =
      Number(
        amount
      );

    if (
      before <
      stake
    ) {
      return {
        ok: false,
        code: "insufficient_balance",
        message:
          "Insufficient balance",
      };
    }

    const after =
      before - stake;

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

    if (uErr) {
      return {
        ok: false,
        code: "wallet_update_failed",
        message:
          uErr.message,
      };
    }

    if (
      !updated ||
      updated.length ===
        0
    ) {
      return {
        ok: false,
        code: "concurrent_wallet_change",
        message:
          "Please retry your bet",
      };
    }

    return {
      ok: true,
      before,
      after,
    };
  };

const insertStakeTransaction =
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
          type: "bet_stake",
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

const placeBetsForRound =
  async ({
    userId,
    gameId,
    bets,
  }) => {
    if (
      !gameId ||
      !Array.isArray(
        bets
      ) ||
      bets.length ===
        0
    ) {
      return {
        ok: false,
        code: "invalid_body",
        message:
          "Non-empty bets[] is required",
      };
    }

    const { data: gameRow, error: gErr } =
      await supabase
        .from("games")
        .select("status")
        .eq("id", gameId)
        .single();

    if (
      gErr ||
      !gameRow
    ) {
      return {
        ok: false,
        code: "invalid_round",
        message:
          "Unknown game round",
      };
    }

    if (
      gameRow.status !==
        "open" &&
      gameRow.status !==
        "active"
    ) {
      return {
        ok: false,
        code: "round_closed",
        message:
          "This round is closed for betting",
      };
    }

    if (
      bets.length >
      MAX_BETS_PER_REQUEST
    ) {
      return {
        ok: false,
        code: "too_many_bets",
        message: `At most ${MAX_BETS_PER_REQUEST} lines per request`,
      };
    }

    let totalStake = 0;
    const rows = [];

    for (
      let i = 0;
      i <
      bets.length;
      i++
    ) {
      const line =
        bets[i];
      const n =
        Number(
          line.selectedNumber
        );
      const amt =
        Number(
          line.betAmount
        );

      if (
        !Number.isInteger(
          n
        ) ||
        n <
          0 ||
        n >
          9 ||
        !Number.isFinite(
          amt
        ) ||
        amt <=
          0
      ) {
        return {
          ok: false,
          code: "invalid_bet_line",
          message:
            "Each bet needs selectedNumber 0–9 and positive betAmount",
          index: i,
        };
      }

      totalStake += amt;
      rows.push({
        user_id:
          userId,
        game_id:
          gameId,
        amount: amt,
        bet_number:
          String(n),
        status: "pending",
      });
    }

    const debit =
      await debitWalletOnce(
        userId,
        totalStake
      );

    if (!debit.ok) {
      return debit;
    }

    const { error: betErr } =
      await supabase
        .from("bets")
        .insert(rows);

    if (betErr) {
      await supabase
        .from("wallets")
        .update({
          balance:
            debit.before,
        })
        .eq(
          "user_id",
          userId
        )
        .eq(
          "balance",
          debit.after
        );

      return {
        ok: false,
        code: "bet_insert_failed",
        message:
          betErr.message,
      };
    }

    await insertStakeTransaction(
      userId,
      totalStake,
      debit.before,
      debit.after
    );

    return {
      ok: true,
      totalStake,
      newBalance:
        debit.after,
      linesPlaced:
        rows.length,
    };
  };

module.exports = {
  placeBetsForRound,
  MAX_BETS_PER_REQUEST,
};
