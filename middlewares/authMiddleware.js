const jsonwebtoken = require("jsonwebtoken");

const auth = (req, resp, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return resp.status(401).json({ message: "token not provided" });
  }
  try {
    const decodeToken = jsonwebtoken.verify(token, process.env.JWT_SECRET);
    // console.log(decodeToken);
    // req.userId = decodeToken.userId;
    next();
  } catch (error) {
    return resp.status(401).json({ message: "Invalid token" });
  }
};

module.exports = auth;
