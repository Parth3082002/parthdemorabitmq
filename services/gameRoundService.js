const supabase = require("../config/supabase");

let acceptingBets = true;
let currentOpenGameId = null;

const isAcceptingBets = () =>
  acceptingBets &&
  currentOpenGameId !== null;

const getOpenGameId = () =>
  currentOpenGameId;

const createOpenGameRow =
  async () => {
    const { data, error } =
      await supabase
        .from("games")
        .insert([
          {
            game_name:
              `round-${Date.now()}`,
            status: "open",
          },
        ])
        .select("id")
        .single();

    if (
      error ||
      !data
    ) {
      throw new Error(
        error?.message ||
          "Failed to create game round"
      );
    }

    return data.id;
  };

const ensureOpenRound =
  async () => {
    const { data: openRows, error } =
      await supabase
        .from("games")
        .select("id")
        .eq(
          "status",
          "open"
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(1);

    if (error) {
      throw new Error(
        error.message
      );
    }

    if (
      openRows &&
      openRows.length >
      0
    ) {
      currentOpenGameId =
        openRows[0].id;
      acceptingBets = true;
      return currentOpenGameId;
    }

    currentOpenGameId =
      await createOpenGameRow();
    acceptingBets = true;
    return currentOpenGameId;
  };

const beginSettlement =
  () => {
    acceptingBets = false;
    return {
      gameId:
        currentOpenGameId,
    };
  };

const markGameSettled =
  async (
    gameId,
    publishedNumber
  ) => {
    if (!gameId) {
      return;
    }

    await supabase
      .from("games")
      .update({
        status: "settled",
        published_number:
          String(
            publishedNumber
          ),
        published_at:
          new Date().toISOString(),
      })
      .eq("id", gameId);
  };

const openNextRound =
  async () => {
    currentOpenGameId =
      await createOpenGameRow();
    acceptingBets = true;
    return currentOpenGameId;
  };

module.exports = {
  ensureOpenRound,
  isAcceptingBets,
  getOpenGameId,
  beginSettlement,
  markGameSettled,
  openNextRound,
};
