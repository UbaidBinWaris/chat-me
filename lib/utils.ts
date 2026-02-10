import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const glass = "backdrop-filter backdrop-blur-lg bg-white/10 border border-white/20 shadow-lg"
export const glassDark = "backdrop-filter backdrop-blur-lg bg-black/40 border border-white/10 shadow-lg"
