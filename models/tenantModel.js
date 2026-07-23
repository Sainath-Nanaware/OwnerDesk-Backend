const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    // =====================================================
    // Owner Reference
    // =====================================================
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner ID is required."],
      index: true,
    },

    // =====================================================
    // Tenant Name
    // =====================================================
    fullName: {
      type: String,
      required: [true, "Tenant full name is required."],
      trim: true,
      minlength: [3, "Full name must be at least 3 characters."],
      maxlength: [100, "Full name cannot exceed 100 characters."],
    },

    // =====================================================
    // Phone Number
    // =====================================================
    phone: {
      type: String,
      required: [true, "Phone number is required."],
      trim: true,
      unique: true,
      validate: {
        validator: function (value) {
          return /^[6-9]\d{9}$/.test(value);
        },
        message: "Please provide a valid Indian mobile number.",
      },
    },

    // =====================================================
    // Email
    // =====================================================
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      validate: {
        validator: function (value) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: "Please provide a valid email address.",
      },
    },

    // =====================================================
    // ID Proof Type
    // =====================================================
    idProofType: {
      type: String,
      required: [true, "ID proof type is required."],
      enum: {
        values: [
          "Aadhaar",
          "PAN",
          "Passport",
          "Driving License",
          "Voter ID",
          "Other",
        ],
        message: "{VALUE} is not a valid ID proof type.",
      },
    },

    // =====================================================
    // ID Proof Number
    // =====================================================
    idProofNumber: {
      type: String,
      required: [true, "ID proof number is required."],
      trim: true,
      uppercase: true,
    },

    // =====================================================
    // Tenant Status
    // =====================================================
    status: {
      type: String,
      enum: {
        values: ["Active", "Inactive"],
        message: "{VALUE} is not a valid tenant status.",
      },
      default: "Inactive",
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// Compound Indexes
// =====================================================

// Prevent duplicate ID proof for the same owner
tenantSchema.index(
  {
    ownerId: 1,
    idProofType: 1,
    idProofNumber: 1,
  },
  {
    unique: true,
  }
);

// Prevent duplicate phone numbers for the same owner
tenantSchema.index(
  {
    ownerId: 1,
    phone: 1,
  },
  {
    unique: true,
  }
);

// Fast searching
tenantSchema.index({
  ownerId: 1,
  fullName: 1,
});

module.exports = mongoose.model("Tenant", tenantSchema);
