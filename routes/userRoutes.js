const express = require("express");
const router = express.Router();

//controllers
const {registration,login}=require("../controllers/userController")

//validation middleware
const validate=require("../middlewares/schemaValitation")

//schema validation
const {registerSchema,loginSchema}=require("../validation/userValidation")

router.post("/register",validate(registerSchema),registration);
router.post("/login",validate(loginSchema),login)

module.exports = router;