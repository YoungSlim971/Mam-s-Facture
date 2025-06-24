// Utility functions for managing the seller profile in localStorage
// Provides quick access without needing to refetch every time.

import { apiClient, UserProfileJson } from '@/lib/api';

export type ProfilUtilisateurType = UserProfileJson;

const LOCAL_STORAGE_KEY = 'userProfile';

export function saveUserProfileToLocal(profile: ProfilUtilisateurType): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
    }
  } catch (err) {
    console.error('Failed to save user profile to localStorage', err);
  }
}

export function getUserProfileFromLocal(): ProfilUtilisateurType | null {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem(LOCAL_STORAGE_KEY);
    return item ? (JSON.parse(item) as ProfilUtilisateurType) : null;
  } catch (err) {
    console.error('Failed to read user profile from localStorage', err);
    return null;
  }
}

export async function fetchAndSyncUserProfile(): Promise<ProfilUtilisateurType> {
  try {
    const profile = await apiClient.getUserProfile();
    saveUserProfileToLocal(profile);
    return profile;
  } catch (err) {
    const local = getUserProfileFromLocal();
    if (local) return local;
    throw err;
  }
}
