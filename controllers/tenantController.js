const Tenant = require("../models/tenantModel");
const User = require("../models/userModel");

const logger = require("../logs/logger");
const { successResponse, errorResponse } = require("../utils/responseHandler");


const {
  createTenantValidationSchema,
} = require("../validation/tenantValidation");

exports.addNewTenant = async (req, resp) => {
  logger.info("Creating new tenant...");

  try {
    // =====================================================
    // STEP 1 : Logged-in Owner
    // =====================================================
    // console.log(req.body.ownerId);
    const ownerId = req.body.ownerId;

    // =====================================================
    // STEP 2 : Validate Request Body
    // =====================================================

    // done with schema validation middleware

    // =====================================================
    // STEP 3 : Verify Owner Exists
    // =====================================================

    const ownerExists = await User.exists({ _id: ownerId });

    if (!ownerExists) {
      logger.warn(`Owner not found : ${ownerId}`);

      return errorResponse(resp, "Owner account not found.", 404, null);
    }

    // =====================================================
    // STEP 4 : Create Tenant
    // =====================================================

    const tenant = await Tenant.create(req.body);

    logger.info(`Tenant created successfully : ${tenant._id}`);

    return successResponse(resp, tenant, "Tenant created successfully.", 201);
  } catch (error) {
    // =====================================================
    // STEP 5 : Duplicate Entry Handling
    // =====================================================

    if (error.code === 11000) {
      // Duplicate Phone
      if (error.keyPattern?.phone) {
        return errorResponse(
          resp,
          "A tenant with this phone number already exists.",
          409,
          null
        );
      }

      // Duplicate Email
      if (error.keyPattern?.email) {
        return errorResponse(
          resp,
          "A tenant with this email already exists.",
          409,
          null
        );
      }

      // Duplicate ID Proof
      if (error.keyPattern?.idProofType && error.keyPattern?.idProofNumber) {
        return errorResponse(
          resp,
          "A tenant with this ID proof already exists.",
          409,
          null
        );
      }

      return errorResponse(resp, "Duplicate record found.", 409, null);
    }

    // =====================================================
    // STEP 6 : Internal Server Error
    // =====================================================

    logger.error(`Create Tenant Error : ${error.message}`);

    return errorResponse(resp, "Internal server error.", 500, error);
  }
};
