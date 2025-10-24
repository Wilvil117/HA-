const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

function getDatabasePath() {
    return path.resolve(__dirname, '../../express_agterend', 'melktert.db');
}

function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const dbPath = getDatabasePath();

        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) return reject(err);
        });

        db.serialize(() => {
            db.run('PRAGMA foreign_keys = ON');

            // Span table
            db.run(`
                CREATE TABLE IF NOT EXISTS Span (
                    span_id INTEGER PRIMARY KEY,
                    naam TEXT NOT NULL,
                    logo TEXT,
                    projek_beskrywing TEXT,
                    span_bio TEXT
                )
            `);

            // Lid table
            db.run(`
                CREATE TABLE IF NOT EXISTS Lid (
                    lid_id INTEGER PRIMARY KEY,
                    span_id INTEGER NOT NULL,
                    naam TEXT NOT NULL,
                    foto TEXT,
                    bio TEXT,
                    FOREIGN KEY (span_id) REFERENCES Span(span_id) ON DELETE CASCADE
                )
            `);

            // Rondte table
            // max_spanne is 'n % van die spanne wat deelneem
            db.run(`
                CREATE TABLE IF NOT EXISTS Rondte (
                    rondte_id INTEGER PRIMARY KEY,
                    is_eerste INTEGER NOT NULL DEFAULT 0,
                    is_laaste INTEGER NOT NULL DEFAULT 0,
                    is_oop INTEGER NOT NULL DEFAULT 1,
                    max_spanne REAL NOT NULL 
                )
            `);

            // Kriteria table
            db.run(`
                CREATE TABLE IF NOT EXISTS Kriteria (
                    kriteria_id INTEGER PRIMARY KEY,
                    beskrywing TEXT NOT NULL,
                    default_totaal INTEGER NOT NULL
                )
            `);

            // Merkblad table
            db.run(`
                CREATE TABLE IF NOT EXISTS Merkblad (
                    merkblad_id INTEGER PRIMARY KEY,
                    rondte_id INTEGER NOT NULL,
                    kriteria_id INTEGER NOT NULL,
                    totaal INTEGER,
                    FOREIGN KEY (rondte_id) REFERENCES Rondte(rondte_id) ON DELETE CASCADE,
                    FOREIGN KEY (kriteria_id) REFERENCES Kriteria(kriteria_id) ON DELETE CASCADE
                )
            `);

            // Punte_span_brug table
            db.run(`
                CREATE TABLE IF NOT EXISTS Punte_span_brug (
                    id INTEGER PRIMARY KEY,
                    merkblad_id INTEGER NOT NULL,
                    span_id INTEGER NOT NULL,
                    punt INTEGER NOT NULL,
                    FOREIGN KEY (merkblad_id) REFERENCES merkblad(merkblad_id) ON DELETE CASCADE,
                    FOREIGN KEY (span_id) REFERENCES Span(span_id) ON DELETE CASCADE
                )
            `);

            // rondte_uitslag table
            db.run(`
                CREATE TABLE IF NOT EXISTS rondte_uitslag (
                    span_id INTEGER NOT NULL,
                    rondte_id INTEGER NOT NULL,
                    rank INTEGER,
                    in_gevaar INTEGER NOT NULL DEFAULT 1,
                    gemiddelde_punt INTEGER NOT NULL DEFAULT 0,
                    PRIMARY KEY (span_id, rondte_id),
                    FOREIGN KEY (span_id) REFERENCES Span(span_id) ON DELETE CASCADE,
                    FOREIGN KEY (rondte_id) REFERENCES Rondte(rondte_id) ON DELETE CASCADE
                )
            `);

            // Insert dummy data for Span and Lid tables
            db.run(`
                INSERT OR IGNORE INTO Span (span_id, naam, projek_beskrywing, span_bio) 
                VALUES (1, 'Melktert Masters', 'Die toekoms van wegneem melktert bestellings', 'Ons skep full stack web apps')
            `);

            db.run(`
                INSERT OR IGNORE INTO Lid (lid_id, span_id, naam, bio) 
                VALUES 
                (1, 1, 'Die Leier', 'Hou van projek bestuur.'),
                (2, 1, 'Die react dev', 'Hou van gebruikerskoppelvlakke skep.'),
                (3, 1, 'Die express dev', 'Hou van agterend dienste skep.'),
                (4, 1, 'Die DB dev', 'Hou van data en databasisse.')
            `);

            // Insert dummy data for Kriteria table
            db.run(`
                INSERT OR IGNORE INTO Kriteria (kriteria_id, beskrywing, default_totaal) 
                VALUES 
                (1, 'Backend Development', 100),
                (2, 'Frontend Development', 100),
                (3, 'Database Design', 100)
            `);

            // Insert first and only round data for Rondte table
            db.run(`
                INSERT OR IGNORE INTO Rondte (rondte_id, is_eerste, is_laaste, is_oop, max_spanne) 
                VALUES 
                (1, 1, 1, 1, 100)
            `);

            db.close((err) => {
                if (err) return reject(err);
                return resolve(dbPath);
            });
        });
    });
}

module.exports = { initializeDatabase, getDatabasePath };


