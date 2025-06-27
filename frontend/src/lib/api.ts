export const API_URL =
  (typeof process !== 'undefined' && process.env?.VITE_API_URL) ||
  import.meta.env?.VITE_API_URL ||
  'http://localhost:3001/api';

// This interface matches the structure of backend/data/profil_utilisateur.json
export interface UserProfileJson {
  raison_sociale: string;
  adresse: string;
  code_postal: string;
  ville: string;
  forme_juridique: string;
  siret: string;
  ape_naf: string;
  tva_intra?: string;
  rcs_ou_rm?: string;
  // The JSON file might also store other fields if the backend saves them,
  // but these are the core ones from the task.
  // For fields that were in the old `ProfileData` but not in JSON (email, phone etc):
  // If `getUserProfile` is expected to return them, they'd need to be added here as optional
  // and the backend would need to merge them from somewhere if they are not in the JSON.
  // For this task, we assume `getUserProfile` now strictly returns the JSON content.
  // To support existing ProfilePage.tsx form fields that are not in the new JSON,
  // those fields (like email, phone) will be populated as empty strings or from localStorage/state if needed,
  // but not from `profil_utilisateur.json` if they aren't there.
  // Let's add the extra fields ProfilePage expects, so it doesn't break,
  // assuming the backend might return them if they were part of an older schema or for compatibility.
  // However, the primary source is the JSON file.
  email?: string;
  phone?: string;
  activity_start_date?: string;
  social_capital?: string;
  // Fields from the old ProfileData that ProfilePage.tsx uses for its form state
  full_name?: string; // Will be populated from raison_sociale by ProfilePage if only JSON fields come
  address_street?: string; // Populated from adresse
  address_postal_code?: string; // Populated from code_postal
  address_city?: string; // Populated from ville
  siret_siren?: string; // Populated from siret
  ape_naf_code?: string; // Populated from ape_naf
  vat_number?: string; // Populated from tva_intra
  legal_form?: string; // Populated from forme_juridique
  // rcs_rm is already in UserProfileJson
}


export const GEMINI_API_KEY =
  (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY) ||
  import.meta.env?.VITE_GEMINI_API_KEY ||
  '';

// This interface is used by ProfilePage.tsx for its form state (FormProfileData)
// and is what updateUserProfile will accept.
// It's largely similar to the old ProfileData.
// The backend /api/user-profile POST endpoint is responsible for mapping these fields
// to the `profil_utilisateur.json` structure.
interface ProfileDataForUpdate {
  id?: number;
  full_name: string;        // maps to raison_sociale
  address_street: string;   // maps to adresse
  address_postal_code: string; // maps to code_postal
  address_city: string;     // maps to ville
  siret_siren: string;      // maps to siret
  ape_naf_code: string;     // maps to ape_naf
  vat_number?: string;      // maps to tva_intra
  legal_form: string;       // maps to forme_juridique
  rcs_rm: string;           // maps to rcs_ou_rm
  // These fields are on the form but not in the target JSON as per task.
  // The backend will ignore them when writing to profil_utilisateur.json.
  email: string;
  phone: string;
  activity_start_date?: string;
  social_capital?: string;
  created_at?: string;
  updated_at?: string;
}


const DEFAULT_TOKEN =
  (typeof process !== 'undefined' && process.env?.VITE_API_TOKEN) ||
  import.meta.env?.VITE_API_TOKEN ||
  'test-token';

const getAuthToken = () => {
  // Retrieve the token from localStorage.  If it's not set (first launch),
  // initialise it with the default demo token so API requests succeed.
  if (typeof window !== 'undefined') {
    let token = localStorage.getItem('apiToken');
    if (!token) {
      localStorage.setItem('apiToken', DEFAULT_TOKEN);
      token = DEFAULT_TOKEN;
    }
    return token;
  }
  return DEFAULT_TOKEN;
};

export const apiClient = {
  // getUserProfile now returns the UserProfileJson structure
  getUserProfile: async (): Promise<UserProfileJson> => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      // Propagate the status code in the error message for better handling upstream
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('Profil reçu depuis l\'API:', data);

    if ('full_name' in data) {
      const mapped: UserProfileJson = {
        raison_sociale: data.full_name || '',
        adresse: data.address_street || '',
        code_postal: data.address_postal_code || '',
        ville: data.address_city || '',
        forme_juridique: data.legal_form || '',
        siret: data.siret_siren || '',
        ape_naf: data.ape_naf_code || '',
        tva_intra: data.vat_number || '',
        rcs_ou_rm: data.rcs_rm || '',
        email: data.email,
        phone: data.phone,
        activity_start_date: data.activity_start_date,
        social_capital: data.social_capital,
        full_name: data.full_name,
        address_street: data.address_street,
        address_postal_code: data.address_postal_code,
        address_city: data.address_city,
        siret_siren: data.siret_siren,
        ape_naf_code: data.ape_naf_code,
        vat_number: data.vat_number,
        legal_form: data.legal_form,
      };
      return mapped;
    }

    // Backend might already return the JSON structure
    return data as UserProfileJson;
  },

  // updateUserProfile accepts data structured like FormProfileData from ProfilePage.tsx
  // (which is similar to the old ProfileData, now named ProfileDataForUpdate)
  // The backend is responsible for mapping these fields to the actual JSON structure.
  updateUserProfile: async (profileData: ProfileDataForUpdate): Promise<UserProfileJson> => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
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

  // ---------- Client API Helpers ----------

  getClients: async (): Promise<any[]> => {
    const token = getAuthToken();
    try {
      const response = await fetch(`${API_URL}/clients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        console.error('API getClients error', response.status, response.statusText);
        throw new Error(`Failed to fetch clients: ${response.statusText}`);
      }
      return response.json();
    } catch (err: any) {
      console.error('Network error fetching clients:', err.message);
      throw err;
    }
  },

  getClient: async (id: number): Promise<any> => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/clients/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch client ${id}: ${response.statusText}`);
    }
    return response.json();
  },

  createClient: async (client: any): Promise<any> => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(client),
    });
    if (!response.ok) {
      throw new Error(`Failed to create client: ${response.statusText}`);
    }
    return response.json();
  },

  updateClient: async (id: number, client: any): Promise<any> => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/clients/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(client),
    });
    if (!response.ok) {
      throw new Error(`Failed to update client ${id}: ${response.statusText}`);
    }
    return response.json();
  },

  getInvoices: async (): Promise<any[]> => {
    const token = getAuthToken();
    try {
      const response = await fetch(`${API_URL}/factures`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        console.error('API getInvoices error', response.status, response.statusText);
        throw new Error(`Failed to fetch invoices: ${response.statusText}`);
      }
      const data = await response.json();
      return data.factures || data;
    } catch (err: any) {
      console.error('Network error fetching invoices:', err.message);
      throw err;
    }
  },

  getInvoiceSummary: async (): Promise<{ payees: number; non_payees: number }> => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/invoices/summary`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch invoice summary: ${response.statusText}`);
    }
    return response.json();
  },
  // ... other existing api client methods if any
};
