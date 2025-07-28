const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const gameRoutes = require('./routes/gameRoutes');
const walletRoutes = require('./routes/walletRoutes');
const Player = require('./models/Player');
const Transaction = require('./models/Transaction');
const { getCryptoPrice } = require('./utils/cryptoUtils');
const { getCurrentRound } = require('./utils/currentRound');
const setupGameSocket = require('./sockets/gameSocket');
const crypto = require('crypto');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// ✅ Use frontend URL from .env for Socket.IO CORS and Express CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// ✅ API Routes
app.use('/api/game', gameRoutes);
app.use('/api/wallet', walletRoutes);

// ✅ Test Route
app.get('/', (req, res) => {
  res.send('Server is running fine!');
});

// ✅ Initialize Game Socket Logic
setupGameSocket(io);

// ✅ WebSocket Logic (including 'cashout')
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('cashout', async ({ playerId }) => {
    try {
      const currentRound = getCurrentRound();
      if (!currentRound || !currentRound.bets) return;

      const bet = currentRound.bets.find(b => b.playerId === playerId && !b.outcome);
      if (!bet || currentRound.multiplier >= currentRound.crashPoint) return;

      const multiplier = currentRound.multiplier;
      const cryptoPayout = bet.cryptoAmount * multiplier;

      const player = await Player.findById(playerId);
      if (!player) return;

      player.balances[bet.currency] += cryptoPayout;
      await player.save();

      const price = await getCryptoPrice(bet.currency);
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

      socket.emit('cashoutSuccess', {
        usdAmount: usdValue.toFixed(2),
        cryptoAmount: cryptoPayout.toFixed(8),
        currency: bet.currency
      });

    } catch (err) {
      console.error('Socket cashout error:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});