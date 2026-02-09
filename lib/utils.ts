import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Glassmorphism utility classes
export const glass = "bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl";
export const glassDark = "bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl";
