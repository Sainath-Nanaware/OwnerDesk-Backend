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
}).options({
  abortEarly: false,
  stripUnknown: true,
});

module.exports = {
  newRoomValidationSchema,
};
