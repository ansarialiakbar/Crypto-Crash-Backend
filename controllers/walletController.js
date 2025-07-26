const Player = require('../models/Player');
const { getCryptoPrice } = require('../utils/cryptoUtils');

const getWallet = async (req, res) => {
  try {
    const player = await Player.findById(req.params.playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    // Safely fetch prices
    let btcPrice = 0, ethPrice = 0;

    try {
      btcPrice = await getCryptoPrice('BTC');
    } catch (err) {
      console.error('Failed to fetch BTC price:', err.message);
    }

    try {
      ethPrice = await getCryptoPrice('ETH');
    } catch (err) {
      console.error('Failed to fetch ETH price:', err.message);
    }

    res.json({
      BTC: {
        amount: player.balances.BTC,
        usd: btcPrice ? player.balances.BTC * btcPrice : null,
      },
      ETH: {
        amount: player.balances.ETH,
        usd: ethPrice ? player.balances.ETH * ethPrice : null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getWallet };
