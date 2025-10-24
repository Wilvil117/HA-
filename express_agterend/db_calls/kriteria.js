const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { getDatabasePath } = require('../db_setup/setup');

// Read functions
/**
 * Get all kriteria from the database.
 * @returns {Promise<Array>} Array of all kriteria.
 */
function getAllKriteria() {
    return new Promise((resolve, reject) => {
        const dbPath = getDatabasePath();
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) return reject(err);
        });

        db.all(
            `SELECT kriteria_id, beskrywing, default_totaal FROM Kriteria`,
            [],
            (err, rows) => {
                db.close();
                if (err) return reject(err);
                resolve(rows);
            }
        );
    });
}

/**
 * Get kriteria info by kriteria ID.
 * @param {number} kriteriaId
 * @returns {Promise<Object|null>}
 */
function getKriteriaById(kriteriaId) {
    return new Promise((resolve, reject) => {
        const dbPath = getDatabasePath();
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) return reject(err);
        });

        db.get(
            `SELECT kriteria_id, beskrywing, default_totaal
             FROM Kriteria
             WHERE kriteria_id = ?`,
            [kriteriaId],
            (err, row) => {
                db.close();
                if (err) return reject(err);
                if (!row) return resolve(null);
                resolve(row);
            }
        );
    });
}

// Create function
/**
 * Create a new kriteria in the database.
 * @param {Object} kriteriaData - Object with kriteria properties: beskrywing, default_totaal
 * @returns {Promise<number>} The ID of the newly created kriteria
 */
function createKriteria(kriteriaData) {
    return new Promise((resolve, reject) => {
        const dbPath = getDatabasePath();
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
            if (err) return reject(err);
        });

        const { beskrywing, default_totaal } = kriteriaData;

        db.run(
            `INSERT INTO Kriteria (beskrywing, default_totaal)
             VALUES (?, ?)`,
            [beskrywing, default_totaal],
            function(err) {
                db.close();
                if (err) return reject(err);
                // The 'this' context refers to the statement. this.lastID is the new kriteria_id.
                resolve(this.lastID);
            }
        );
    });
}

// Update function
/**
 * Update a kriteria by its ID.
 * @param {number} kriteriaId - The ID of the kriteria to update
 * @param {Object} updateData - Properties to update: beskrywing, default_totaal
 * @returns {Promise<void>}
 */
function updateKriteria(kriteriaId, updateData) {
    const { beskrywing, default_totaal } = updateData;
    return new Promise((resolve, reject) => {
        const dbPath = getDatabasePath();
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
            if (err) return reject(err);
        });

        db.run(
            `UPDATE Kriteria
             SET beskrywing = ?, default_totaal = ?
             WHERE kriteria_id = ?`,
            [beskrywing, default_totaal, kriteriaId],
            function(err) {
                db.close();
                if (err) return reject(err);
                resolve();
            }
        );
    });
}

// Delete function
/**
 * Delete a kriteria by its ID.
 * @param {number} kriteriaId - The ID of the kriteria to delete
 * @returns {Promise<void>}
 */
function deleteKriteria(kriteriaId) {
    return new Promise((resolve, reject) => {
        const dbPath = getDatabasePath();
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
            if (err) return reject(err);
        });

        db.run(
            `DELETE FROM Kriteria WHERE kriteria_id = ?`,
            [kriteriaId],
            function(err) {
                db.close();
                if (err) return reject(err);
                resolve();
            }
        );
    });
}

module.exports = {
    getAllKriteria,
    getKriteriaById,
    createKriteria,
    updateKriteria,
    deleteKriteria
};
