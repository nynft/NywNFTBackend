const Bid = require('../models/bid');
const { User } = require('../models/user');

const { verifyToken } = require('../services/tokenServices');


// Create a new bid
const createBid = async (req, res) => {
    try {
        const verification = await verifyToken(req, res);
        if (!verification.isVerified) {
            return res.status(401).json({ status: false, message: verification.message });
        }

        const { } = req.body;
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}