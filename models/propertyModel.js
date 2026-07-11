const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId, // references another document’s _id
      required: true,
      ref: "User", // assuming you have a User model
    },
    propertyName: {
      type: String,
      required: [true, "Please provide property name"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Please provide address"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "Please provide city"],
      trim: true,
      lowercase: true,
    },
    state: {
      type: String,
      required: [true, "Please provide state"],
      trim: true,
      lowercase: true,
    },
    pincode: {
      type: String,
      required: [true, "Please provide pincode"],
      validate: {
        validator: function (v) {
          // Indian pincode: 6 digits
          return /^[1-9][0-9]{5}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid Indian pincode!`,
      },
    },
    totalRooms: {
      type: Number,
      required: [true, "Please provide total rooms"],
      min: [1, "Total rooms must be at least 1"],
    },

    occupiedRooms: {
      type: Number,
      default: 0,
      min: [0, "Occupied rooms cannot be negative"],
    },
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt
  }
);

module.exports = mongoose.model("property", propertySchema);
