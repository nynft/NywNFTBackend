const Cart = require('../models/cart');
const NFT = require('../models/nft');
const { verifyToken } = require('../services/tokenServices');


// add item to cart

const addItemToCart = async (req, res) => {
    try {
        const verification = await verifyToken(req, res);
        if (!verification.isVerified) {
            return res.status(401).json({ message: verification.message });
        }

        const walletAddress = verification.data.data.walletAddress;
        const { tokenId } = req.body; // Expecting an array of tokenIds

        if (!Array.isArray(tokenId) || tokenId.length === 0) {
            return res.status(400).json({ status: false, message: "tokenId must be a non-empty array" });
        }

        // Find all NFT items in the request
        const nfts = await NFT.find({ tokenId: { $in: tokenId } });

        if (nfts.length === 0) {
            return res.status(404).json({ message: "No NFTs found for the given tokenIds" });
        }

        // Check if user already has a cart
        let cart = await Cart.findOne({ walletAddress, isPurchased: false });

        if (!cart) {
            // Create a new cart if none exists
            cart = new Cart({
                walletAddress,
                items: [],
                totalItems: 0,
                totalPrice: 0,
                isPurchased: false
            });
        }

        let addedItems = [];
        let alreadyInCart = [];

        nfts.forEach((nft) => {
            const exists = cart.items.some((item) => item.tokenId === nft.tokenId);
            if (exists) {
                alreadyInCart.push(nft.tokenId);
            } else {
                cart.items.push({
                    tokenId: nft.tokenId,
                    name: nft.name,
                    description: nft.description,
                    price: nft.price,
                    imageUrl: nft.imageUrl,
                    collectionId: nft.collectionId,
                    contractAddress: nft.contractAddress,
                    transactionHash: nft.transactionHash,
                    quantity: 1
                });

                cart.totalItems += 1;
                cart.totalPrice += nft.price;
                addedItems.push(nft.tokenId);
            }
        });

        // Save the cart
        await cart.save();

        return res.status(201).json({
            status: true,
            message: `NFTs added to the cart successfully`,
            // addedItems,
            // alreadyInCart,
            data: cart
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const getCart = async (req, res) => {
    try {
        const verification = await verifyToken(req, res);
        if (!verification.isVerified) {
            return res.status(401).json({ message: verification.message });
        }

        const walletAddress = verification.data.data.walletAddress;

        // Check if user already has a cart
        let cart = await Cart.find({ walletAddress, isPurchased: false });

        if (!cart) {
            return res.status(404).json({ message: "No cart found for the user" });
        }
        return res.status(200).json({ status: true, message: "Get all Cart", data: cart });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

const getCartById = async (req, res) => {
    try {
        const verification = await verifyToken(req, res);
        if (!verification.isVerified) {
            return res.status(401).json({ message: verification.message });
        }

        const walletAddress = verification.data.data.walletAddress;
        const cartId = req.params.id;

        // Check if user already has a cart
        let cart = await Cart.findOne({ walletAddress, _id: cartId, isPurchased: false });

        if (!cart) {
            return res.status(404).json({ message: "No cart found for the user" });
        }
        return res.status(200).json({ status: true, message: "Get Cart by Id", data: cart });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

const removeCartItem = async (req, res) => {
    try {
        const verification = await verifyToken(req, res);
        if (!verification.isVerified) {
            return res.status(401).json({ message: verification.message });
        }
        const cartId = req.params.id;

        const walletAddress = verification.data.data.walletAddress;
        const { tokenId } = req.body;

        // Check if user already has a cart
        let cart = await Cart.findOne({ walletAddress, _id: cartId, isPurchased: false });

        if (!cart) {
            return res.status(404).json({ message: "No cart found for the user" });
        }

        if (!tokenId) {
            return res.status(400).json({ message: "tokenId is required" });
        }

        const itemIndex = cart.items.findIndex((item) => item.tokenId === tokenId);

        if (itemIndex === -1) {
            return res.status(404).json({ message: "Item not found in the cart" });
        }

        const item = cart.items[itemIndex];
        cart.totalItems -= 1;
        cart.totalPrice -= item.price;
        cart.items.splice(itemIndex, 1)[0];

        await cart.save();

        return res.status(200).json({ status: true, message: "Item removed from the cart", data: cart });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = { addItemToCart, getCart, getCartById, removeCartItem };