const express = require("express");
const path = require("path");
const router = express.Router();
const { upload } = require("../multer.js");
const Seller = require("../model/seller.js");
const ErrorHandler = require("../utils/ErrorHandler.js");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail.js");
const catchAsyncError = require("../middleware/catchAsyncError.js");
const sendToken = require("../utils/jwtToken.js");
const { isSellerAuthenticated } = require("../middleware/auth.js");

// Seller Registration at "/api/v2/seller/signup-seller"
router.post("/signup-seller", upload.single("file"), async (req, res, next) => {
    try {
        const { email } = req.body;
        const sellerEmail = await Seller.findOne({ email });
        if (sellerEmail) {
            const filename = req.file.filename;
            const filePath = `uploads/${filename}`;
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.log(err);
                    res.status(500).json({ message: "Error deleting file" });
                }
            });
            return next(new ErrorHandler("Seller already exists", 400));
        }

        const filename = req.file.filename;
        const fileUrl = path.join(filename);

        const seller = {
            name: req.body.shopName,
            email: email,
            phoneNumber: req.body.phoneNumber,
            address: req.body.address,
            zipCode: req.body.zipCode,
            password: req.body.password,
            avatar: fileUrl,
        };

        const activationToken = createActivationToken(seller);

        const activationUrl = `${process.env.FRONTEND_URL}/seller/activation/${activationToken}`;

        try {
            await sendMail({
                email: seller.email,
                subject: "Activate your CertyStore Seller's Account",
                message: `Hello, please click on the link ${activationUrl} to verify your shop ${seller.name}. With regards from CertyStore.`
            });
            res.status(201).json({
                success: true,
                message: `Please check your Email ${seller.email} to activate your CertyStore Seller's account`,
            });
        }
        catch (error) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
    catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});

const createActivationToken = (seller) => {
    return jwt.sign(seller, process.env.ACTIVATION_SECRET, {
        expiresIn: "10m"
    });
};

// Activation Token at "/api/v2/seller/shop/activation"
router.post("/shop/activation", catchAsyncError(async (req, res, next) => {
    try {
        const { activationToken } = req.body;
        const newSeller = jwt.verify(activationToken, process.env.ACTIVATION_SECRET);

        if (!newSeller) return next(new ErrorHandler("Invalid Token", 400));

        const { name, email, phoneNumber, address, zipCode, password, avatar } = newSeller;

        let seller = await Seller.findOne({ email });
        if (seller) return next(new ErrorHandler("Seller already exists!", 400));

        seller = await Seller.create({
            name,
            email,
            phoneNumber,
            address,
            zipCode,
            password,
            avatar
        });
        sendToken(seller, "seller", 201, res);
    }
    catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
}));

// Seller Login at "/api/v2/seller/login-seller"
router.post("/login-seller", catchAsyncError(async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email) return next(new ErrorHandler("Please enter your Email!", 400));
        if (!password) return next(new ErrorHandler("Please enter your Password!", 400));

        const seller = await Seller.findOne({ email }).select("+password");
        if (!seller) return next(new ErrorHandler("Seller doesn't exists!", 400));

        const isPasswordValid = await seller.comparePassword(password);
        if (!isPasswordValid) return next(new ErrorHandler("Try again with correct credentials!", 400));

        sendToken(seller, "seller", 201, res);
    }
    catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
}));

// Load Seller
router.post("/getseller", isSellerAuthenticated, catchAsyncError(async (req, res, next) => {
    try {
        const seller = await Seller.findById(req.seller._id);
        if (!seller) return next(new ErrorHandler("Seller doesn't exists!", 500));

        res.status(200).json({
            success: true,
            seller,
        });
    }
    catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
}));

module.exports = router;