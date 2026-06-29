const express = require("express");
const router = express.Router();

//controllers
const {registration}=require("../controllers/userController")

//validation middleware
const validate=require("../middlewares/schemaValitation")

//schema validation
const {registerSchema}=require("../validation/userValidation")

router.post("/register",validate(registerSchema),registration);

module.exports = router;