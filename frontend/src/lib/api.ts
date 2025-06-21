export const API_URL =
  typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL
    ? (import.meta as any).env.VITE_API_URL
    : 'http://localhost:3001/api';

export const GEMINI_API_KEY =
  typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY
    ? (import.meta as any).env.VITE_GEMINI_API_KEY
    : '';
