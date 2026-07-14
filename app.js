const express = require("express");
const app = express();
const cors = require("cors");

const dotenv = require("dotenv")
dotenv.config();

//DB connection
const connectDB=require('./config/db')
connectDB();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }))
app.use(express.json());
// //for form data body 
// app.use(express.urlencoded({ extended: true }));


//Routes:
//User route
const userRoutes=require('./routes/userRoutes')
app.use("/user",userRoutes);

//Property route
const propertyRoutes=require("./routes/propertyRoutes")
app.use("/property",propertyRoutes)

//Room route
const roomRoutes=require("./routes/roomRoutes")
app.use("/room",roomRoutes)

app.get("/", (req, res) => {
  res.send("OwnerDesk Devloped by Sainath Nanaware.");
});


// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


