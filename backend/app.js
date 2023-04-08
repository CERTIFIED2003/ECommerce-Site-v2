const express = require("express");
const ErrorHandler = require("./middleware/error.js");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use("/", express.static("uploads"));

// Config
if (process.env.NODE_ENV !== "PRODUCTION") {
    require("dotenv").config({
        path: "./config/.env"
    });
}

const corsOptions = {
    origin: process.env.FRONTEND_URL,
    credentials: true,
    optionSuccessStatus: 200,
}
app.use(cors(corsOptions));

// Routes
const user = require("./controller/user.js");
app.use("/api/v2/user", user);

// Error Handling
app.use(ErrorHandler);

module.exports = app;