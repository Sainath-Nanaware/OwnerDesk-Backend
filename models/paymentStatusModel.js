const mongoose = require("mongoose");

const chargeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "Rent",
        "Electricity",
        "Water",
        "WiFi",
        "Motor",
        "Maintenance",
        "Parking",
        "Other",
      ],
      required: true,
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    referenceModel: {
      type: String,
      enum: ["ElectricityBill", "WaterBill", null],
      default: null,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },

    paidDate: {
      type: Date,
      default: null,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  }
);

const paymentStatusSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
      index: true,
    },

    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    year: {
      type: Number,
      required: true,
      min: 2024,
    },

    charges: {
      type: [chargeSchema],
      default: [],
    },

    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalReceived: {
      type: Number,
      default: 0,
      min: 0,
    },

    dueAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: [ "paid", "unpaid"],
      default: "unpaid",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * One payment record per tenant per month
 */
paymentStatusSchema.index(
  {
    tenantId: 1,
    month: 1,
    year: 1,
  },
  {
    unique: true,
  }
);

/**
 * Search optimization
 */
paymentStatusSchema.index({
  ownerId: 1,
  propertyId: 1,
  roomId: 1,
  year: -1,
  month: -1,
});

module.exports = mongoose.model("PaymentStatus", paymentStatusSchema);
