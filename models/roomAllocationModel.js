const mongoose = require("mongoose");

const roomAllocationSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner ID is required."],
    },

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: [true, "Tenant ID is required."],
    },

    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property ID is required."],
    },

    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "Room ID is required."],
    },

    joiningDate: {
      type: Date,
      required: [true, "Joining date is required."],
    },

    leavingDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["Active", "Completed"],
      default: "Active",
    },

    remarks: {
      type: String,
      trim: true,
      maxlength: [500, "Remarks cannot exceed 500 characters."],
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// ======================================================
// INDEXES
// ======================================================

roomAllocationSchema.index({ ownerId: 1 });

roomAllocationSchema.index({ tenantId: 1 });

roomAllocationSchema.index({ roomId: 1 });

roomAllocationSchema.index({ propertyId: 1 });

roomAllocationSchema.index({ status: 1 });

roomAllocationSchema.index({
  ownerId: 1,
  tenantId: 1,
  roomId: 1,
});

module.exports = mongoose.model(
  "RoomAllocation",
  roomAllocationSchema
);
