const supabase = require("../config/supabase");
const { WIN_MULTIPLIER } = require("./betSettlementService");

const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );

const resolveUser = async (identifier) => {
  let query = supabase
    .from("users")
    .select(
      `
      id,
      user_id,
      phone_number,
      status,
      created_at,
      wallets (
        id,
        balance,
        total_deposit,
        total_withdraw,
        created_at
      )
    `
    );

  query = isUuid(identifier)
    ? query.eq("id", identifier)
    : query.eq("user_id", identifier);

  const { data, error } = await query.single();

  if (error || !data) {
    return null;
  }

  return data;
};

const sumByType = (rows, type) =>
  rows
    .filter((r) => r.type === type)
    .reduce(
      (s, r) => s + Number(r.amount),
      0
    );

const buildBetStats = (bets) => {
  let totalStaked = 0;
  let totalWonPayout = 0;
  let totalLostStake = 0;
  let wonCount = 0;
  let lostCount = 0;
  let pendingCount = 0;

  for (const bet of bets) {
    const amt = Number(bet.amount);
    totalStaked += amt;

    if (bet.status === "won") {
      wonCount++;
      totalWonPayout +=
        WIN_MULTIPLIER * amt;
    } else if (bet.status === "lost") {
      lostCount++;
      totalLostStake += amt;
    } else if (bet.status === "pending") {
      pendingCount++;
    }
  }

  return {
    totalBets: bets.length,
    totalStaked,
    wonCount,
    lostCount,
    pendingCount,
    totalWonPayout,
    totalLostStake,
    netFromBets:
      totalWonPayout - totalLostStake,
  };
};

const listGames = async ({
  status,
  limit = 50,
  offset = 0,
}) => {
  let query = supabase
    .from("games")
    .select("*", {
      count: "exact",
    })
    .order("created_at", {
      ascending: false,
    })
    .range(
      offset,
      offset + limit - 1
    );

  if (status) {
    query = query.eq(
      "status",
      status
    );
  }

  const { data: games, error, count } =
    await query;

  if (error) {
    throw new Error(error.message);
  }

  const gameIds = (games || []).map(
    (g) => g.id
  );

  if (gameIds.length === 0) {
    return {
      total: count || 0,
      games: [],
    };
  }

  const { data: bets, error: bErr } =
    await supabase
      .from("bets")
      .select(
        "game_id, amount, status, user_id"
      )
      .in("game_id", gameIds);

  if (bErr) {
    throw new Error(bErr.message);
  }

  const summaryByGame = {};

  for (const bet of bets || []) {
    if (!summaryByGame[bet.game_id]) {
      summaryByGame[bet.game_id] = {
        betCount: 0,
        totalStake: 0,
        uniqueUsers: new Set(),
        wonCount: 0,
        lostCount: 0,
      };
    }

    const s =
      summaryByGame[bet.game_id];
    s.betCount++;
    s.totalStake += Number(
      bet.amount
    );
    s.uniqueUsers.add(
      bet.user_id
    );
    if (bet.status === "won") {
      s.wonCount++;
    }
    if (bet.status === "lost") {
      s.lostCount++;
    }
  }

  const enriched = (games || []).map(
    (g) => {
      const s =
        summaryByGame[g.id] || {
          betCount: 0,
          totalStake: 0,
          uniqueUsers: new Set(),
          wonCount: 0,
          lostCount: 0,
        };

      return {
        ...g,
        betCount: s.betCount,
        totalStake: s.totalStake,
        uniqueBettors:
          s.uniqueUsers.size,
        wonCount: s.wonCount,
        lostCount: s.lostCount,
      };
    }
  );

  return {
    total: count || 0,
    limit,
    offset,
    games: enriched,
  };
};

const getGameDetail = async (gameId) => {
  const { data: game, error: gErr } =
    await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

  if (gErr || !game) {
    return null;
  }

  const { data: bets, error: bErr } =
    await supabase
      .from("bets")
      .select(
        `
        id,
        user_id,
        amount,
        bet_number,
        status,
        created_at,
        users (
          user_id,
          phone_number
        )
      `
      )
      .eq("game_id", gameId)
      .order("created_at", {
        ascending: false,
      });

  if (bErr) {
    throw new Error(bErr.message);
  }

  const betList = bets || [];
  const stats =
    buildBetStats(betList);

  const byNumber = {};

  for (const bet of betList) {
    const key = bet.bet_number;
    if (!byNumber[key]) {
      byNumber[key] = {
        betCount: 0,
        totalStake: 0,
      };
    }
    byNumber[key].betCount++;
    byNumber[key].totalStake +=
      Number(bet.amount);
  }

  return {
    game,
    stats,
    breakdownByNumber: byNumber,
    bets: betList,
  };
};

const getUserDetail = async (
  identifier
) => {
  const user =
    await resolveUser(identifier);

  if (!user) {
    return null;
  }

  const { data: transactions, error: tErr } =
    await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

  if (tErr) {
    throw new Error(tErr.message);
  }

  const { data: bets, error: bErr } =
    await supabase
      .from("bets")
      .select(
        `
        id,
        game_id,
        amount,
        bet_number,
        status,
        created_at,
        games (
          game_name,
          status,
          published_number,
          published_at
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

  if (bErr) {
    throw new Error(bErr.message);
  }

  const txList = transactions || [];
  const betList = bets || [];
  const betStats =
    buildBetStats(betList);

  return {
    user,
    wallet: user.wallets?.[0] || null,
    financials: {
      totalDeposit: sumByType(
        txList,
        "deposit"
      ),
      totalWithdraw: sumByType(
        txList,
        "withdraw"
      ),
      totalBetStake: sumByType(
        txList,
        "bet_stake"
      ),
      totalBetWinnings: sumByType(
        txList,
        "bet_win"
      ),
    },
    betting: betStats,
    walletTransactions: txList,
    bets: betList,
  };
};

const getDashboard = async () => {
  const [
    { count: userCount },
    { count: gameCount },
    { data: openGames },
    { data: recentGames },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("*", {
        count: "exact",
        head: true,
      }),
    supabase
      .from("games")
      .select("*", {
        count: "exact",
        head: true,
      }),
    supabase
      .from("games")
      .select("id, game_name, created_at")
      .eq("status", "open")
      .limit(1),
    supabase
      .from("games")
      .select("*")
      .eq("status", "settled")
      .order("published_at", {
        ascending: false,
      })
      .limit(5),
  ]);

  const {
    count: pendingBetsCount,
  } = await supabase
    .from("bets")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("status", "pending");

  return {
    totalUsers: userCount || 0,
    totalGames: gameCount || 0,
    currentOpenGame:
      openGames?.[0] || null,
    pendingBetsCount:
      pendingBetsCount || 0,
    recentSettledGames:
      recentGames || [],
  };
};

module.exports = {
  listGames,
  getGameDetail,
  getUserDetail,
  getDashboard,
};
