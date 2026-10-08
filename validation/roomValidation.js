const Joi = require("joi");
const ROOM_TYPES=require("../utils/constants")

const newRoomValidationSchema = Joi.object({
  ownerId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.base": "Owner ID must be a string.",
      "string.empty": "Owner ID is required.",
      "string.pattern.base": "Invalid Owner ID.",
      "any.required": "Owner ID is required.",
    }),

  propertyId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.base": "Property ID must be a string.",
      "string.empty": "Property ID is required.",
      "string.pattern.base": "Invalid Property ID.",
      "any.required": "Property ID is required.",
    }),

  roomNumber: Joi.number().integer().min(1).required().messages({
    "number.base": "Room number must be a number.",
    "number.integer": "Room number must be an integer.",
    "number.min": "Room number must be greater than 0.",
    "any.required": "Room number is required.",
  }),

  roomType: Joi.string()
    .valid(...ROOM_TYPES)
    .required()
    .messages({
      "any.only": "Please select a valid room type.",
      "string.empty": "Room type is required.",
      "any.required": "Room type is required.",
    }),

  floor: Joi.number().integer().min(0).required().messages({
    "number.base": "Floor number must be a number.",
    "number.integer": "Floor number must be an integer.",
    "number.min": "Floor number cannot be negative.",
    "any.required": "Floor number is required.",
  }),

  monthlyRent: Joi.number().positive().precision(2).required().messages({
    "number.base": "Monthly rent must be a number.",
    "number.positive": "Monthly rent must be greater than 0.",
    "any.required": "Monthly rent is required.",
  }),

  deposit: Joi.number().min(0).precision(2).default(0).messages({
    "number.base": "Deposit amount must be a number.",
    "number.min": "Deposit amount cannot be negative.",
  }),
  isDeleted: Joi.boolean().optional().default(false).messages({
    "boolean.base": "isDeleted must be a boolean.",
  }),
  remarks: Joi.string().trim().max(200).allow("").optional().messages({
    "string.max": "Remarks cannot exceed 200 characters.",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

const updateRoomSchema = Joi.object({
  ownerId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.base": "Owner ID must be a string.",
      "string.empty": "Owner ID is required.",
      "string.pattern.base": "Invalid Owner ID.",
      "any.required": "Owner ID is required.",
    }),

  propertyId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      "string.base": "Property ID must be a string.",
      "string.empty": "Property ID is required.",
      "string.pattern.base": "Invalid Property ID.",
      "any.required": "Property ID is required.",
    }),
  roomNumber: Joi.number().integer().min(1).optional().messages({
    "number.base": "Room number must be a number.",
    "number.integer": "Room number must be an integer.",
    "number.min": "Room number must be greater than 0.",
  }),

  roomType: Joi.string()
    .valid(...ROOM_TYPES)
    .optional()
    .messages({
      "any.only": "Invalid room type.",
    }),

  floor: Joi.number().integer().min(0).optional().messages({
    "number.base": "Floor must be a number.",
    "number.integer": "Floor must be an integer.",
    "number.min": "Floor cannot be negative.",
  }),

  monthlyRent: Joi.number().min(1).optional().messages({
    "number.base": "Monthly rent must be a number.",
    "number.min": "Monthly rent must be greater than 0.",
  }),

  deposit: Joi.number().min(0).optional().messages({
    "number.base": "Deposit must be a number.",
    "number.min": "Deposit cannot be negative.",
  }),
  isDeleted: Joi.boolean().optional().default(false).messages({
    "boolean.base": "isDeleted must be a boolean.",
  }),
  remarks: Joi.string().trim().max(200).allow("").optional().messages({
    "string.max": "Remarks cannot exceed 200 characters.",
  }),
})
  .min(1)
  .messages({
    "object.min": "At least one room field is required for update.",
  });

const updateRemarkValidation = Joi.object({
  remarks: Joi.string().trim().max(200).allow("").optional().messages({
    "string.max": "Remarks cannot exceed 200 characters.",
  }),
});

module.exports = {
  newRoomValidationSchema,
  updateRoomSchema,
  updateRemarkValidation
};
