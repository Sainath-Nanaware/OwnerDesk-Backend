const Joi = require("joi");

const createRoomAllocationSchema = Joi.object({
  ownerId: Joi.string().hex().length(24).required().messages({
    "string.base": "Owner ID must be a string.",
    "string.empty": "Owner ID is required.",
    "string.hex": "Owner ID must be a valid MongoDB ObjectId.",
    "string.length": "Owner ID must be a valid MongoDB ObjectId.",
    "any.required": "Owner ID is required.",
  }),

  tenantId: Joi.string().hex().length(24).required().messages({
    "string.base": "Tenant ID must be a string.",
    "string.empty": "Tenant ID is required.",
    "string.hex": "Tenant ID must be a valid MongoDB ObjectId.",
    "string.length": "Tenant ID must be a valid MongoDB ObjectId.",
    "any.required": "Tenant ID is required.",
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

  joiningDate: Joi.date().required().messages({
    "date.base": "Joining date must be a valid date.",
    "any.required": "Joining date is required.",
  }),

  leavingDate: Joi.date().allow(null).optional().messages({
    "date.base": "Leaving date must be a valid date.",
  }),

  status: Joi.string().valid("Active", "Completed").optional().messages({
    "any.only": "Status must be either Active or Completed.",
  }),

  remarks: Joi.string().trim().max(500).allow("").optional().messages({
    "string.max": "Remarks cannot exceed 500 characters.",
  }),
});

const deallocateRoomSchema = Joi.object({
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

  leavingDate: Joi.date().required().messages({
    "date.base": "Leaving date must be a valid date.",
    "any.required": "Leaving date is required.",
  }),

  remarks: Joi.string().trim().max(500).allow("").optional().messages({
    "string.max": "Remarks cannot exceed 500 characters.",
  }),
});


module.exports = {
  createRoomAllocationSchema,
  deallocateRoomSchema,
};
