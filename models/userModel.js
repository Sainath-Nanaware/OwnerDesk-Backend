const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please provide name"],
    },
    email: {
      type: String,
      required: [true, "Please provide email"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Please provide password"],
      minlength: 8,
      //   select: false, // Exclude by default in queries
    },
    mobile: {
      type: String,
      required: [true, "Please provide mobile number"],
      unique: true,
      validate: {
        validator: function (v) {
          // Same regex as Joi: allows optional +91 prefix
          return /^(\+91)?[6-9]\d{9}$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid Indian mobile number (with or without +91)!`,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("users", userSchema);
