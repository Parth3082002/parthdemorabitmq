const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader =
    req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "No token",
    });
  }

  const parts =
    authHeader.split(" ");
  const bearer =
    parts.length === 2
      ? parts[1]
      : parts[0];

  try {
    const decoded = jwt.verify(
      bearer,
      process.env.JWT_SECRET
    );

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};