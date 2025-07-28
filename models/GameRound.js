const mongoose = require('mongoose');

const gameRoundSchema = new mongoose.Schema({
  roundNumber: Number,
  crashPoint: Number,
  seed: String,
  hash: String,
  startTime: Date,
  multiplier: { type: Number, default: 1 }, // Ensure multiplier is defined
  bets: [
    {
      playerId: String,
      usdAmount: Number,
      cryptoAmount: Number,
      currency: String,
      cashoutMultiplier: Number,
      outcome: String, // win/lose
    },
  ],
});

module.exports = mongoose.model('GameRound', gameRoundSchema);