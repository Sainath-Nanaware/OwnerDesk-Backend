const express = require("express");
const router = express.Router();
//auth middleware
const auth = require("../middlewares/authMiddleware");


//Controller 
const {
  createOrUpdateElectricityBill,
} = require("../controllers/electricityBillController");

//validation middleware
const validate = require("../middlewares/schemaValitation");

//schema for validation
const {
  createElectricityBillValidationSchema
} = require("../validation/electricityBillValidation");


router.post("/add", auth, validate(createElectricityBillValidationSchema), createOrUpdateElectricityBill);


module.exports = router;