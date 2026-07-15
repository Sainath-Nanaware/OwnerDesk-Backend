const express = require("express");
const router = express.Router();
//auth middleware
const auth = require("../middlewares/authMiddleware");

//Controller
const {
 addNewRoom,
 getAllRoomsByProperty,
} = require("../controllers/roomController");

//validation middleware
const validate = require("../middlewares/schemaValitation");

//schema for validation
const { newRoomValidationSchema} = require("../validation/roomValidation");


router.post(
  "/add",
  auth,
  validate(newRoomValidationSchema),
  addNewRoom
);
router.get(
  "/all/:ownerId/:propertyId",
  auth,
  getAllRoomsByProperty
);

module.exports = router;