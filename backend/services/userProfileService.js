const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USER_PROFILE_PATH = path.join(DATA_DIR, 'profil_utilisateur.json');

// Ensure the data directory exists
const ensureDataDir = async () => {
  try {
    await fs.access(DATA_DIR);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(DATA_DIR, { recursive: true });
    } else {
      throw error;
    }
  }
};

/**
 * Reads the user profile from profil_utilisateur.json.
 * @returns {Promise<object|null>} The profile data or null if not found/error.
 */
const readUserProfile = async () => {
  await ensureDataDir();
  try {
    const data = await fs.readFile(USER_PROFILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // File does not exist
    }
    console.error('Error reading user profile:', error);
    // For other errors (e.g., malformed JSON), we might also return null or throw
    return null;
  }
};

/**
 * Writes the user profile to profil_utilisateur.json.
 * @param {object} profileData The profile data to save.
 * @returns {Promise<object>} The saved profile data.
 * @throws {Error} If validation fails or write fails.
 */
const writeUserProfile = async (profileData) => {
  await ensureDataDir();

  // Validate critical fields
  const requiredFields = {
    raison_sociale: "Raison sociale",
    adresse: "Adresse",
    code_postal: "Code postal",
    ville: "Ville",
    forme_juridique: "Forme juridique",
    siret: "SIRET",
    ape_naf: "Code APE/NAF"
    // tva_intra is not strictly required by all businesses
    // rcs_ou_rm is not strictly required by all businesses
  };

  for (const field in requiredFields) {
    if (!profileData[field] || String(profileData[field]).trim() === '') {
      throw new Error(`Le champ '${requiredFields[field]}' (${field}) est requis.`);
    }
  }

  // Structure according to the task
  const structuredData = {
    raison_sociale: String(profileData.raison_sociale || '').trim(),
    adresse: String(profileData.adresse || '').trim(),
    code_postal: String(profileData.code_postal || '').trim(),
    ville: String(profileData.ville || '').trim(),
    forme_juridique: String(profileData.forme_juridique || '').trim(),
    siret: String(profileData.siret || '').trim(),
    ape_naf: String(profileData.ape_naf || '').trim(),
    tva_intra: String(profileData.tva_intra || '').trim(),
    rcs_ou_rm: String(profileData.rcs_ou_rm || '').trim()
  };

  try {
    await fs.writeFile(USER_PROFILE_PATH, JSON.stringify(structuredData, null, 2), 'utf-8');
    return structuredData;
  } catch (error) {
    console.error('Error writing user profile:', error);
    throw new Error('Failed to save user profile.');
  }
};

module.exports = {
  readUserProfile,
  writeUserProfile,
  USER_PROFILE_PATH // Export for potential direct use in server.js for fallback check
};
