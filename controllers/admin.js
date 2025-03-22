const { User } = require('../models/user');
const BuyHistory = require('../models/buyhistory');
const SellNFT = require('../models/sell');
const Collection = require('../models/collection');



const calculateDateRange = (days) => {
    const pastDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return pastDate.toISOString();
};


const userRegistrationStatus = async (req, res) => {
    try {

        const now = new Date().toISOString();
        const days = parseInt(req.query.day) || 1;
        const pastDate = calculateDateRange(days);

        const result = await User.countDocuments({
            createdAt: { $gte: pastDate, $lt: now },
        })
        const totalUsers = await User.countDocuments();

        return res.status(200).json({
            status: true,
            message: `count last ${days} days of registration`,
            data: {
                [`countLast${days}Days`]: result,
                totalUsers: totalUsers
            },
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
}


const userBuyHistory = async (req, res) => {
    try {
        const buyHistory = await BuyHistory.find();
        const sellHistory = await SellNFT.find();
        const collection = await Collection.find();
        return res.status(200).json({
            status: true,
            message: "Buy History",
            data: {
                buyHistory,
                sellHistory,
                collection
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
}

module.exports = { userRegistrationStatus, userBuyHistory };