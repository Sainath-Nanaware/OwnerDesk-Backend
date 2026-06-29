const express = require("express");
const app = express();
const cors = require("cors");

const dotenv = require("dotenv")
dotenv.config();

//DB connection
const connectDB=require('./config/db')
connectDB();

app.use(cors());
app.use(express.json());


//Routes:
//User route
const userRoutes=require('./routes/userRoutes')
app.use("/user",userRoutes);




app.get("/", (req, res) => {
  res.send("Hello Sainath!");
});


// Start server
const PORT = process.env.PORT || 6000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

