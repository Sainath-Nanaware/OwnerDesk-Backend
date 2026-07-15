const Room = require("../models/roomModel");
const Property = require("../models/propertyModel");
const { newRoomValidationSchema } = require("../validation/roomValidation");
const logger = require("../logs/logger");
const mongoose = require("mongoose");
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

exports.getAllRoomsByProperty = async (req, resp) => {
  logger.info("Fetching all rooms of property...");

  try {
    const { ownerId, propertyId } = req.params;

    // ==========================================
    // STEP 1 : Validate MongoDB ObjectIds
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      logger.warn(`Invalid Owner ID : ${ownerId}`);

      return errorResponse(resp, "Invalid Owner ID.", 400, null);
    }

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      logger.warn(`Invalid Property ID : ${propertyId}`);

      return errorResponse(resp, "Invalid Property ID.", 400, null);
    }

    // ==========================================
    // STEP 2 : Verify Property belongs to Owner
    // (Single Database Query)
    // ==========================================

    const property = await Property.findOne({
      _id: propertyId,
      ownerId: ownerId,
    }).select("_id propertyName totalRooms occupiedRooms");

    if (!property) {
      logger.warn(`Property ${propertyId} not found for owner ${ownerId}`);

      return errorResponse(
        resp,
        "Property not found for the specified owner.",
        404,
        null
      );
    }

    // ==========================================
    // STEP 3 : Pagination
    // ==========================================

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    // ==========================================
    // STEP 4 : Fetch Rooms & Count in Parallel
    // ==========================================

    const [rooms, totalRecords] = await Promise.all([
      Room.find({ propertyId })
        .sort({ roomNumber: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Room.countDocuments({ propertyId }),
    ]);

    // ==========================================
    // STEP 5 : Pagination Metadata
    // ==========================================

    const totalPages = Math.ceil(totalRecords / limit);

    const responseData = {
      property: {
        propertyId: property._id,
        propertyName: property.propertyName,
        totalRooms: property.totalRooms,
        occupiedRooms: property.occupiedRooms,
      },

      rooms,

      pagination: {
        totalRecords,
        currentPage: page,
        totalPages,
        pageSize: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };

    logger.info(
      `${rooms.length} rooms fetched successfully for property ${propertyId}`
    );

    return successResponse(
      resp,
      responseData,
      "Rooms fetched successfully.",
      200
    );
  } catch (error) {
    logger.error(`Get Rooms Error : ${error.message}`);

    return errorResponse(resp, "Internal server error.", 500, error);
  }
}