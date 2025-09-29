import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimerLength(seconds: number): string {
  // Ensure minimum 60 seconds (1 minute)
  const minSeconds = Math.max(seconds, 60);
  
  const hours = Math.floor(minSeconds / 3600);
  const minutes = Math.floor((minSeconds % 3600) / 60);
  
  if (hours > 0) {
    if (minutes > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
  } else if (minutes > 0) {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  } else {
    return `1 min`;
  }
}

// Normalize backend relative urls like "/uploads/xyz.png" to absolute
export function normalizeBackendUrl(pathOrUrl?: string, backendBase?: string) {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = backendBase || 'https://treasury-vault-timer-backend.onrender.com';
  // If it already starts with /uploads, keep; else assume uploads path
  const cleaned = pathOrUrl.replace(/^\/*/, '');
  const prefixed = cleaned.startsWith('uploads/') ? cleaned : `uploads/${cleaned}`;
  return `${base}/${prefixed}`;
}



