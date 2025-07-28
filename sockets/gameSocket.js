const GameRound = require('../models/GameRound');
const { generateCrashPoint, getSeedHash } = require('../utils/fairCrash');
const { setCurrentRound, getCurrentRound } = require('../utils/currentRound');

let roundNumber = 1;
let isSaving = false;

const setupGameSocket = (io) => {
  let interval;

  const startRound = async () => {
    try {
      console.log(`Starting round ${roundNumber}`);
      const { seed, hash } = getSeedHash(roundNumber);
      const crashPoint = parseFloat(generateCrashPoint(seed));

      const round = await GameRound.create({
        roundNumber,
        crashPoint,
        seed,
        hash,
        startTime: new Date(),
        bets: [],
        multiplier: 1
      });

      setCurrentRound(round);
      console.log(`Round ${roundNumber} initialized with crashPoint ${crashPoint}, multiplier 1`);

      io.emit('round_start', { roundNumber, crashPoint, hash });

      let multiplier = 1;
      const growthFactor = 0.01;
      const startTime = Date.now();
      let lastSaved = Date.now();

      interval = setInterval(async () => {
        try {
          const timeElapsed = (Date.now() - startTime) / 1000;
          multiplier = 1 + timeElapsed * growthFactor;

          const currentRound = getCurrentRound();
          if (currentRound && !isSaving) {
            if (Date.now() - lastSaved >= 1000) {
              isSaving = true;
              currentRound.multiplier = multiplier;
              await currentRound.save();
              lastSaved = Date.now();
              isSaving = false;
              console.log(`Round ${roundNumber} multiplier updated to ${multiplier.toFixed(2)} in MongoDB`);
            }
          }

          io.emit('multiplier_update', { multiplier: multiplier.toFixed(2) });

          if (multiplier >= crashPoint) {
            clearInterval(interval);
            io.emit('crash', { crashPoint });
            console.log(`Round ${roundNumber} crashed at ${crashPoint}`);
            roundNumber++;
            setTimeout(startRound, 10000);
          }
        } catch (err) {
          console.error('Error in multiplier update interval:', err.message);
          isSaving = false;
        }
      }, 100);
    } catch (err) {
      console.error('Error starting round:', err.message);
      setTimeout(startRound, 5000);
    }
  };

  // ✅ Start immediately (after DB already connected in server.js)
  startRound();

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    const currentRound = getCurrentRound();
    if (currentRound) {
      socket.emit('round_start', {
        roundNumber: currentRound.roundNumber,
        crashPoint: currentRound.crashPoint,
        hash: currentRound.hash,
      });
      socket.emit('multiplier_update', { multiplier: currentRound.multiplier.toFixed(2) });
    } else {
      console.log('No active round for new client');
    }
  });
};

module.exports = setupGameSocket;
