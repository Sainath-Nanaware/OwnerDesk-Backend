const express = require("express");
const router = express.Router();
//auth middleware
const auth = require("../middlewares/authMiddleware");

//Controller
const {
  addNewTenant,
  updateTenant,
  getTenantById,
  searchTenant,
} = require("../controllers/tenantController");

//validation middleware
const validate = require("../middlewares/schemaValitation");

//schema for validation
const {
  createTenantValidationSchema,
  updateTenantValidationSchema
} = require("../validation/tenantValidation");


router.post(
  "/add",
  auth,
  validate(createTenantValidationSchema),
  addNewTenant
);
router.patch("/update/:tenantId",auth,validate(updateTenantValidationSchema),updateTenant)
router.get("/:ownerId/:tenantId",auth,getTenantById)

/*
1 API use get all tenant for ownerID and search also example is following
A]if you want get all tenenat belogs to owner then use following route(it gives fist page info with limit=10):
http://localhost:8000/tenant/info/6a428e14bb659f9ea1db62ca/all
--if you add page& limit also 
http://localhost:8000/tenant/info/6a428e14bb659f9ea1db62ca/all?page=1&limit=2


b] if we want get all active or inactive tenant use following:
--without page and size it get 1st page info with limit 10:
http://localhost:8000/tenant/info/6a428e14bb659f9ea1db62ca/all?status=active

--with limit and page 
http://localhost:8000/tenant/info/6a428e14bb659f9ea1db62ca/all?status=active&page=3&limit=1


c]serch with name(we use both fname with lname or only any name also we search easily) with status:
http://localhost:8000/tenant/info/6a428e14bb659f9ea1db62ca/all?search=yadav&status=inactive
--only name 
http://localhost:8000/tenant/info/6a428e14bb659f9ea1db62ca/all?search=yadav

*/

router.get("/info/:ownerId/all", auth, searchTenant);
module.exports=router

