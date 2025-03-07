const multer = require('multer');

const storage = multer.memoryStorage();

// File filter for images and videos (used by uploadNFTImg)
const fileFilterWithVideo = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4', 'video/mpeg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, JPG, PNG, MP4, and MPEG files are allowed!'), false);
    }
};

// File filter for images only (used by uploadCollectionFields)
const fileFilterImagesOnly = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, JPG, and PNG files are allowed!'), false);
    }
};

// Configure uploadNFTImg with max file size (10MB) and field size (25MB)
const uploadNFTImg = multer({
    storage,
    fileFilter: fileFilterWithVideo,
    limits: {
        fileSize: 25 * 1024 * 1024,  // 10MB for files
        fieldSize: 25 * 1024 * 1024  // 25MB for field values
    }
}).single('nftImg');

// Configure uploadCollectionFields with max file size (5MB) and field size (25MB)
const uploadCollectionFields = multer({
    storage,
    fileFilter: fileFilterImagesOnly,
    limits: {
        fileSize: 25 * 1024 * 1024,   // 5MB for files
        fieldSize: 25 * 1024 * 1024  // 25MB for field values
    }
}).fields([
    { name: 'field1', maxCount: 1 },
    { name: 'field2', maxCount: 1 }
]);

module.exports = { uploadNFTImg, uploadCollectionFields };