const User=require("../models/userModel")
const bcrypt = require("bcrypt");

const { successResponse, errorResponse } = require("../utils/responseHandler");

exports.registration = async (req, resp) => {
  // logger.info("control in registration");
  const {username,email, password} = req.body;
  try {
    // console.log("email:",email);

    const userExist = await User.findOne({ email });
    // console.log(userExist)
    if (userExist) {
      // logger.warn("user already exist");
      return errorResponse(resp, "user already exist!", 400);
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });
    // logger.info("user create");
    successResponse(resp, newUser, "User registred succesfully", 201);
  } catch (error) {
    // logger.error("internal server error!");
    errorResponse(resp, "Internal server error", 500, error);
    console.log(error);
  }
};