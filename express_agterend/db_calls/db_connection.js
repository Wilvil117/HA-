const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function getDatabasePath() {
    return path.resolve(__dirname, '..', 'melktert.db');
}

function getDb() {
    const dbPath = getDatabasePath();
    return new sqlite3.Database(dbPath);
}

module.exports = { getDb };
