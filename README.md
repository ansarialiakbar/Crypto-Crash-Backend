# 💥 Crypto Crash Game - Backend

This is the backend for a real-time multiplayer game called **Crypto Crash**, where users place bets in USD (converted to BTC/ETH using live crypto prices), and attempt to cash out before a simulated crash occurs. The backend handles:

- Provably fair game rounds
- Real-time WebSocket updates
- Cryptocurrency conversion via CoinGecko API
- Player wallet and balance tracking
- Crash logic and cashouts

---

##  Features

-  **Provably Fair Crash Algorithm**

-  USD-to-Crypto conversion using **CoinGecko API**

-  Multiplayer support via **WebSockets (Socket.IO)**

-  Real-time multiplier broadcasting

-  MongoDB-based transaction and game round history

-  Fully RESTful API for game and wallet operations

---

##  Tech Stack

- **Node.js** + **Express.js**

- **MongoDB** with **Mongoose**

- **Socket.IO** for real-time WebSocket communication

- **CoinGecko API** for live crypto prices

- **Render**  for deployment

---

##  Folder Structure

├── server.js
├── config/
│ └── db.js
├── controllers/
│ ├── gameController.js
│ └── walletController.js
├── models/
│ ├── Player.js
│ ├── GameRound.js
│ └── Transaction.js
├── routes/
│ ├── gameRoutes.js
│ └── walletRoutes.js
├── sockets/
│ └── gameSocket.js
├── utils/
│ ├── cryptoUtils.js
│ ├── fairCrash.js
│ └── currentRound.js
├── tools/
│ └── seedPlayers.js



---

##  Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/ansarialiakbar/Crypto-Crash-Backend.git

cd crypto-crash-backend
```
2. **Install Dependencies**
```
npm install
```
3. **Configure Environment Variables**

Create a .env file in the root directory:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string
```

 Use MongoDB Atlas for free cloud MongoDB.

4. **Seed Sample Players**
```
node tools/seedPlayers.js
```
Adds 3 sample users with BTC/ETH balances.

5. **Run the Server**
```
npm start
```
Server starts on http://localhost:5000 by default.

##  API Endpoints

🔹 **Wallet Routes**

Method	    Route	                   Description
GET	      /api/wallet/:playerId	   Get wallet (crypto + USD values)

🔹 **Game Routes**

Method	    Route	                       Description
POST	 /api/game/bet	           Place bet in USD
POST	 /api/game/cashout	      Cash out before crash

 **Sample POST Body for** /api/game/bet
```
{
  "playerId": "your_player_id",
  "usdAmount": 10,
  "currency": "BTC"
}
```

##  WebSocket Events

**WebSocket URL**: ws://localhost:5000

**Event**	              **Direction**	                **Payload**

round_start	           Server → Client	        { roundNumber, crashPoint, hash }

multiplier_update	     Server → Client	             { multiplier }

crash	                 Server → Client	               { crashPoint }

player_cashout	        Server → Client	           { playerId, multiplier }

cashout_request	      Client → Server	          { playerId, multiplier }


Test using the provided client.html or any WebSocket client.

## Provably Fair Crash Algorithm

Crash point is generated using:
```
SHA256(seed + roundNumber) → intVal
crashPoint = floor(100 * 100000 / (intVal % 100000 + 1)) / 100
```
This ensures tamper-proof fairness.

## Crypto Conversion Logic

Uses CoinGecko API to fetch live prices:

Example:

Bet $10 on BTC

BTC Price = $60,000

0.00016667 BTC placed → cashout at 3x = 0.0005 BTC → $30

Prices cached for 10 seconds to avoid rate limits.

## Deployment (Render)

1. Push code to GitHub

2. Create new Web Service on Render

3. Set PORT and MONGO_URI in environment variables

4. Use:

Build command: npm install

Start command: node server.js

5. Exposes both HTTP and WebSocket endpoints

##  TODO (Future Enhancements)

Add JWT-based user auth

Frontend UI for gameplay

Transaction explorer/history

Admin dashboard

Game crash animation

##  License

MIT License


## Author
Ali Akbar Ansari

Feel free to reach out on GitHub


