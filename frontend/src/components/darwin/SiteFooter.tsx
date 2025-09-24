import React from "react";

export function SiteFooter() {
  return (
    <footer className="relative mt-16 border-t border-white/10 ring-0 bg-[radial-gradient(1000px_400px_at_50%_-10%,rgba(10,20,40,.45),transparent_60%)]">
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:py-12 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/images/78.png" alt="Darwin" className="h-8 w-8 object-contain" />
            <span className="text-sm text-white/70">Evolve your treasury.</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#" className="inline-flex items-center justify-center rounded-none border-0 ring-0 bg-white/5 px-4 py-2 text-sm text-white/90 hover:bg-white/10">Docs</a>
            <a href="#" className="inline-flex items-center justify-center rounded-none bg-white text-black px-4 py-2 text-sm font-semibold">Launch Vault</a>
          </div>
        </div>
        <div className="mt-8 text-xs text-white/50 flex items-center justify-between">
          <div>© {new Date().getFullYear()} Darwin Labs</div>
          <div className="space-x-4"><a href="#" className="hover:text-white/70">Terms</a><a href="#" className="hover:text-white/70">Privacy</a></div>
        </div>
      </div>
    </footer>
  );
}



