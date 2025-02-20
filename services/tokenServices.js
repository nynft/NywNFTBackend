const { UserToken } = require("../models/user");
const jwt = require("jsonwebtoken");
require("dotenv").config();


const createToken = async (req, res, data) => {
    try {
        // Check if token already exists for the user
        const existingToken = await UserToken.findOne({ userId: data.userId });

        const expireInOneDay = 3600 * 120; // 24 hours in seconds
        const token = jwt.sign({ data: data }, process.env.SECRET_KEY, { expiresIn: expireInOneDay });

        if (existingToken) {
            // If token exists, update it
            existingToken.token = token;
            existingToken.active = 1;
            existingToken.expiresIn = expireInOneDay;
            await existingToken.save(); // Save the updated token document

            return {
                isVerified: true,
                token: token,
            };
        } else {
            // If token doesn't exist, create a new token
            const newUserToken = new UserToken({
                userId: data.userId,
                token: token,
                active: 1,
                expiresIn: expireInOneDay, // Set expiration as timestamp
            });

            await newUserToken.save(); // Save the new token document to the database

            return {
                isVerified: true,
                token: token,
            };
        }
    } catch (error) {
        console.error("Error creating/updating token:", error);
        return {
            isVerified: false,
            message: "Error creating token",
        };
    }
};


const verifyToken = async (req, res, next) => {
    const bearerHeader = await req.headers["authorization"];
    if (!bearerHeader) {
        return { message: "Token is missing", isVerified: false };
    }
    let token = bearerHeader.split(" ")[1];
    if (typeof bearerHeader !== "undefined" && token) {
        let matchToken = await UserToken.findOne({ token: token });
        try {
            if (matchToken && matchToken.active === 1) {
                const decode = await jwt.verify(token, process.env.SECRET_KEY);
                return {
                    message: "Success",
                    isVerified: true,
                    data: decode,
                    token: token,
                };
            } else {
                return {
                    message: "Token Expired !!",
                    isVerified: false,
                    data: "",
                };
            }
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                return {
                    message: "Token Expired",
                    isVerified: false,
                    data: "",
                };
            } else {
                console.log(error);
                return {
                    message: "UnAuthorized User !!",
                    isVerified: false,
                    data: "",
                };
            }
        }
    } else {
        res.status(400).send({ status: false, message: "Invalid token" });
    }
};


module.exports = { createToken, verifyToken };