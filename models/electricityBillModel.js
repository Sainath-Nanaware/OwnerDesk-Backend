const mongoose = require("mongoose");

const electricityBillSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: [true, "Owner ID is required."],
      index: true,
    },

    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property ID is required."],
      index: true,
    },

    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "Room ID is required."],
      index: true,
    },

    month: {
      type: Number,
      required: [true, "Month is required."],
      min: 1,
      max: 12,
    },

    year: {
      type: Number,
      required: [true, "Year is required."],
      min: 2024,
    },

    previousReading: {
      type: Number,
      required: [true, "Previous meter reading is required."],
      min: 0,
    },

    currentReading: {
      type: Number,
      required: [true, "Current meter reading is required."],
      min: 0,
    },

    units: {
      type: Number,
      required: true,
      min: 0,
    },

    rate: {
      type: Number,
      required: [true, "Electricity rate is required."],
      min: 0,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    generatedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * Prevent duplicate electricity bill
 * for same Room + Month + Year
 */
electricityBillSchema.index(
  {
    roomId: 1,
    month: 1,
    year: 1,
  },
  {
    unique: true,
  }
);

/**
 * Common search indexes
 */
electricityBillSchema.index({
  ownerId: 1,
  propertyId: 1,
  roomId: 1,
  year: -1,
  month: -1,
});

module.exports = mongoose.model("ElectricityBill", electricityBillSchema);
