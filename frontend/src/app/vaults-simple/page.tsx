'use client';

import React, { useState, useEffect } from 'react';

export default function SimpleVaultsPage() {
  const [vaults, setVaults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://treasury-vault-timer-backend.onrender.com';

  useEffect(() => {
    const loadVaults = async () => {
      try {
        console.log('Loading vaults from:', `${BACKEND_URL}/api/admin/vaults`);
        const response = await fetch(`${BACKEND_URL}/api/admin/vaults`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          mode: 'cors'
        });

        console.log('Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Data received:', data);
          setVaults(data.vaults || []);
          setError(null);
        } else {
          setError(`Failed to load vaults: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error('Failed to load vaults:', error);
        setError(`Failed to load vaults: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadVaults();
  }, [BACKEND_URL]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading vaults...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Vaults ({vaults.length})</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vaults.map((vault) => (
            <div key={vault.id} className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-bold text-white mb-2">{vault.name}</h2>
              <p className="text-gray-300 mb-2">ID: {vault.id}</p>
              <p className="text-gray-300 mb-2">Status: {vault.status}</p>
              <p className="text-gray-300 mb-2">Ticker: {vault.meta?.ticker || 'N/A'}</p>
              <p className="text-gray-300 mb-2">Created: {new Date(vault.createdAt).toLocaleDateString()}</p>
              <div className="mt-4">
                <a 
                  href={`/vault/${vault.id}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  View Vault
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
