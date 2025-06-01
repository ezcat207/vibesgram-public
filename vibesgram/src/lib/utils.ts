import { env } from "@/env";
import { clsx, type ClassValue } from "clsx";
import cuid from 'cuid';
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a short 10-character ID using cuid
export function generateShortId(): string {
  return cuid().slice(0, 10);
}
