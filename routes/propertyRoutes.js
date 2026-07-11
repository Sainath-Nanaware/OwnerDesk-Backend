const express = require("express");
const router = express.Router();
//auth middleware
const auth=require("../middlewares/authMiddleware")

//Controller 
const {
  addNewProperty,
  updateProperty,
  getAllProperty,
  searchPropertyByCity,
} = require("../controllers/propertyController");

//validation middleware
const validate = require("../middlewares/schemaValitation");

//schema for validation
const {
  newPropertyValidationSchema,
  propertyUpdateSchema,
} = require("../validation/propertyValidation");


router.post("/add", auth, validate(newPropertyValidationSchema), addNewProperty);
router.patch("/:id",auth, validate(propertyUpdateSchema),updateProperty);
router.get("/owner/:ownerID",auth,getAllProperty);
router.get("/owner/:ownerID/search",auth,searchPropertyByCity);

module.exports=router