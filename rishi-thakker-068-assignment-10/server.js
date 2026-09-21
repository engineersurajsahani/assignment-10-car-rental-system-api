const express = require("express");
const cors = require("cors");
const logger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");
const router = require("./router/router");

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to Car Rental & Fleet Booking API" });
});

app.use("/api", router);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
