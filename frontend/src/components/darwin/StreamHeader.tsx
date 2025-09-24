import React, { useState } from "react";

export function StreamHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-black/20 border-b border-white/10 ring-0">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 flex items-center justify-between">
          {/* Left: brand */}
          <div className="flex items-center gap-3">
            <img src="/images/78.png" alt="Darwin" className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 object-contain" />
          </div>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-6 text-white/90 text-sm md:text-base">
            <a href="#how" className="hover:text-white">How it Works</a>
            <a href="#calculator" className="hover:text-white">Calculator</a>
            <a href="#docs" className="hover:text-white">Docs</a>
          </nav>

          {/* Right: Launch CTA + Mobile menu */}
          <div className="flex items-center gap-3">
            <button className="hidden sm:inline-flex items-center justify-center rounded-none bg-white text-black px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold hover:bg-white/90 shadow-lg">
              Launch Vault
            </button>
            
            {/* Mobile hamburger */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-white/90 hover:text-white"
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-black/90 backdrop-blur-md border-l border-white/10 p-6">
            <div className="flex items-center justify-between mb-8">
              <img src="/images/78.png" alt="Darwin" className="h-8 w-8 object-contain" />
              <button onClick={() => setIsMenuOpen(false)} className="p-2 text-white/90 hover:text-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <nav className="space-y-6">
              <button 
                onClick={() => {
                  setIsMenuOpen(false);
                  // Trigger How it Works modal
                  const event = new CustomEvent('showHowItWorks');
                  window.dispatchEvent(event);
                }}
                className="block w-full text-left text-white/90 hover:text-white text-lg"
              >
                How it Works
              </button>
              <a href="#calculator" className="block text-white/90 hover:text-white text-lg" onClick={() => setIsMenuOpen(false)}>Calculator</a>
              <a href="#docs" className="block text-white/90 hover:text-white text-lg" onClick={() => setIsMenuOpen(false)}>Docs</a>
              
              <div className="pt-6 border-t border-white/10">
                <button className="w-full inline-flex items-center justify-center rounded-none bg-white text-black px-4 py-3 text-sm font-semibold hover:bg-white/90">
                  Launch Vault
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
