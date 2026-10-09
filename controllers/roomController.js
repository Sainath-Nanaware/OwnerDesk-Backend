const Room = require("../models/roomModel");
const Property = require("../models/propertyModel");
const { newRoomValidationSchema } = require("../validation/roomValidation");
const logger = require("../logs/logger");
const mongoose = require("mongoose");
const { successResponse, errorResponse } = require("../utils/responseHandler");
const Tenant = require("../models/tenantModel");
const RoomAllocation = require("../models/roomAllocationModel");
const ElectricityBill = require("../models/electricityBillModel");
const PaymentStatus = require("../models/paymentStatusModel");
const dayjs = require("dayjs");

exports.addNewRoom = async (req, resp) => {
  logger.info("Creating new room...");

  try {
    // ==========================================
    // STEP 1 : Validate Request Body
    // ==========================================
    // Joi validation middleware handles this.

    // ==========================================
    // STEP 2 : Verify Property belongs to Owner
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

    // ⭐ CHANGED
    // Before:
    //
    // const totalExistingRooms = await Room.countDocuments({
    //   propertyId: req.body.propertyId,
    // });
    //
    // Now we count ONLY active rooms.

    const totalExistingRooms = await Room.countDocuments({
      propertyId: req.body.propertyId,
      isDeleted: false, // ⭐ CHANGED
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
    // STEP 4 : Check Room Number
    // ==========================================

    // ⭐ CHANGED
    // Check only active rooms.
    //
    // If Room 101 is deleted:
    //
    // Room 101 -> isDeleted: true
    //
    // then creating Room 101 again is allowed.

    const existingRoom = await Room.findOne({
      propertyId: req.body.propertyId,
      roomNumber: req.body.roomNumber,
      isDeleted: false, // ⭐ CHANGED
    }).select("_id roomNumber");

    if (existingRoom) {
      logger.warn(
        `Room number ${req.body.roomNumber} already exists in property ${req.body.propertyId}`
      );

      return errorResponse(
        resp,
        "Room number already exists in this property.",
        409,
        null
      );
    }

    // ==========================================
    // STEP 5 : Create Room
    // ==========================================

    const room = await Room.create({
      ...req.body,

      // ⭐ CHANGED
      // Every newly created room must be active.
      isDeleted: false,

      // ⭐ Recommended
      // Every newly created room should initially be vacant.
      isOccupied: false,
      currentTenantId: null,
    });

    // ==========================================
    // STEP 6 : Success Response
    // ==========================================

    logger.info(`Room created successfully : ${room._id}`);

    return successResponse(resp, room, "Room created successfully.", 201);
  } catch (error) {
    // ==========================================
    // STEP 7 : Duplicate Room Number
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

    // ==========================================
    // STEP 8 : Other Errors
    // ==========================================

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
      isDeleted: false,
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

/*following search API is perform search opration on multiple factors if we change that fators boolen values or enum values 
we need update api logic also 
*/
exports.searchRoomsByProperty = async (req, resp) => {
  logger.info("Searching rooms within property...");

  try {
    // =====================================================
    // STEP 1 : Get Logged-in Owner & Property ID
    // =====================================================

    // const ownerId = req.user.id;
    const { propertyId } = req.params;

    // =====================================================
    // STEP 2 : Validate Property ID
    // =====================================================

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      logger.warn(`Invalid Property ID : ${propertyId}`);

      return errorResponse(resp, "Invalid Property ID.", 400, null);
    }

    // =====================================================
    // STEP 3 : Verify Property Exists and Belongs to Owner
    // =====================================================

    const property = await Property.findOne({
      _id: propertyId
      // ownerId,
    }).select("_id propertyName");

    if (!property) {
      logger.warn(`Property ${propertyId} not found for owner ${ownerId}`);

      return errorResponse(resp, "Property not found.", 404, null);
    }

    // =====================================================
    // STEP 4 : Read Search Filters
    // =====================================================

    const {
      roomNumber,
      roomType,
      floor,
      isOccupied,
      page = 1,
      limit = 10,
    } = req.query;

    // =====================================================
    // STEP 5 : Pagination
    // =====================================================

    const currentPage = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(limit), 1);
    const skip = (currentPage - 1) * pageSize;

    // =====================================================
    // STEP 6 : Build Dynamic Filter
    // =====================================================

    const filter = {
      propertyId,
      isDeleted: false,
    };

    if (roomNumber) {
      filter.roomNumber = Number(roomNumber);
    }

    if (roomType) {
      console.log(roomType)
      filter.roomType = roomType;
    }

    if (floor) {
      filter.floor = Number(floor);
    }

    if (isOccupied !== undefined) {
      filter.isOccupied = isOccupied === "true";
    }

    // =====================================================
    // STEP 7 : Fetch Rooms and Count in Parallel
    // =====================================================

    // const [rooms, totalRecords] = await Promise.all([
    //   Room.find(filter)
    //     .sort({ roomNumber: 1 })
    //     .skip(skip)
    //     .limit(pageSize)
    //     // .populate("currentTenantId", "fullName phone")
    //     .lean(),

    //   Room.countDocuments(filter),
    // ]);

    //above is old code we need to get tenant more info then we add following code 

    const [rooms, totalRecords] = await Promise.all([
      Room.find(filter)
        .sort({ roomNumber: 1 })
        .skip(skip)
        .limit(pageSize)

        // ✅ NEW: Fetch tenant details from Tenant model
        .populate("currentTenantId", "fullName phone email")

        .lean(),

      Room.countDocuments(filter),
    ]);



    // =====================================================
    // STEP 8 : Prepare Response
    // =====================================================

    const totalPages = Math.ceil(totalRecords / pageSize);

    const responseData = {
      property: {
        propertyId: property._id,
        propertyName: property.propertyName,
      },

      rooms,

      pagination: {
        totalRecords,
        currentPage,
        totalPages,
        pageSize,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    };

    logger.info(`${rooms.length} room(s) found.`);

    return successResponse(
      resp,
      responseData,
      "Rooms fetched successfully.",
      200
    );
  } catch (error) {
    logger.error(`Search Room Error : ${error.message}`);

    return errorResponse(resp, "Internal server error.", 500, error);
  }
};




exports.allocateRoom = async (req, res) => {
  const session = await mongoose.startSession();
  logger.info("In allocateRoom tenant controller!")

  try {
    const { ownerId, propertyId, roomId, tenantId, remarks } =
      req.body;

    session.startTransaction();

    //---------------------------------------------------------
    // Verify Property
    //---------------------------------------------------------
    const property = await Property.findOne({
      _id: propertyId,
      ownerId,
    }).session(session);

    if (!property) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    //---------------------------------------------------------
    // Verify Room
    //---------------------------------------------------------
    const room = await Room.findOne({
      _id: roomId,
      propertyId,
      ownerId,
    }).session(session);

    if (!room) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Room not found.",
      });
    }

    if (room.isOccupied) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Room is already occupied.",
      });
    }

    //---------------------------------------------------------
    // Verify Tenant
    //---------------------------------------------------------
    const tenant = await Tenant.findOne({
      _id: tenantId,
      ownerId,
    }).session(session);

    if (!tenant) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Tenant not found.",
      });
    }

    if (tenant.status=="Active") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Tenant is already allocated to another room.",
      });
    }

    //---------------------------------------------------------
    // Update Room
    //---------------------------------------------------------
    room.isOccupied = true;
    room.currentTenantId = tenant._id;

    await room.save({ session });

    //---------------------------------------------------------
    // Update Tenant
    //---------------------------------------------------------
    tenant.status = "Active";

    await tenant.save({ session });

    //---------------------------------------------------------
    // Update Property
    //---------------------------------------------------------
    property.occupiedRooms += 1;

    await property.save({ session });

    //---------------------------------------------------------
    // Create Allocation History
    //---------------------------------------------------------
    const history = await RoomAllocation.create(
      [
        {
          ownerId,
          tenantId,
          propertyId,
          roomId,
          joiningDate:dayjs().format('YYYY-MM-DD'),// get current date
          remarks,
        },
      ],
      { session }
    );

    //---------------------------------------------------------
    // Commit Transaction
    //---------------------------------------------------------
    await session.commitTransaction();
    logger.info("Room allocated successfully");

    return res.status(200).json({
      success: true,
      message: "Room allocated successfully.",
      data: {
        property: {
          id: property._id,
          propertyName: property.propertyName,
          occupiedRooms: property.occupiedRooms,
        },
        room: {
          id: room._id,
          roomNumber: room.roomNumber,
          occupancyStatus: room.occupancyStatus,
        },
        tenant: {
          id: tenant._id,
          fullName: tenant.fullName,
          status: tenant.status,
        },
        roomAllocation: history[0],
      },
    });
  } catch (error) {
    await session.abortTransaction();
    logger.warn("room allocation failed!")
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};


exports.deallocateRoom = async (req, res) => {
  const session = await mongoose.startSession();
  logger.info("In deallocate tenant!")

  try {
    const { ownerId, propertyId, roomId, remarks } = req.body;

    session.startTransaction();

    //---------------------------------------------------------
    // Verify Property
    //---------------------------------------------------------
    const property = await Property.findOne({
      _id: propertyId,
      ownerId,
    }).session(session);

    if (!property) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    //---------------------------------------------------------
    // Verify Room
    //---------------------------------------------------------
    const room = await Room.findOne({
      _id: roomId,
      ownerId,
      propertyId,
    }).session(session);

    if (!room) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Room not found.",
      });
    }

    if (!room.isOccupied) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Room is already vacant.",
      });
    }

    //---------------------------------------------------------
    // Get Current Tenant
    //---------------------------------------------------------
    const tenant = await Tenant.findOne({
      _id: room.currentTenantId,
      ownerId,
    }).session(session);

    if (!tenant) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Current tenant not found.",
      });
    }

    //---------------------------------------------------------
    // Find Active Allocation
    //---------------------------------------------------------
    const allocation = await RoomAllocation.findOne({
      ownerId,
      propertyId,
      roomId,
      tenantId: tenant._id,
      leavingDate: null,
    }).session(session);

    if (!allocation) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Active room allocation record not found.",
      });
    }

    //---------------------------------------------------------
    // Update Room
    //---------------------------------------------------------
    room.isOccupied = false;
    room.currentTenantId = null;

    await room.save({ session });

    //---------------------------------------------------------
    // Update Tenant
    //---------------------------------------------------------
    tenant.status = "Inactive";

    await tenant.save({ session });

    //---------------------------------------------------------
    // Update Property
    //---------------------------------------------------------
    if (property.occupiedRooms > 0) {
      property.occupiedRooms -= 1;
    }

    await property.save({ session });

    //---------------------------------------------------------
    // Update Allocation History
    //---------------------------------------------------------
    allocation.status = "Completed" || allocation.status;
    allocation.leavingDate = dayjs().format("YYYY-MM-DD") || new Date(); // get current date
    allocation.remarks = remarks || allocation.remarks;


    //---------------------------------------------------------
    // Commit Transaction
    //---------------------------------------------------------
    await session.commitTransaction();
    logger.info("Room deallocated successfully.");
    return res.status(200).json({
      success: true,
      message: "Room deallocated successfully.",
      data: {
        property: {
          id: property._id,
          propertyName: property.propertyName,
          occupiedRooms: property.occupiedRooms,
        },

        room: {
          id: room._id,
          roomNumber: room.roomNumber,
          isOccupied: room.isOccupied,
        },

        tenant: {
          id: tenant._id,
          fullName: tenant.fullName,
          status: tenant.status,
        },

        roomAllocation: allocation,
      },
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Room Deallocation Error:", error);
    looger.warn("Room deallocation failed!.");

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};



exports.roomInfo = async (req, res) => {
  logger.info("get room Info by roomID")
  try {
    const { roomId } = req.params;
    const { ownerId, month, year } = req.query;

    //-----------------------------------------------------
    // Validate Required Fields
    //-----------------------------------------------------
    if (!ownerId || !month || !year) {
      logger.warn("ownerId, month and year are required.")
      return res.status(400).json({
        success: false,
        message: "ownerId, month and year are required.",
      });
    }

    //-----------------------------------------------------
    // Find Room
    //-----------------------------------------------------
    const room = await Room.findOne({
      _id: roomId,
      ownerId,
    }).lean();

    if (!room) {
      logger.warn("RoomID not found!")
      return res.status(404).json({
        success: false,
        message: "Room not found.",
      });
    }

    //-----------------------------------------------------
    // Find Property
    //-----------------------------------------------------
    const property = await Property.findById(room.propertyId)
      .select("propertyName address")
      .lean();

    //-----------------------------------------------------
    // Find Current Tenant
    //-----------------------------------------------------
    let tenant = null;

    if (room.currentTenantId) {
      tenant = await Tenant.findById(room.currentTenantId)
        .select("-__v")
        .lean();
    }

    //-----------------------------------------------------
    // Find Electricity Bill
    //-----------------------------------------------------
    const electricityBill = await ElectricityBill.findOne({
      ownerId,
      roomId,
      month,
      year,
    }).lean();

    //-----------------------------------------------------
    // Find Payment Status
    //-----------------------------------------------------
    const paymentStatus = await PaymentStatus.findOne({
      ownerId,
      roomId,
      month,
      year,
    }).lean();

    //-----------------------------------------------------
    // Response
    //-----------------------------------------------------
    return res.status(200).json({
      success: true,
      message: "Room Info fetched successfully.",

      data: {
        property,

        room: {
          _id: room._id,
          roomNumber: room.roomNumber,
          roomType: room.roomType,
          floor: room.floor,
          monthlyRent: room.monthlyRent,
          deposit: room.deposit,
          isOccupied: room.isOccupied,
          remarks: room.remarks,
        },

        tenant,

        electricityBill: electricityBill || null,

        paymentStatus: paymentStatus || null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });
  }
};

exports.updateRoom = async (req, res) => {
  const session = await mongoose.startSession();
  logger.info("in update room info controller!")

  try {
    const { roomId } = req.params;
    const { ownerId } = req.body;

    //----------------------------------------------------------
    // Start Transaction
    //----------------------------------------------------------

    session.startTransaction();

    //----------------------------------------------------------
    // Find Room
    //
    // We verify ownerId also so that one owner cannot update
    // another owner's room.
    //----------------------------------------------------------

    const room = await Room.findOne({
      _id: roomId,
      ownerId,
    }).session(session);

    //----------------------------------------------------------
    // Room Not Found
    //----------------------------------------------------------

    if (!room) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Room not found.",
      });
    }

    //----------------------------------------------------------
    // Get fields which are allowed to update
    //----------------------------------------------------------

    const { roomNumber, roomType, floor, monthlyRent, deposit, isDeleted } = req.body;

    //----------------------------------------------------------
    // Check if Room Number is being changed
    //----------------------------------------------------------

    if (roomNumber !== undefined && roomNumber !== room.roomNumber) {
      //--------------------------------------------------------
      // Check duplicate room number inside same property
      //--------------------------------------------------------

      const existingRoom = await Room.findOne({
        _id: { $ne: roomId },
        propertyId: room.propertyId,
        roomNumber,
      }).session(session);

      if (existingRoom) {
        await session.abortTransaction();

        return res.status(409).json({
          success: false,
          message: "Room number already exists in this property.",
        });
      }

      room.roomNumber = roomNumber;
    }

    //----------------------------------------------------------
    // Update Room Type
    //----------------------------------------------------------

    if (roomType !== undefined) {
      room.roomType = roomType;
    }

    //----------------------------------------------------------
    // Update Floor
    //----------------------------------------------------------

    if (floor !== undefined) {
      room.floor = floor;
    }

    //----------------------------------------------------------
    // Update Monthly Rent
    //----------------------------------------------------------

    if (monthlyRent !== undefined) {
      room.monthlyRent = monthlyRent;
    }

    //----------------------------------------------------------
    // Update Deposit
    //----------------------------------------------------------

    if (deposit !== undefined) {
      room.deposit = deposit;
    }
    //isDeleted update

     if (isDeleted !== undefined) {
       room.isDeleted = isDeleted;
     }

    //----------------------------------------------------------
    // IMPORTANT
    //
    // We intentionally DO NOT update:
    //
    // ownerId
    // propertyId
    // isOccupied
    // currentTenantId
    //
    // These fields are controlled by other business APIs.
    //----------------------------------------------------------

    //----------------------------------------------------------
    // Save Room
    //----------------------------------------------------------

    await room.save({ session });

    //----------------------------------------------------------
    // Commit Transaction
    //----------------------------------------------------------

    await session.commitTransaction();

    //----------------------------------------------------------
    // Return Updated Room
    //----------------------------------------------------------
    logger.info("Room updated successfully")
    return res.status(200).json({
      success: true,
      message: "Room updated successfully.",
      data:room
    });
  } catch (error) {
    //----------------------------------------------------------
    // Rollback Transaction
    //----------------------------------------------------------

    await session.abortTransaction();

    //----------------------------------------------------------
    // Handle Duplicate Key Error
    //
    // This is an additional safety check for the unique index:
    //
    // propertyId + roomNumber
    //----------------------------------------------------------

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Room number already exists in this property.",
      });
    }

    //----------------------------------------------------------
    // Internal Server Error
    //----------------------------------------------------------

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });
  } finally {
    //----------------------------------------------------------
    // End MongoDB Session
    //----------------------------------------------------------

    await session.endSession();
  }
};


//we perform soft delete means record not permenat delete from DB only we change status of  isDeleted:true,
//1st we need deallocate and then perform soft delete opration:

exports.deleteRoom = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { roomId } = req.params;
    const { ownerId } = req.params;

    //----------------------------------------------------------
    // Validate ObjectIds
    //----------------------------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(roomId) ||
      !mongoose.Types.ObjectId.isValid(ownerId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid roomId or ownerId.",
      });
    }

    //----------------------------------------------------------
    // Start Transaction
    //----------------------------------------------------------

    session.startTransaction();

    //----------------------------------------------------------
    // Find Room
    //
    // isDeleted:false means we only allow deletion of an
    // active room.
    //----------------------------------------------------------

    const room = await Room.findOne({
      _id: roomId,
      ownerId,
      isDeleted: false,
    }).session(session);

    //----------------------------------------------------------
    // Room Not Found
    //----------------------------------------------------------

    if (!room) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Room not found.",
      });
    }

    //----------------------------------------------------------
    // Don't Delete Occupied Room
    //----------------------------------------------------------

    if (room.isOccupied || room.currentTenantId) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message:
          "Occupied room cannot be deleted. Please deallocate the tenant first.",
      });
    }

    //----------------------------------------------------------
    // Soft Delete Room
    //----------------------------------------------------------

    room.isDeleted = true;

    await room.save({ session });

    //----------------------------------------------------------
    // Commit Transaction
    //----------------------------------------------------------

    await session.commitTransaction();

    //----------------------------------------------------------
    // Response
    //----------------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Room deleted successfully.",
      data: {
        roomId: room._id,
        roomNumber: room.roomNumber,
        isDeleted: room.isDeleted,
      },
    });
  } catch (error) {
    //----------------------------------------------------------
    // Rollback Transaction
    //----------------------------------------------------------

    await session.abortTransaction();

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });
  } finally {
    //----------------------------------------------------------
    // End Session
    //----------------------------------------------------------

    await session.endSession();
  }
};


exports.updateRemark = async (req, res) => {
  logger.info("In update remark")
  try {
    const { roomId } = req.params;
    const  { remarks }    = req.body;

    // 1. Validate roomId
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid roomId.",
      });
    }

    // 2. Find room
    const room = await Room.findById(roomId);

    if (!room) {
      logger.error("room Id is invalid!")
      return res.status(404).json({
        success: false,
        message: "Room not found.",
      });
    }

    // 3. Update remarks
    room.remarks = remarks;

    // 4. Save room
    await room.save();
    logger.info("Room remark updated successfully.");
    // 5. Response
    return res.status(200).json({
      success: true,
      message: "Room remark updated successfully.",
      data: {
        roomId: room._id,
        remarks: room.remarks,
      },
    });
  } catch (error) {
    logger.error("Update Remark Error:", error);
    console.error("Update Remark Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

