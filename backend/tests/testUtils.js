const SQLiteDatabase = require('../database/sqlite');


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
    const db = await SQLiteDatabase.create();
    db.upsertUserProfile({
      full_name: DUMMY_PROFILE_DATA.raison_sociale,
      address_street: DUMMY_PROFILE_DATA.adresse,
      address_postal_code: DUMMY_PROFILE_DATA.code_postal,
      address_city: DUMMY_PROFILE_DATA.ville,
      siret_siren: DUMMY_PROFILE_DATA.siret,
      ape_naf_code: DUMMY_PROFILE_DATA.ape_naf,
      vat_number: DUMMY_PROFILE_DATA.tva_intra,
      legal_form: DUMMY_PROFILE_DATA.forme_juridique,
      rcs_rm: DUMMY_PROFILE_DATA.rcs_ou_rm
    });
  } catch (error) {
    console.error('Error setting up dummy profile:', error);
  }
}

async function cleanupDummyProfile() {
  try {
    const db = await SQLiteDatabase.create();
    db.db.run('DELETE FROM user_profile');
    db.save();
  } catch (error) {
    console.error('Error cleaning up dummy profile:', error);
  }
}

module.exports = {
  setupDummyProfile,
  cleanupDummyProfile,
  DUMMY_PROFILE_DATA
};
