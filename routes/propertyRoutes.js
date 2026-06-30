const express = require("express");
const router = express.Router();
//auth middleware
const auth=require("../middlewares/authMiddleware")

//Controller 
const { addNewProperty } = require("../controllers/propertyController");

//validation middleware
const validate = require("../middlewares/schemaValitation");

//schema for validation
const {newPropertyValidationSchema}= require("../validation/propertyValidation")


router.post("/add", auth, validate(newPropertyValidationSchema), addNewProperty);

module.exports=router