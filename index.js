const express = require("express");
const app = express();
require("dotenv").config();
const PORT = process.env.PORT || 5000;
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const { default: mongoose } = require("mongoose");
const userRoute = require("./routes/user");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

app.use("/api/user", userRoute);

app.listen(PORT, () => {
  console.log(`Backend is running on port http://localhost:${PORT}`);
});
