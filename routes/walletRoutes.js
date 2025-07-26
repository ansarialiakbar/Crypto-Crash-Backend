const express = require('express');
const router = express.Router();
const { getWallet } = require('../controllers/walletController');

router.get('/:playerId', getWallet);

module.exports = router;