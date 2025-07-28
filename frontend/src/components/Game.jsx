import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import API from '../utils/api';

const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');

export default function Game() {
  const [multiplier, setMultiplier] = useState(1);
  const [status, setStatus] = useState('Waiting for next round...');
  const [bet, setBet] = useState('');
  const [currency, setCurrency] = useState('BTC');
  const [betPlaced, setBetPlaced] = useState(false);
  const [playerId] = useState('6884f551053cf0a12b1a749d');
  const [crashHistory, setCrashHistory] = useState([]);

  useEffect(() => {
    // ✅ Corrected socket event names
    socket.on('round_start', () => {
      setStatus('Game Started');
    });

    socket.on('multiplier_update', (data) => {
      setMultiplier(parseFloat(data.multiplier));
    });

    socket.on('crash', (point) => {
      setStatus(`Crashed at ${point.crashPoint}x`);
      setBetPlaced(false);
      fetchCrashHistory();
    });

    socket.on('cashoutSuccess', (payload) => {
      alert(`Cashout Success: ${payload.cryptoAmount} ${payload.currency} (~$${payload.usdAmount})`);
    });

    return () => {
      socket.off(); // Clean up all socket listeners
      socket.disconnect();
    };
  }, []);

  const fetchCrashHistory = async () => {
    try {
      const res = await API.get('/api/history');
      setCrashHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch crash history:', err);
    }
  };

  const placeBet = async () => {
    if (!bet || parseFloat(bet) <= 0) return alert('Enter a valid bet amount');
    try {
      const res = await API.post('/api/game/bet', {
        playerId,
        usdAmount: parseFloat(bet),
        currency,
      });
      console.log('✅ Bet response:', res.data);
      setBetPlaced(true);
      setStatus('Bet Placed');
    } catch (err) {
      console.error('❌ Failed to place bet:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.error || 'Unknown error';
      alert(`Failed to place bet: ${errorMessage}`);
      if (errorMessage.includes('No active round')) {
        setStatus('Waiting for next round...');
      }
    }
  };

  const cashOut = () => {
    console.log('🟢 Attempting to cash out');
    socket.emit('cashout', { playerId });
  };

  return (
    <div className="bg-gray-800 p-4 rounded-xl shadow text-white">
      <h2 className="text-xl font-semibold mb-4">Crash Game</h2>
      <div className="text-5xl font-bold mb-2 text-yellow-400">{multiplier.toFixed(2)}x</div>
      <p className="mb-4 text-green-400">{status}</p>
      <div className="mb-4">
        <input
          type="number"
          placeholder="Enter USD Bet"
          value={bet}
          onChange={(e) => setBet(e.target.value)}
          className="p-2 rounded w-1/2 text-black"
        />
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="p-2 ml-2 rounded text-black"
        >
          <option value="BTC">BTC</option>
          <option value="ETH">ETH</option>
        </select>
      </div>
      <div className="flex space-x-4">
        <button
          onClick={placeBet}
          disabled={betPlaced}
          className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white"
        >
          Place Bet
        </button>
        <button
          onClick={cashOut}
          disabled={!betPlaced}
          className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded text-white"
        >
          Cash Out
        </button>
      </div>
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Recent Crash History</h3>
        <ul className="space-y-1">
          {crashHistory.map((round, index) => (
            <li key={index} className="text-sm text-gray-300">
              Round {round.roundId}: Crashed at {round.crashPoint}x
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}