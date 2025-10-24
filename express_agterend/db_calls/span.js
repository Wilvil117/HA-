const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { getDatabasePath } = require('../db_setup/setup');

//Read functions
/**
 * Get team info by team (span) ID.
 * @param {number} spanId
 * @returns {Promise<Object|null>}
 */
function getTeamById(spanId) {
    return new Promise((resolve, reject) => {
        const dbPath = getDatabasePath();
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) return reject(err);
        });

        db.get(
            `SELECT span_id, naam, projek_beskrywing, span_bio, logo
             FROM Span
             WHERE span_id = ?`,
            [spanId],
            (err, row) => {
                db.close();
                if (err) return reject(err);
                if (!row) return resolve(null);
                resolve(row);
            }
        );
    });
}

/**
 * Get all teams (spanne) from the database.
 * @returns {Promise<Array>} Array of all teams.
 */
function getAllTeams() {
    return new Promise((resolve, reject) => {
        const dbPath = getDatabasePath();
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) return reject(err);
        });

        db.all(
            `SELECT span_id, naam, projek_beskrywing, span_bio, logo FROM Span`,
            [],
            (err, rows) => {
                db.close();
                if (err) return reject(err);
                resolve(rows);
            }
        );
    });
}

module.exports = {
    getTeamById,
    getAllTeams,
    getMembersByTeamId,
    createTeam,
    // ... (add other exports if needed)
};


/**
 * Get all members for a given team (span) ID.
 * @param {number} spanId
 * @returns {Promise<Array>}
 */
function getMembersByTeamId(spanId) {
    return new Promise((resolve, reject) => {
        const dbPath = getDatabasePath();
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) return reject(err);
        });

        db.all(
            `SELECT lid_id, span_id, naam, bio, foto
             FROM Lid
             WHERE span_id = ?`,
            [spanId],
            (err, rows) => {
                db.close();
                if (err) return reject(err);
                resolve(rows);
            }
        );
    });
}


//Create functions
/**
 * Create a new team (span) in the database.
 * @param {Object} teamData - Object with team properties: naam, projek_beskrywing, span_bio, logo
 * @returns {Promise<number>} The ID of the newly created team (span)
 */
function createTeam(teamData) {
    return new Promise((resolve, reject) => {
        const dbPath = getDatabasePath();
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
            if (err) return reject(err);
        });

        const { naam, projek_beskrywing, span_bio, logo } = teamData;

        db.run(
            `INSERT INTO Span (naam, projek_beskrywing, span_bio, logo)
             VALUES (?, ?, ?, ?)`,
            [naam, projek_beskrywing, span_bio, logo],
            function(err) {
                db.close();
                if (err) return reject(err);
                // The 'this' context refers to the statement. this.lastID is the new span_id.
                resolve(this.lastID);
            }
        );
    });
}

/**
 * Create a new member (lid) for a team (span) in the database.
 * @param {Object} memberData - Object with member properties: span_id, naam, bio, foto
 * @returns {Promise<number>} The ID of the newly created member (lid)
 */
function createMember(memberData) {
    return new Promise((resolve, reject) => {
        const dbPath = getDatabasePath();
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
            if (err) return reject(err);
        });

        const { span_id, naam, bio, foto } = memberData;

        db.run(
            `INSERT INTO Lid (span_id, naam, bio, foto)
             VALUES (?, ?, ?, ?)`,
            [span_id, naam, bio, foto],
            function(err) {
                db.close();
                if (err) return reject(err);
                // The 'this' context refers to the statement. this.lastID is the new lid_id.
                resolve(this.lastID);
            }
        );
    });
}


/**
 * Delete a team (span) by its ID.
 * @param {number} spanId - The ID of the team (span) to delete
 * @returns {Promise<void>}
 */
function deleteTeam(spanId) {
    return new Promise((resolve, reject) => {
        const dbPath = getDatabasePath();
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
            if (err) return reject(err);
        });

        db.run(
            `DELETE FROM Span WHERE span_id = ?`,
            [spanId],
            function(err) {
                db.close();
                if (err) return reject(err);
                resolve();
            }
        );
    });
}

/**
 * Update a team (span) by its ID.
 * @param {number} spanId - The ID of the team (span) to update
 * @param {Object} updateData - Properties to update: naam, projek_beskrywing, span_bio, logo
 * @returns {Promise<void>}
 */
function updateTeam(spanId, updateData) {
    const { naam, projek_beskrywing, span_bio, logo } = updateData;
    return new Promise((resolve, reject) => {
        const dbPath = getDatabasePath();
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
            if (err) return reject(err);
        });

        db.run(
            `UPDATE Span
             SET naam = ?, projek_beskrywing = ?, span_bio = ?, logo = ?
             WHERE span_id = ?`,
            [naam, projek_beskrywing, span_bio, logo, spanId],
            function(err) {
                db.close();
                if (err) return reject(err);
                resolve();
            }
        );
    });
}

/**
 * Delete a member (lid) by its ID.
 * @param {number} lidId - The ID of the member (lid) to delete
 * @returns {Promise<void>}
 */
function deleteMember(lidId) {
    return new Promise((resolve, reject) => {
        const dbPath = getDatabasePath();
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
            if (err) return reject(err);
        });

        db.run(
            `DELETE FROM Lid WHERE lid_id = ?`,
            [lidId],
            function(err) {
                db.close();
                if (err) return reject(err);
                resolve();
            }
        );
    });
}

/**
 * Update a member (lid) by its ID.
 * @param {number} lidId - The ID of the member (lid) to update
 * @param {Object} updateData - Properties to update: naam, bio, foto
 * @returns {Promise<void>}
 */
function updateMember(lidId, updateData) {
    const { naam, bio, foto } = updateData;
    return new Promise((resolve, reject) => {
        const dbPath = getDatabasePath();
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
            if (err) return reject(err);
        });

        db.run(
            `UPDATE Lid
             SET naam = ?, bio = ?, foto = ?
             WHERE lid_id = ?`,
            [naam, bio, foto, lidId],
            function(err) {
                db.close();
                if (err) return reject(err);
                resolve();
            }
        );
    });
}




module.exports = {
    getTeamById,
    getAllTeams,
    getMembersByTeamId,
    createTeam,
    createMember,
    updateTeam,
    updateMember,
    deleteTeam,
    deleteMember
};
