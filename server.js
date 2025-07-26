const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const gameRoutes = require('./routes/gameRoutes');
const walletRoutes = require('./routes/walletRoutes');
const setupGameSocket = require('./sockets/gameSocket');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/game', gameRoutes);
app.use('/api/wallet', walletRoutes);

app.get('/', (req, res) => {
  res.send(' Server is running fine!');
});

setupGameSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
