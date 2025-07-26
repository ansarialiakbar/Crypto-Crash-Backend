let currentRound = null;

const setCurrentRound = (round) => {
  currentRound = round;
};

const getCurrentRound = () => currentRound;

module.exports = { setCurrentRound, getCurrentRound };
