const Player = require('../models/Player');
const Transaction = require('../models/Transaction');
const GameRound = require('../models/GameRound');
const { getCryptoPrice } = require('../utils/cryptoUtils');
const { generateCrashPoint, getSeedHash } = require('../utils/fairCrash');
const { getCurrentRound } = require('../utils/currentRound');
const crypto = require('crypto');

// 🟩 BET CONTROLLER
const placeBet = async (req, res) => {
  try {
    const { playerId, usdAmount, currency } = req.body;
    console.log(`Attempting to place bet for player ${playerId}, amount ${usdAmount} ${currency}`);

    let price;
    try {
      price = await getCryptoPrice(currency);
      if (!price || typeof price !== 'number') throw new Error('Invalid price');
    } catch (err) {
      console.error('Failed to fetch crypto price:', err.message);
      return res.status(500).json({ error: 'Failed to fetch crypto price' });
    }

    const cryptoAmount = usdAmount / price;

    const player = await Player.findById(playerId);
    if (!player) {
      console.error(`Player not found: ${playerId}`);
      return res.status(404).json({ error: 'Player not found' });
    }

    if (player.balances[currency] < cryptoAmount) {
      console.error(`Insufficient balance for player ${playerId}: ${player.balances[currency]} < ${cryptoAmount}`);
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const roundInMemory = getCurrentRound();
    if (!roundInMemory || typeof roundInMemory.multiplier !== 'number') {
      console.error(`No active round for bet. currentRound: ${JSON.stringify(roundInMemory)}`);
      return res.status(409).json({ error: 'No active round. Please wait for the next round to start.' });
    }

    // 🟩 Get fresh copy of round from DB to safely modify
    const currentRound = await GameRound.findById(roundInMemory._id);
    if (!currentRound) {
      console.error('Could not fetch current round from DB');
      return res.status(500).json({ error: 'Unable to place bet. Round not found.' });
    }

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

    currentRound.bets.push({ playerId, usdAmount, cryptoAmount, currency });
    await currentRound.save();

    console.log(`✅ Bet placed successfully for player ${playerId}: ${cryptoAmount} ${currency}`);
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
    console.log('playerId', playerId);

    const roundInMemory = getCurrentRound();
    if (!roundInMemory || !roundInMemory.bets)
      return res.status(400).json({ error: 'No active round' });

    // ✅ Fetch fresh version of the round from DB to avoid parallel `.save()` issues
    const currentRound = await GameRound.findById(roundInMemory._id);
    if (!currentRound) return res.status(500).json({ error: 'Could not fetch current round' });

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
    await currentRound.save(); // ✅ fresh round safe to save

    res.json({ message: 'Cashed out', usdValue, cryptoPayout });
  } catch (err) {
    console.error('cashOut error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { placeBet, cashOut };