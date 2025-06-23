export const API_URL =
  (typeof process !== 'undefined' && process.env?.VITE_API_URL) ||
  import.meta.env?.VITE_API_URL ||
  'http://localhost:3001/api';

export const GEMINI_API_KEY =
  (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY) ||
  import.meta.env?.VITE_GEMINI_API_KEY ||
  '';

// TODO: Define a proper type for ProfileData, perhaps share it with the backend or ProfilePage.tsx
interface ProfileData {
  id?: number;
  full_name: string;
  address_street: string;
  address_postal_code: string;
  address_city: string;
  siret_siren: string;
  ape_naf_code: string;
  vat_number?: string;
  email: string;
  phone: string;
  activity_start_date?: string;
  created_at?: string;
  updated_at?: string;
}


const getAuthToken = () => {
  // In a real app, you'd get this from localStorage, Redux store, context, etc.
  // For this example, let's assume it's stored in localStorage or is a known static value.
  // This matches the simple token check in backend/server.js (process.env.API_TOKEN)
  // Replace 'your_static_api_token' with the actual token if it's static,
  // or implement proper token retrieval.
  return localStorage.getItem('apiToken') || 'TEST_TOKEN_FROM_FRONTEND';
};

export const apiClient = {
  getUserProfile: async (): Promise<ProfileData> => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/user-profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }
    return response.json();
  },

  updateUserProfile: async (profileData: ProfileData): Promise<ProfileData> => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/user-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
    if (!response.ok) {
      throw new Error(`Failed to update user profile: ${response.statusText}`);
    }
    return response.json();
  },
  // ... other existing api client methods if any
};
