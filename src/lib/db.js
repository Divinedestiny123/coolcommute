import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'coolcommute.sqlite'));

db.exec(`
  CREATE TABLE IF NOT EXISTS stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    routes_calculated INTEGER DEFAULT 0,
    citizens_rerouted INTEGER DEFAULT 0,
    avg_city_temp REAL DEFAULT 101.4,
    active_heat_islands INTEGER DEFAULT 14,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS heat_islands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    temperature REAL NOT NULL,
    risk_level TEXT NOT NULL
  );
`);

const statsRow = db.prepare('SELECT * FROM stats LIMIT 1').get();
if (!statsRow) {
  db.prepare('INSERT INTO stats (routes_calculated, citizens_rerouted, avg_city_temp, active_heat_islands) VALUES (?, ?, ?, ?)').run(0, 2450, 101.4, 14);
  
  const insertIsland = db.prepare('INSERT INTO heat_islands (name, temperature, risk_level) VALUES (?, ?, ?)');
  insertIsland.run('Downtown Commercial Dist.', 112, 'Extreme Risk');
  insertIsland.run('Eastside Industrial Park', 108, 'High Risk');
}

export default db;
