const SQLiteDatabase = require('../backend/database/sqlite');

(async () => {
  const db = await SQLiteDatabase.create();
  const factures = db.getFactures();
  const clients = db.getClients();

  const mapped = factures.map(f => {
    const client = clients.find(c => c.id === f.client_id);
    return {
      id: f.id,
      numero: f.numero_facture,
      client: client ? (client.nom_entreprise || client.nom_client) : 'Inconnu',
    };
  });

  console.table(mapped);
})();
