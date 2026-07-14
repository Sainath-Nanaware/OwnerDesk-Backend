const mongoose = require("mongoose");
const ROOM_TYPES = require("../utils/constants");

const roomSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner ID is required"],
      validate: {
        validator: mongoose.Types.ObjectId.isValid,
        message: "Invalid Owner ID",
      },
      index: true,
    },

    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property ID is required"],
      validate: {
        validator: mongoose.Types.ObjectId.isValid,
        message: "Invalid Property ID",
      },
      index: true,
    },

    roomNumber: {
      type: Number,
      required: [true, "Room number is required"],
      min: [1, "Room number must be greater than 0"],
    },
    
    roomType: {
      type: String,
      enum: ROOM_TYPES,
      required: [true, "Room type is required"],
    },

    floor: {
      type: Number,
      required: [true, "Floor number is required"],
      min: [0, "Floor number cannot be negative"],
    },

    monthlyRent: {
      type: Number,
      required: [true, "Monthly rent is required"],
      min: [1, "Monthly rent must be greater than 0"],
    },

    deposit: {
      type: Number,
      default: 0,
      min: [0, "Deposit amount cannot be negative"],
    },

    isOccupied: {
      type: Boolean,
      default: false,
      index: true,
    },

    currentTenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null,
      validate: {
        validator: function (value) {
          return value === null || mongoose.Types.ObjectId.isValid(value);
        },
        message: "Invalid Tenant ID",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Business Rule:
 * If room is occupied, a tenant must exist.
 * If room is vacant, currentTenantId should always be null.
 */
roomSchema.pre("save", function (next) {
  if (this.isOccupied && !this.currentTenantId) {
    return next(
      new Error("Current Tenant ID is required when the room is occupied.")
    );
  }

  if (!this.isOccupied) {
    this.currentTenantId = null;
  }

//   next();
});

/**
 * Compound Unique Index
 * Room number must be unique within a property.
 */
roomSchema.index(
  {
    propertyId: 1,
    roomNumber: 1,
  },
  {
    unique: true,
  }
);

/**
 * Frequently used query index
 */
roomSchema.index({
  ownerId: 1,
  propertyId: 1,
  isOccupied: 1,
});

module.exports = mongoose.model("Room", roomSchema);
