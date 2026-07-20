const Tenant = require("../models/tenantModel");
const User = require("../models/userModel");
const mongoose = require("mongoose");
const logger = require("../logs/logger");
const { successResponse, errorResponse } = require("../utils/responseHandler");


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


exports.updateTenant = async (req, resp) => {
  logger.info(`Updating tenant : ${req.params.tenantId}`);

  try {
    // =====================================================
    // STEP 1 : Logged-in Owner
    // =====================================================

    const ownerId = req.body.ownerId;
    const { tenantId } = req.params;

    // =====================================================
    // STEP 2 : Validate Request Body
    // =====================================================

    // done by validation middleware

    // Prevent empty update request
    if (Object.keys(req.body).length === 0) {
      return errorResponse(
        resp,
        "Please provide at least one field to update.",
        400,
        null
      );
    }

    // =====================================================
    // STEP 3 : Verify Tenant Exists & Belongs to Owner
    // =====================================================

    const tenant = await Tenant.findOne({
      _id: tenantId,
      ownerId,
    });

    if (!tenant) {
      logger.warn(`Tenant not found : ${tenantId}`);

      return errorResponse(resp, "Tenant not found.", 404, null);
    }

    // =====================================================
    // STEP 4 : Update Tenant
    // =====================================================

    const updatedTenant = await Tenant.findByIdAndUpdate(
      tenantId,
      {
        $set: req.body,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    logger.info(`Tenant updated successfully : ${tenantId}`);

    return successResponse(
      resp,
      updatedTenant,
      "Tenant updated successfully.",
      200
    );
  } catch (error) {
    // =====================================================
    // STEP 5 : Duplicate Entry Handling
    // =====================================================

    if (error.code === 11000) {
      if (error.keyPattern?.phone) {
        return errorResponse(
          resp,
          "A tenant with this phone number already exists.",
          409,
          null
        );
      }

      if (error.keyPattern?.email) {
        return errorResponse(
          resp,
          "A tenant with this email already exists.",
          409,
          null
        );
      }

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

    logger.error(`Update Tenant Error : ${error.message}`);

    return errorResponse(resp, "Internal server error.", 500, error);
  }
};


exports.getTenantById = async (req, resp) => {
  logger.info(`Getting tenant details : ${req.params.tenantId}`);

  try {
    // =====================================================
    // STEP 1 : Get Owner & Tenant ID
    // =====================================================

    const ownerId = req.params.ownerId;
    const { tenantId } = req.params;

    // =====================================================
    // STEP 2 : Validate Tenant ID
    // =====================================================

    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return errorResponse(resp, "Invalid tenant ID.", 400, null);
    }

    // =====================================================
    // STEP 3 : Find Tenant
    // =====================================================

    const tenant = await Tenant.findOne({
      _id: tenantId,
      ownerId,
    }).lean();

    if (!tenant) {
      logger.warn(`Tenant not found : ${tenantId}`);

      return errorResponse(resp, "Tenant not found.", 404, null);
    }

    // =====================================================
    // STEP 4 : Success Response
    // =====================================================

    logger.info(`Tenant fetched successfully : ${tenantId}`);

    return successResponse(
      resp,
      tenant,
      "Tenant details fetched successfully.",
      200
    );
  } catch (error) {
    logger.error(`Get Tenant Error : ${error.message}`);

    return errorResponse(resp, "Internal server error.", 500, error);
  }
};


exports.searchTenant = async (req, resp) => {
  logger.info(`Searching tenants for owner: ${req.params.ownerId}`);

  try {
    // =====================================================
    // STEP 1 : Logged-in Owner
    // =====================================================

    const ownerId = req.params.ownerId;

    // =====================================================
    // STEP 2 : Query Parameters
    // =====================================================

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const search = req.query.search?.trim().replace(/\s+/g, " ");

    // if (!search) {
    //   return errorResponse(resp, "Search text is required.", 400, null);
    // }

    // =====================================================
    // STEP 3 : Build Filter
    // =====================================================
    const filter = {
    ownerId,
    };
    if (search) {
      filter.$or = [
        {
          fullName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: search,
          },
        },
      ];
    }

    // Optional status filter
    //we wright logic according enum we define "Active and Inactive" 1st char capital
    if (req.query.status) {
      filter.status =
        req.query.status.charAt(0).toUpperCase() +
        req.query.status.slice(1).toLowerCase();
    }

    // =====================================================
    // STEP 4 : Fetch Data + Count
    // =====================================================

    const [tenants, totalRecords] = await Promise.all([
      Tenant.find(filter)
        .select(
          "fullName phone email idProofType idProofNumber status createdAt updatedAt"
        )
        .sort({ fullName: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Tenant.countDocuments(filter),
    ]);

    // =====================================================
    // STEP 5 : Response
    // =====================================================

    return successResponse(
      resp,
      {
        tenants,
        pagination: {
          totalRecords,
          currentPage: page,
          totalPages: Math.ceil(totalRecords / limit),
          pageSize: limit,
          hasNextPage: page * limit < totalRecords,
          hasPreviousPage: page > 1,
        },
      },
      "Tenant search completed successfully.",
      200
    );
  } catch (error) {
    logger.error(`Search Tenant Error: ${error.message}`);

    return errorResponse(resp, "Internal server error.", 500, error);
  }
};