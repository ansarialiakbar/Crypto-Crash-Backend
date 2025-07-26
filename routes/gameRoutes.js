const express = require('express');
const router = express.Router();
const { placeBet, cashOut } = require('../controllers/gameController');

router.post('/bet', placeBet);
router.post('/cashout', cashOut);

module.exports = router;