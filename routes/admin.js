
const express = require('express');
const router = express.Router();

const { userRegistrationStatus, userBuyHistory } = require('../controllers/admin');


router.get('/user-registration-status', userRegistrationStatus);
router.get('/user-buy-history', userBuyHistory);





module.exports = router;