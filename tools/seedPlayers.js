// tools/seedPlayers.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Player = require('../models/Player');

dotenv.config();
mongoose.connect(process.env.MONGO_URI);

const seed = async () => {
  await Player.deleteMany();
  await Player.insertMany([
    { username: 'Alice', balances: { BTC: 0.005, ETH: 0.1 } },
    { username: 'Bob', balances: { BTC: 0.002, ETH: 0.3 } },
    { username: 'Charlie', balances: { BTC: 0.01, ETH: 0.05 } },
  ]);
  console.log('Seeded players!');
  process.exit();
};

seed();
