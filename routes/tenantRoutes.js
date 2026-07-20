const express = require("express");
const router = express.Router();
//auth middleware
const auth = require("../middlewares/authMiddleware");

//Controller
const { addNewTenant } = require("../controllers/tenantController");

//validation middleware
const validate = require("../middlewares/schemaValitation");

//schema for validation
const {
  createTenantValidationSchema,
} = require("../validation/tenantValidation");


router.post(
  "/add",
  auth,
  validate(createTenantValidationSchema),
  addNewTenant
);

module.exports=router

