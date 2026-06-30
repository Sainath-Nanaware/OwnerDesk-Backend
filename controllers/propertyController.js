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