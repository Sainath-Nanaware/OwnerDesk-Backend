const User=require("../models/userModel")
const bcrypt = require("bcrypt");
const logger = require("../logs/logger");
const jwt = require("jsonwebtoken");



const { successResponse, errorResponse } = require("../utils/responseHandler");

exports.registration = async (req, resp) => {
  logger.info("control in registration");
  const {username,email, password,mobile} = req.body;
  try {
    // console.log("email:",email);

    const userExist = await User.findOne({ email });
    // console.log(userExist)
    if (userExist) {
      logger.warn("user already exist");
      return errorResponse(resp, "user already exist!", 400);
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      mobile
    });
    logger.info("user create");
    successResponse(resp, newUser, "User registred succesfully", 201);
  } catch (error) {
    logger.error("internal server error!");
    errorResponse(resp, "Internal server error", 500, error);
    console.log(error);
  }
};


exports.login = async (req, resp) => {
  logger.info("control in login");
  const { email, password } = req.body;
  // console.log("check login credentials");

  try {
    const userExist = await User.findOne({ email });
    // console.log(userExist);
    if (!userExist) {
      logger.warn("user not found");
      return errorResponse(resp, "invalid credential", 401);
    }
    const validPassword = await bcrypt.compare(password, userExist.password);
    if (!validPassword) {
      return errorResponse(resp, "invalid credential", 401);
    }
    // console.log(validPassword);

    const token = jwt.sign(
      { userId: userExist._id, email: userExist.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    logger.info("user login succesfully");
    successResponse(
      resp,
      { token, userName: userExist.username, },
      "User login succesfully",
      200
    );
  } catch (error) {
    logger.error("internal server error");
    errorResponse(resp, "Internal server error", 500, error);
    console.log(error);
  }
};
