'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full" style={{ background: "linear-gradient(180deg, rgba(8,12,24,.55) 0%, rgba(8,12,20,.65) 45%, rgba(6,10,16,.85) 100%), url('/images/upscaled_lofi_rainforest.png') center 70% / cover fixed" }}>
      <div className="mx-auto max-w-4xl px-4 py-16 text-white">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
          <p className="text-white/70 text-lg">Manage vaults and platform settings</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Launch a Vault</h2>
            <p className="text-white/70 mb-6">Create and configure a new vault using our step-by-step wizard</p>
            <button
              onClick={() => router.push('/admin/launch')}
              className="bg-[#58A6FF] hover:bg-[#4a95e6] text-white px-6 py-3 rounded-none shadow-[0_0_18px_rgba(88,166,255,0.45)] font-semibold"
            >
              Start Wizard
            </button>
          </div>
          
          <div className="bg-white/5 backdrop-blur-[10px] ring-1 ring-white/10 p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">View Vaults on Platform</h2>
            <p className="text-white/70 mb-6">Browse, filter, and manage existing vaults</p>
              <button
              onClick={() => router.push('/admin/index')}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-none ring-1 ring-white/10 font-semibold"
              >
              View Vaults
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}