const express = require("express");
const router = express.Router();
const { uploadCollectionFields } = require('../middlewares/fileUpload')

const { createCollection, getAllUserCollection, checkUniqueCollectionName, collectionByUserId } = require('../controllers/collection');

router.post('/create', uploadCollectionFields, createCollection);
router.get('/all', getAllUserCollection);
router.get('/checkUniqueName', checkUniqueCollectionName);
router.get('/get/:collectionId', collectionByUserId);



module.exports = router;