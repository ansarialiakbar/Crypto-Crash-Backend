const GameRound = require('../models/GameRound');
const { generateCrashPoint, getSeedHash } = require('../utils/fairCrash');
const { setCurrentRound } = require('../utils/currentRound');

let roundNumber = 1;

const setupGameSocket = (io) => {
  let interval;

  const startRound = async () => {
    const { seed, hash } = getSeedHash(roundNumber);
    const crashPoint = parseFloat(generateCrashPoint(seed));

    const round = await GameRound.create({
      roundNumber,
      crashPoint,
      seed,
      hash,
      startTime: new Date(),
      bets: [],
    });

    setCurrentRound(round); // 🔁 Share round globally

    io.emit('round_start', { roundNumber, crashPoint, hash });

    let multiplier = 1;
    let growthFactor = 0.01;
    let startTime = Date.now();

    interval = setInterval(async () => {
      const timeElapsed = (Date.now() - startTime) / 1000;
      multiplier = 1 + (timeElapsed * growthFactor);

      io.emit('multiplier_update', { multiplier: multiplier.toFixed(2) });

      if (multiplier >= crashPoint) {
        clearInterval(interval);
        io.emit('crash', { crashPoint });
        roundNumber++;
        setTimeout(startRound, 10000);
      }
    }, 100);
  };

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('cashout_request', ({ playerId, multiplier }) => {
      io.emit('player_cashout', { playerId, multiplier });
    });
  });

  startRound();
};

module.exports = setupGameSocket;
