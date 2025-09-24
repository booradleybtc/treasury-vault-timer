import React from "react";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassPanel({ children, className = "" }: GlassPanelProps) {
  return (
    <div className={`border border-white/12 bg-white/[0.05] backdrop-blur-xl shadow-card rounded-lg ${className}`}>
      {children}
    </div>
  );
}




