const Joi = require("joi");

// =====================================================
// Common MongoDB ObjectId Validation
// =====================================================
const objectId = Joi.string().hex().length(24).required().messages({
  "string.base": "Owner ID must be a string.",
  "string.empty": "Owner ID is required.",
  "string.hex": "Owner ID must be a valid MongoDB ObjectId.",
  "string.length": "Owner ID must be a valid MongoDB ObjectId.",
  "any.required": "Owner ID is required.",
});

// =====================================================
// Create Tenant Validation
// =====================================================
const createTenantValidationSchema = Joi.object({
  // Owner ID
  ownerId: objectId,

  // Full Name
  fullName: Joi.string().trim().min(3).max(100).required().messages({
    "string.base": "Full name must be a string.",
    "string.empty": "Full name is required.",
    "string.min": "Full name must contain at least 3 characters.",
    "string.max": "Full name cannot exceed 100 characters.",
    "any.required": "Full name is required.",
  }),

  // Phone Number
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      "string.base": "Phone number must be a string.",
      "string.empty": "Phone number is required.",
      "string.pattern.base":
        "Please enter a valid 10-digit Indian mobile number.",
      "any.required": "Phone number is required.",
    }),

  // Email (Optional)
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .optional()
    .allow("")
    .messages({
      "string.email": "Please enter a valid email address.",
    }),

  // ID Proof Type
  idProofType: Joi.string()
    .valid("Aadhaar", "PAN", "Passport", "Driving License", "Voter ID", "Other")
    .required()
    .messages({
      "any.only":
        "ID proof type must be Aadhaar, PAN, Passport, Driving License, Voter ID or Other.",
      "string.empty": "ID proof type is required.",
      "any.required": "ID proof type is required.",
    }),

  // ID Proof Number
  idProofNumber: Joi.string()
    .trim()
    .uppercase()
    .min(5)
    .max(30)
    .required()
    .messages({
      "string.empty": "ID proof number is required.",
      "string.min": "ID proof number must contain at least 5 characters.",
      "string.max": "ID proof number cannot exceed 30 characters.",
      "any.required": "ID proof number is required.",
    }),

  // Status (Optional)
  status: Joi.string().valid("Active", "Inactive").default("Active").messages({
    "any.only": "Status must be either Active or Inactive.",
  }),
});

const updateTenantValidationSchema = createTenantValidationSchema
  .fork(
    ["fullName", "phone", "email", "idProofType", "idProofNumber", "status"],
    (field) => field.optional()
  )
  .min(1) //using patch for update info so atlist one record is required 
  .messages({
    "object.min": "Please provide at least one field to update.",
  });


module.exports = {
  createTenantValidationSchema,
  updateTenantValidationSchema,
};
