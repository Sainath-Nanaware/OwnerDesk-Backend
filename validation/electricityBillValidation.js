const Joi = require("joi");

const createElectricityBillValidationSchema = Joi.object({
  ownerId: Joi.string().hex().length(24).required().messages({
    "string.base": "Owner ID must be a string.",
    "string.empty": "Owner ID is required.",
    "string.hex": "Owner ID must be a valid MongoDB ObjectId.",
    "string.length": "Owner ID must be a valid MongoDB ObjectId.",
    "any.required": "Owner ID is required.",
  }),

  propertyId: Joi.string().hex().length(24).required().messages({
    "string.base": "Property ID must be a string.",
    "string.empty": "Property ID is required.",
    "string.hex": "Property ID must be a valid MongoDB ObjectId.",
    "string.length": "Property ID must be a valid MongoDB ObjectId.",
    "any.required": "Property ID is required.",
  }),

  roomId: Joi.string().hex().length(24).required().messages({
    "string.base": "Room ID must be a string.",
    "string.empty": "Room ID is required.",
    "string.hex": "Room ID must be a valid MongoDB ObjectId.",
    "string.length": "Room ID must be a valid MongoDB ObjectId.",
    "any.required": "Room ID is required.",
  }),

  tenantId: Joi.string().hex().length(24).required().messages({
    "string.base": "Tenant ID must be a string.",
    "string.empty": "Tenant ID is required.",
    "string.hex": "Tenant ID must be a valid MongoDB ObjectId.",
    "string.length": "Tenant ID must be a valid MongoDB ObjectId.",
    "any.required": "Tenant ID is required.",
  }),

  month: Joi.number().integer().min(1).max(12).required().messages({
    "number.base": "Month must be a number.",
    "number.integer": "Month must be an integer.",
    "number.min": "Month must be between 1 and 12.",
    "number.max": "Month must be between 1 and 12.",
    "any.required": "Month is required.",
  }),

  year: Joi.number().integer().min(2024).required().messages({
    "number.base": "Year must be a number.",
    "number.integer": "Year must be an integer.",
    "number.min": "Year must be greater than or equal to 2024.",
    "any.required": "Year is required.",
  }),

  previousReading: Joi.number().min(0).required().messages({
    "number.base": "Previous reading must be a number.",
    "number.min": "Previous reading cannot be negative.",
    "any.required": "Previous reading is required.",
  }),

  currentReading: Joi.number().min(0).required().messages({
    "number.base": "Current reading must be a number.",
    "number.min": "Current reading cannot be negative.",
    "any.required": "Current reading is required.",
  }),

  rate: Joi.number().positive().required().messages({
    "number.base": "Rate must be a number.",
    "number.positive": "Rate must be greater than zero.",
    "any.required": "Electricity rate is required.",
  }),
  charges: Joi.array()
    .items(
      Joi.object({
        type: Joi.string()
          .valid(
            "Rent",
            "WiFi",
            "Motor",
            "Electricity",
            "Water",
            "Maintenance",
            "Parking",
            "Other"
          )
          .required()
          .messages({
            "any.required": "Charge type is required.",
            "any.only":
              "Charge type must be Rent, WiFi,Electricity, Motor, Water, Maintenance, Parking or Other.",
          }),

        amount: Joi.number().min(0).required().messages({
          "number.base": "Amount must be a number.",
          "number.min": "Amount cannot be negative.",
          "any.required": "Amount is required.",
        }),
        paidAmount: Joi.number().min(0).default(0).messages({
          "number.base": "Paid Amount must be a number.",
          "number.min": "Paid Amount cannot be negative.",
        }),

        status: Joi.string()
          .valid("Pending", "Paid")
          .default("Pending")
          .messages({
            "any.only": "Status must be Pending or Paid.",
          }),

        paidDate: Joi.date().allow(null).optional().messages({
          "date.base": "Paid date must be a valid date.",
        }),

        remarks: Joi.string().trim().max(200).allow("").optional().messages({
          "string.max": "Remarks cannot exceed 200 characters.",
        }),
      })
    )
    .default([])
    .messages({
      "array.base": "Charges must be an array.",
    }),
});

module.exports = {
  createElectricityBillValidationSchema,
};
