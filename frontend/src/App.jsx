import React from 'react';
import Game from './components/Game';
import Wallet from './components/Wallet';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4">
      <h1 className="text-4xl font-bold text-center mb-6">Crypto Crash Game</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <Wallet />
        </div>
        <div className="md:col-span-2">
          <Game />
        </div>
      </div>
    </div>
  );
}