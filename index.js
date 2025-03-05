const express = require("express");
const app = express();
require("dotenv").config();
const PORT = process.env.PORT || 5000;
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const { default: mongoose } = require("mongoose");
const userRoute = require("./routes/user");
const cartRoutes = require("./routes/cart");
const categoryRoute = require('./routes/category');
const collectionRoutes = require('./routes/collection');
const bidRoutes = require('./routes/bid');
const nftRoutes = require('./routes/nft');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(morgan("dev"));

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

app.use("/api/user", userRoute);
app.use("/api/cart", cartRoutes);
app.use('/api/category', categoryRoute);
app.use('/api/collection', collectionRoutes);
app.use('/api/bid', bidRoutes);
app.use('/api/nft', nftRoutes);


app.get("/api/image", (req, res) => {
  try {
    let imageName = req.query.imageName;
    let pathName = req.query.pathName;

    // Use root directory from environment variable
    const rootDir = process.env[pathName];

    // console.log(rootDir, "image");
    res.sendFile(imageName, { root: rootDir });
  } catch (error) {
    console.log(error);
  }
});

app.get('/', (req, res) => {
  res.send(`<h1>Welcome to NFT API</h1>`);
})

app.listen(PORT, () => {
  console.log(`Backend is running on port http://localhost:${PORT}`);
});
