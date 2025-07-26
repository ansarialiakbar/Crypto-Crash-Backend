const Player = require('../models/Player');
const Transaction = require('../models/Transaction');
const { getCryptoPrice } = require('../utils/cryptoUtils');
const { generateCrashPoint, getSeedHash } = require('../utils/fairCrash');
const { getCurrentRound } = require('../utils/currentRound');
const crypto = require('crypto');

// 🟩 BET CONTROLLER
const placeBet = async (req, res) => {
  try {
    const { playerId, usdAmount, currency } = req.body;

    let price;
    try {
      price = await getCryptoPrice(currency);
      if (!price || typeof price !== 'number') throw new Error('Invalid price');
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch crypto price' });
    }

    const cryptoAmount = usdAmount / price;

    const player = await Player.findById(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    if (player.balances[currency] < cryptoAmount)
      return res.status(400).json({ error: 'Insufficient balance' });

    player.balances[currency] -= cryptoAmount;
    await player.save();

    const transactionHash = crypto.randomBytes(8).toString('hex');
    await Transaction.create({
      playerId,
      usdAmount,
      cryptoAmount,
      currency,
      transactionType: 'bet',
      transactionHash,
      priceAtTime: price,
    });

    const currentRound = getCurrentRound();
    if (!currentRound)
      return res.status(400).json({ error: 'No active round. Please wait.' });

    currentRound.bets.push({ playerId, usdAmount, cryptoAmount, currency });
    await currentRound.save();

    res.json({ message: 'Bet placed', cryptoAmount });
  } catch (err) {
    console.error('placeBet error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// 🟩 CASHOUT CONTROLLER
const cashOut = async (req, res) => {
  try {
    const { playerId, multiplier } = req.body;

    const currentRound = getCurrentRound();
    if (!currentRound || !currentRound.bets)
      return res.status(400).json({ error: 'No active round' });

    const bet = currentRound.bets.find(b => b.playerId === playerId && !b.outcome);
    if (!bet || multiplier >= currentRound.crashPoint)
      return res.status(400).json({ error: 'Cannot cash out after crash or no valid bet' });

    const cryptoPayout = bet.cryptoAmount * multiplier;
    const player = await Player.findById(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    player.balances[bet.currency] += cryptoPayout;
    await player.save();

    let price;
    try {
      price = await getCryptoPrice(bet.currency);
      if (!price || typeof price !== 'number') throw new Error('Invalid price');
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch price for cashout' });
    }

    const usdValue = cryptoPayout * price;
    const transactionHash = crypto.randomBytes(8).toString('hex');

    await Transaction.create({
      playerId,
      usdAmount: usdValue,
      cryptoAmount: cryptoPayout,
      currency: bet.currency,
      transactionType: 'cashout',
      transactionHash,
      priceAtTime: price,
    });

    bet.outcome = 'win';
    bet.cashoutMultiplier = multiplier;
    await currentRound.save();

    res.json({ message: 'Cashed out', usdValue, cryptoPayout });
  } catch (err) {
    console.error('cashOut error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { placeBet, cashOut };
