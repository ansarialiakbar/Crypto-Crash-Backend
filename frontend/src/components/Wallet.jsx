import React, { useEffect, useState } from 'react';
import API from '../utils/api';

export default function Wallet() {
  const [wallet, setWallet] = useState({
    BTC: { amount: 0, usd: 0 },
    ETH: { amount: 0, usd: 0 },
    usdValue: 0
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    API.get('/api/wallet/6884f551053cf0a12b1a749d')
      .then(res => setWallet(res.data))
      .catch(err => {
        console.error('Error fetching wallet:', err);
        setError('Failed to load wallet.');
      });
  }, []);

  return (
    <div className="bg-gray-800 p-4 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-2">Wallet Balance</h2>
      {error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          <p>
            <strong>BTC:</strong> {wallet.BTC.amount ?? 0} BTC (~$
            {wallet.BTC.usd?.toFixed(2) ?? '0.00'})
          </p>
          <p>
            <strong>ETH:</strong> {wallet.ETH.amount ?? 0} ETH (~$
            {wallet.ETH.usd?.toFixed(2) ?? '0.00'})
          </p>
          <p>
            <strong>Total USD:</strong> ${wallet.usdValue?.toFixed(2) ?? '0.00'}
          </p>
        </>
      )}
    </div>
  );
}
