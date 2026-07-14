const Room = require("../models/roomModel");
const Property = require("../models/propertyModel");
const { newRoomValidationSchema } = require("../validation/roomValidation");
const logger = require("../logs/logger");
const { successResponse, errorResponse } = require("../utils/responseHandler");


exports.addNewRoom = async (req, resp) => {
  logger.info("Creating new room...");

  try {
    // ==========================================
    // STEP 1 : Validate Request Body
    // ==========================================
    //it's done bu joi validation middleware
    // ==========================================
    // STEP 2 : Verify Property belongs to Owner
    // Single Query
    // ==========================================

    const property = await Property.findOne({
      _id: req.body.propertyId,
      ownerId: req.body.ownerId,
    }).select("_id totalRooms");

    if (!property) {
      logger.warn(
        `Property ${req.body.propertyId} not found for owner ${req.body.ownerId}`
      );

      return errorResponse(
        resp,
        "Property not found for the specified owner.",
        404,
        null
      );
    }

    // ==========================================
    // STEP 3 : Check Property Capacity
    // ==========================================

    const totalExistingRooms = await Room.countDocuments({
      propertyId: req.body.propertyId,
    });

    if (totalExistingRooms >= property.totalRooms) {
      logger.warn(
        `Property capacity reached. Property ID : ${req.body.propertyId}`
      );

      return errorResponse(
        resp,
        `Maximum room limit (${property.totalRooms}) reached for this property.`,
        400,
        null
      );
    }

    // ==========================================
    // STEP 4 : Create Room
    // Duplicate room numbers are handled by
    // MongoDB Unique Index
    // ==========================================

    const room = await Room.create(req.body);

    logger.info(`Room created successfully : ${room._id}`);

    return successResponse(resp, room, "Room created successfully.", 201);
  } catch (error) {
    // ==========================================
    // Duplicate Room Number
    // ==========================================

    if (error.code === 11000) {
      logger.warn(
        `Duplicate room number ${req.body.roomNumber} for property ${req.body.propertyId}`
      );

      return errorResponse(
        resp,
        "Room number already exists in this property.",
        409,
        null
      );
    }

    logger.error(`Create Room Error : ${error.message}`);

    return errorResponse(resp, "Internal server error.", 500, error);
  }
};
