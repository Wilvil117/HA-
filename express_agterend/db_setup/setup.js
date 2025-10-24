const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

function getDatabasePath() {
    return path.resolve(__dirname, '..', 'melktert.db');
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

            // Users table for authentication
            db.run(`
                CREATE TABLE IF NOT EXISTS Users (
                    user_id INTEGER PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT NOT NULL CHECK (role IN ('admin', 'beoordelaar')),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Enhanced Rounds table for judge allocation system
            db.run(`
                CREATE TABLE IF NOT EXISTS Rounds (
                    round_id INTEGER PRIMARY KEY,
                    round_name TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'archived')),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    closed_at DATETIME,
                    max_teams INTEGER DEFAULT 15,
                    max_judges_per_team INTEGER DEFAULT 3,
                    max_teams_per_judge INTEGER DEFAULT 3
                )
            `);

            // Teams participation in rounds
            db.run(`
                CREATE TABLE IF NOT EXISTS TeamParticipation (
                    participation_id INTEGER PRIMARY KEY,
                    round_id INTEGER NOT NULL,
                    span_id INTEGER NOT NULL,
                    is_participating INTEGER NOT NULL DEFAULT 1,
                    FOREIGN KEY (round_id) REFERENCES Rounds(round_id) ON DELETE CASCADE,
                    FOREIGN KEY (span_id) REFERENCES Span(span_id) ON DELETE CASCADE,
                    UNIQUE(round_id, span_id)
                )
            `);

            // Judge allocations to teams
            db.run(`
                CREATE TABLE IF NOT EXISTS JudgeAllocations (
                    allocation_id INTEGER PRIMARY KEY,
                    round_id INTEGER NOT NULL,
                    span_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (round_id) REFERENCES Rounds(round_id) ON DELETE CASCADE,
                    FOREIGN KEY (span_id) REFERENCES Span(span_id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
                    UNIQUE(round_id, span_id, user_id)
                )
            `);

            // Enhanced scores table for judge allocation system
            db.run(`
                CREATE TABLE IF NOT EXISTS JudgeScores (
                    score_id INTEGER PRIMARY KEY,
                    allocation_id INTEGER NOT NULL,
                    kriteria_id INTEGER NOT NULL,
                    score INTEGER NOT NULL DEFAULT 0,
                    max_score INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (allocation_id) REFERENCES JudgeAllocations(allocation_id) ON DELETE CASCADE,
                    FOREIGN KEY (kriteria_id) REFERENCES Kriteria(kriteria_id) ON DELETE CASCADE
                )
            `);

            // Round criteria selection
            db.run(`
                CREATE TABLE IF NOT EXISTS RoundCriteria (
                    round_criteria_id INTEGER PRIMARY KEY,
                    round_id INTEGER NOT NULL,
                    kriteria_id INTEGER NOT NULL,
                    is_active INTEGER NOT NULL DEFAULT 1,
                    weight REAL NOT NULL DEFAULT 1.0,
                    FOREIGN KEY (round_id) REFERENCES Rounds(round_id) ON DELETE CASCADE,
                    FOREIGN KEY (kriteria_id) REFERENCES Kriteria(kriteria_id) ON DELETE CASCADE,
                    UNIQUE(round_id, kriteria_id)
                )
            `);

            // Insert dummy data for Span and Lid tables
            db.run(`
                INSERT OR IGNORE INTO Span (span_id, naam, projek_beskrywing, span_bio) 
                VALUES 
                (1, 'Melktert Masters', 'Die toekoms van wegneem melktert bestellings', 'Ons skep full stack web apps'),
                (2, 'Code Crusaders', 'AI-gedrewe student hulp platform', 'Machine learning en web development'),
                (3, 'Data Dynamos', 'Real-time verkeer navigasie sisteem', 'IoT en data analise'),
                (4, 'Cloud Champions', 'Beveiligde mediese rekord bestuur', 'Healthcare en cybersecurity'),
                (5, 'Byte Builders', 'Slimme boerderij monitoring', 'IoT sensors en mobile apps'),
                (6, 'Tech Titans', 'Virtual reality onderwys platform', 'VR/AR en game development'),
                (7, 'Pixel Pioneers', 'E-commerce met AI aanbevelings', 'Machine learning en web apps'),
                (8, 'Algorithm Architects', 'Fintech betaling sisteem', 'Blockchain en fintech'),
                (9, 'Digital Dreamers', 'Sosiale netwerk vir studente', 'Social media en mobile apps'),
                (10, 'Code Crafters', 'Smart city verkeer bestuur', 'IoT en data visualisering'),
                (11, 'Tech Trailblazers', 'Online leer platform', 'EdTech en web development'),
                (12, 'Data Defenders', 'Cybersecurity monitoring tool', 'Security en network analysis'),
                (13, 'Cloud Coders', 'Restaurant bestelling sisteem', 'Mobile apps en backend services'),
                (14, 'Byte Busters', 'Fitness tracking app', 'Mobile development en health tech'),
                (15, 'Pixel Perfect', 'Event management platform', 'Web development en project management')
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

            // Insert default users
            db.run(`
                INSERT OR IGNORE INTO Users (email, password, role) 
                VALUES 
                ('admin@admin.co.za', 'admin123', 'admin'),
                ('beoordelaar@beoordelaar.co.za', 'beoordelaar123', 'beoordelaar'),
                ('beoordelaar1@beoordelaar.co.za', 'beoordelaar123', 'beoordelaar'),
                ('beoordelaar2@beoordelaar.co.za', 'beoordelaar123', 'beoordelaar'),
                ('beoordelaar3@beoordelaar.co.za', 'beoordelaar123', 'beoordelaar'),
                ('admin1@admin.co.za', 'admin123', 'admin'),
                ('admin2@admin.co.za', 'admin123', 'admin')
            `);

            // Insert sample round data
            db.run(`
                INSERT OR IGNORE INTO Rounds (round_id, round_name, status, max_teams, max_judges_per_team, max_teams_per_judge) 
                VALUES 
                (1, 'Capstone 2024 - Final Round', 'open', 15, 3, 3),
                (2, 'Capstone 2024 - Semi-Final', 'closed', 8, 2, 4)
            `);

            // Insert sample team participation
            db.run(`
                INSERT OR IGNORE INTO TeamParticipation (round_id, span_id, is_participating) 
                VALUES 
                (1, 1, 1), (1, 2, 1), (1, 3, 1), (1, 4, 1), (1, 5, 1), (1, 6, 1), (1, 7, 1), (1, 8, 1), (1, 9, 1), (1, 10, 1), (1, 11, 1), (1, 12, 1), (1, 13, 1), (1, 14, 1), (1, 15, 1),
                (2, 1, 1), (2, 2, 1), (2, 3, 1), (2, 4, 1), (2, 5, 1), (2, 6, 1), (2, 7, 1), (2, 8, 1)
            `);

            // Insert sample round criteria
            db.run(`
                INSERT OR IGNORE INTO RoundCriteria (round_id, kriteria_id, is_active, weight) 
                VALUES 
                (1, 1, 1, 1.0),
                (1, 2, 1, 1.0),
                (1, 3, 1, 1.0)
            `);

            db.close((err) => {
                if (err) return reject(err);
                return resolve(dbPath);
            });
        });
    });
}

module.exports = { initializeDatabase, getDatabasePath };


