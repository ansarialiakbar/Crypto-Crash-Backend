const crypto = require('crypto');

const generateCrashPoint = (seed) => {
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  const intVal = parseInt(hash.slice(0, 8), 16);
  const crashPoint = (Math.floor((100 * 100000 / (intVal % 100000 + 1))) / 100).toFixed(2);
  return crashPoint;
};

const getSeedHash = (roundNumber) => {
  const seed = crypto.randomBytes(16).toString('hex') + roundNumber;
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  return { seed, hash };
};

module.exports = { generateCrashPoint, getSeedHash };