const express = require("express");
const router = express.Router();
//auth middleware
const auth = require("../middlewares/authMiddleware");

//Controller
const {
 addNewRoom,
 getAllRoomsByProperty,
 searchRoomsByProperty,
 allocateRoom,
 deallocateRoom,
 roomInfo
} = require("../controllers/roomController");

//validation middleware
const validate = require("../middlewares/schemaValitation");

//schema for validation
const { newRoomValidationSchema} = require("../validation/roomValidation");
const {createRoomAllocationSchema,deallocateRoomSchema}=require("../validation/roomAllocationValidation")

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
/*call example:
Get all rooms
GET /api/rooms/property/6890abcd/rooms
Search by room number
GET /api/rooms/property/6890abcd/rooms?roomNumber=101
Search vacant rooms
GET /api/rooms/property/6890abcd/rooms?isOccupied=false
Search by room type
GET /api/rooms/property/6890abcd/rooms?roomType=1 BHK
Search by floor
GET /api/rooms/property/6890abcd/rooms?floor=2
Combined filters
GET /api/rooms/property/6890abcd/rooms?roomType=Single Room&isOccupied=true&page=1&limit=10
// call api example : GET /api/rooms/property/689ab1234567890abcdef123/rooms?roomNumber=101&page=2&limit=10 */
router.get("/property/:propertyId/rooms", auth, searchRoomsByProperty);
router.post("/allocate",auth,validate(createRoomAllocationSchema),allocateRoom)
router.patch("/deallocate", auth, validate(deallocateRoomSchema),deallocateRoom);
//GET /api/room/dashboard/689f3d961d0f9f5c4d123458?ownerId=689f3d7c1d0f9f5c4d123456&month=7&year=2026
router.get("/dashboard/:roomId", roomInfo);


module.exports = router;