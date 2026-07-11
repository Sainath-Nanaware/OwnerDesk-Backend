const Property=require("../models/propertyModel")
const User=require("../models/userModel")
const logger = require("../logs/logger");
const { successResponse, errorResponse } = require("../utils/responseHandler");




exports.addNewProperty=async (req,resp)=>{
    logger.info("Adding new property")
    try {
      const ownerExists = await User.findById(req.body.ownerId);
      //check owner is present or not 
      if (!ownerExists) {
         logger.warn(`Owner ID ${req.body.ownerId} does not exist`);
         errorResponse(resp, "Owner ID does not exist in the database server error", 400, error);
      }
      const newProperty=await Property.create(req.body)
      logger.info("New property added successfully!");
      successResponse(resp,newProperty,"New property added successfully!",201)

    } catch (error) {
      logger.error("internal server error!");
      errorResponse(resp, "Internal server error", 500, error);
      console.log(error);
    }

}


// always send totalRooms and occupiedRooms count when we update any field of boath of them otherwise we get ref() error for joy schema
exports.updateProperty = async (req, resp) => {
  logger.info(`Updating property with ID: ${req.params.id}`);
  console.log(req.params.id);

//   // Joi validation (optional fields allowed)
//   const { error } = propertyUpdateSchema.validate(req.body);
//   if (error) {
//     return errorResponse(res, error.details[0].message, 400, null);
//   }

  try {
    // Check property existence
    const property = await Property.findById(req.params.id);
    if (!property) {
      logger.warn(`Property with ID ${req.params.id} not found`);
      return errorResponse(resp, "Property not found", 404, null);
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    logger.info("Property updated successfully!");
    return successResponse(
      resp,
      updatedProperty,
      "Property updated successfully!",
      200
    );
  } catch (error) {
    logger.error(`Internal server error during update: ${error.message}`);
    errorResponse(resp, "Internal server error", 500, error);
  }
};

exports.getAllProperty = async (req, resp) => {
  logger.info(
    `Getting all properties information for ownerID: ${req.params.ownerID}`
  );

  try {
    // Check if owner exists
    const ownerExists = await User.findById(req.params.ownerID);

    if (!ownerExists) {
      logger.warn(`Owner ID ${req.params.ownerID} does not exist`);

      return errorResponse(
        resp,
        "Owner ID does not exist in the database",
        400,
        null
      );
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    // Total records
    const totalProperties = await Property.countDocuments({
      ownerId: req.params.ownerID,
    });

    // Fetch paginated data
    const allProperties = await Property.find({
      ownerId: req.params.ownerID,
    })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    logger.info(
      `Found ${allProperties.length} properties for owner ${req.params.ownerID}`
    );

    return successResponse(
      resp,
      {
        properties: allProperties,

        pagination: {
          totalRecords: totalProperties,
          currentPage: page,
          totalPages: Math.ceil(totalProperties / limit),
          pageSize: limit,
          hasNextPage: page * limit < totalProperties,
          hasPreviousPage: page > 1,
        },
      },
      "All properties fetched successfully.",
      200
    );
  } catch (error) {
    logger.error(
      `Internal server error during get all properties: ${error.message}`
    );
    return errorResponse(resp, "Internal server error", 500, error);
  }
};