const axios = require('axios');
let priceCache = {};

// ✅ Map symbol to CoinGecko ID
const coinGeckoIdMap = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
};

const getCryptoPrice = async (currency) => {
  const now = Date.now();

  if (priceCache[currency] && now - priceCache[currency].timestamp < 10000) {
    return priceCache[currency].price;
  }

  const coinId = coinGeckoIdMap[currency.toUpperCase()];
  if (!coinId) throw new Error(`Unsupported currency: ${currency}`);

  try {
    const res = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
    );

    const price = res.data?.[coinId]?.usd;
    if (typeof price !== 'number') {
      throw new Error(`Invalid price response for ${coinId}`);
    }

    priceCache[currency] = { price, timestamp: now };
    return price;
  } catch (err) {
    console.error(`❌ Error fetching price for ${currency}:`, err.message);
    throw new Error('Failed to fetch crypto price');
  }
};

module.exports = { getCryptoPrice };
