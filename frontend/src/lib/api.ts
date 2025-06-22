/* eslint-disable no-eval */
let metaUrl = '';
try {
  metaUrl = eval('import.meta.env?.VITE_API_URL') || '';
} catch {
  metaUrl = '';
}
export const API_URL =
  (typeof process !== 'undefined' && process.env?.VITE_API_URL) ||
  metaUrl ||
  'http://localhost:3001/api';

export const GEMINI_API_KEY =
  (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY) ||
  (() => {
    try {
      return eval('import.meta.env?.VITE_GEMINI_API_KEY') || '';
    } catch {
      return '';
    }
  })();
