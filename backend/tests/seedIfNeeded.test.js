const fs = require('fs');
const path = require('path');
const SQLiteDatabase = require('../database/sqlite');

const dbPath = path.join(__dirname, '..', 'database', 'facturation.sqlite');

let app;

const waitForSeed = async () => {
  for (let i = 0; i < 20; i++) {
    if (fs.existsSync(dbPath)) {
      const db = await SQLiteDatabase.create();
      if (db.getMeta('hasSeeded')) return;
    }
    await new Promise(res => setTimeout(res, 100));
  }
};

describe('seedIfNeeded() on server startup', () => {
  beforeAll(async () => {
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    jest.resetModules();
    app = await require('../server');
    await waitForSeed();
  });

  test('inserts demo data and sets hasSeeded', async () => {
    const db = await SQLiteDatabase.create();
    const hasSeeded = db.getMeta('hasSeeded');
    expect(hasSeeded).toBe('true');
    expect(db.getClients().length).toBeGreaterThanOrEqual(1);
    const profile = db.getUserProfile();
    expect(profile.full_name).toBeTruthy();
  });

  test('does not reseed when restarted', async () => {
    const db1 = await SQLiteDatabase.create();
    const clientCount = db1.getClients().length;
    jest.resetModules();
    app = await require('../server');
    await waitForSeed();
    const db2 = await SQLiteDatabase.create();
    expect(db2.getMeta('hasSeeded')).toBe('true');
    expect(db2.getClients().length).toBe(clientCount);
  });
});
