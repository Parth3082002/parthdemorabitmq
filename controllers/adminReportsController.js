const {
  listGames,
  getGameDetail,
  getUserDetail,
  getDashboard,
} = require("../services/adminReportsService");

const getGames = async (req, res) => {
  try {
    const limit = Math.min(
      Number(req.query.limit) || 50,
      100
    );
    const offset =
      Number(req.query.offset) || 0;
    const status =
      req.query.status || undefined;

    const result = await listGames({
      status,
      limit,
      offset,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getGameById = async (req, res) => {
  try {
    const detail = await getGameDetail(
      req.params.gameId
    );

    if (!detail) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    res.json({
      success: true,
      ...detail,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const detail = await getUserDetail(
      req.params.userId
    );

    if (!detail) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      ...detail,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAdminDashboard = async (
  req,
  res
) => {
  try {
    const dashboard =
      await getDashboard();

    res.json({
      success: true,
      dashboard,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getGames,
  getGameById,
  getUserById,
  getAdminDashboard,
};
