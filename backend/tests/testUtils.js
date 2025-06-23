const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USER_PROFILE_PATH = path.join(DATA_DIR, 'profil_utilisateur.json');

const DUMMY_PROFILE_DATA = {
  raison_sociale: "Test Utility Company",
  adresse: "456 Utility Ave",
  code_postal: "67890",
  ville: "Utilville",
  forme_juridique: "SARL",
  siret: "98765432100012",
  ape_naf: "1234Z",
  tva_intra: "FR987654321",
  rcs_ou_rm: "RCS Utilville 987 654 321"
};

async function setupDummyProfile() {
  try {
    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });
    // Write the dummy profile
    await fs.writeFile(USER_PROFILE_PATH, JSON.stringify(DUMMY_PROFILE_DATA, null, 2), 'utf-8');
    // console.log('Dummy profile created at:', USER_PROFILE_PATH);
  } catch (error) {
    console.error('Error setting up dummy profile:', error);
    // throw error; // rethrow to fail tests if setup is critical
  }
}

async function cleanupDummyProfile() {
  try {
    await fs.unlink(USER_PROFILE_PATH);
    // console.log('Dummy profile cleaned up from:', USER_PROFILE_PATH);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File didn't exist, which is fine for cleanup
      // console.log('Dummy profile file did not exist, no cleanup needed.');
    } else {
      console.error('Error cleaning up dummy profile:', error);
    }
  }
}

module.exports = {
  setupDummyProfile,
  cleanupDummyProfile,
  DUMMY_PROFILE_DATA,
  USER_PROFILE_PATH
};
