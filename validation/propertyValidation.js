const Joi = require("joi");

const newPropertyValidationSchema = Joi.object({
  ownerId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/) // MongoDB ObjectId format
    .required()
    .messages({
      "string.pattern.base": "ownerId must be a valid MongoDB ObjectId",
      "any.required": "ownerId is required",
    }),

  propertyName: Joi.string().trim().min(3).max(50).required().messages({
    "string.empty": "Property name cannot be empty",
    "any.required": "Property name is required",
  }),

  address: Joi.string().trim().min(5).max(200).required().messages({
    "string.empty": "Address cannot be empty",
    "any.required": "Address is required",
  }),

  city: Joi.string().trim().min(3).max(30).required().messages({
    "string.empty": "City cannot be empty",
    "any.required": "City is required",
  }),

  state: Joi.string().trim().min(3).max(30).required().messages({
    "string.empty": "State cannot be empty",
    "any.required": "State is required",
  }),

  pincode: Joi.string()
    .pattern(/^[1-9][0-9]{5}$/) // Indian pincode: 6 digits, not starting with 0
    .required()
    .messages({
      "string.pattern.base":
        "Pincode must be a valid 6-digit Indian postal code",
      "any.required": "Pincode is required",
    }),
  totalRooms: Joi.number().integer().min(1).required().messages({
    "number.base": "Total rooms must be a number.",
    "number.integer": "Total rooms must be an integer.",
    "number.min": "Total rooms must be at least 1.",
    "any.required": "Total rooms is required.",
  }),

  occupiedRooms: Joi.number()
    .integer()
    .min(0)
    .max(Joi.ref("totalRooms"))
    .default(0)
    .messages({
      "number.base": "Occupied rooms must be a number.",
      "number.integer": "Occupied rooms must be an integer.",
      "number.min": "Occupied rooms cannot be negative.",
      "number.max": "Occupied rooms cannot be greater than total rooms.",
    }),
});

// Relaxed schema for UPDATE (all fields optional)
const propertyUpdateSchema = newPropertyValidationSchema.fork(
  [
    "ownerId",
    "propertyName",
    "address",
    "city",
    "state",
    "pincode",
    "totalRooms",
    "occupiedRooms",
  ],
  (field) => field.optional()
);

module.exports={newPropertyValidationSchema, propertyUpdateSchema}