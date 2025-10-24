const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, '../melktert.db');
const db = new sqlite3.Database(dbPath);

// CREATE - Insert a new punt record
const createPunt = (merkblad_id, span_id, punt) => {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO Punte_span_brug (merkblad_id, span_id, punt) VALUES (?, ?, ?)`;
        db.run(sql, [merkblad_id, span_id, punt], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, merkblad_id, span_id, punt });
            }
        });
    });
};

// READ - Get all punt records
const getAllPunte = () => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM Punte_span_brug ORDER BY id`;
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};



// READ - Get punt by ID
const getPuntById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM Punte_span_brug WHERE id = ?`;
        db.get(sql, [id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

// READ - Get punte by merkblad_id
const getPunteByMerkbladId = (merkblad_id) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM Punte_span_brug WHERE merkblad_id = ? ORDER BY span_id`;
        db.all(sql, [merkblad_id], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// READ - Get punte by span_id
const getPunteBySpanId = (span_id) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM Punte_span_brug WHERE span_id = ? ORDER BY merkblad_id`;
        db.all(sql, [span_id], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// READ - Get punt by merkblad_id and span_id
const getPuntByMerkbladAndSpan = (merkblad_id, span_id) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM Punte_span_brug WHERE merkblad_id = ? AND span_id = ?`;
        db.get(sql, [merkblad_id, span_id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

// UPDATE - Update punt by ID
const updatePunt = (id, merkblad_id, span_id, punt) => {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE Punte_span_brug SET merkblad_id = ?, span_id = ?, punt = ? WHERE id = ?`;
        db.run(sql, [merkblad_id, span_id, punt, id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id, merkblad_id, span_id, punt, changes: this.changes });
            }
        });
    });
};

// UPDATE - Update punt by merkblad_id and span_id
const updatePuntByMerkbladAndSpan = (merkblad_id, span_id, punt) => {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE Punte_span_brug SET punt = ? WHERE merkblad_id = ? AND span_id = ?`;
        db.run(sql, [punt, merkblad_id, span_id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ merkblad_id, span_id, punt, changes: this.changes });
            }
        });
    });
};

// DELETE - Delete punt by ID
const deletePunt = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM Punte_span_brug WHERE id = ?`;
        db.run(sql, [id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id, changes: this.changes });
            }
        });
    });
};

// DELETE - Delete punt by merkblad_id and span_id
const deletePuntByMerkbladAndSpan = (merkblad_id, span_id) => {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM Punte_span_brug WHERE merkblad_id = ? AND span_id = ?`;
        db.run(sql, [merkblad_id, span_id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ merkblad_id, span_id, changes: this.changes });
            }
        });
    });
};

// DELETE - Delete all punte for a specific merkblad
const deletePunteByMerkblad = (merkblad_id) => {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM Punte_span_brug WHERE merkblad_id = ?`;
        db.run(sql, [merkblad_id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ merkblad_id, changes: this.changes });
            }
        });
    });
};

// DELETE - Delete all punte for a specific span
const deletePunteBySpan = (span_id) => {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM Punte_span_brug WHERE span_id = ?`;
        db.run(sql, [span_id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ span_id, changes: this.changes });
            }
        });
    });
};

// READ - Get all punte for all teams in a specific round
const getPunteByRondteId = (rondte_id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                psb.id,
                psb.merkblad_id,
                psb.span_id,
                psb.punt,
                s.naam as span_naam,
                m.kriteria_id,
                m.totaal,
                k.beskrywing as kriteria_beskrywing
            FROM Punte_span_brug psb
            INNER JOIN Merkblad m ON psb.merkblad_id = m.merkblad_id
            INNER JOIN Span s ON psb.span_id = s.span_id
            INNER JOIN Kriteria k ON m.kriteria_id = k.kriteria_id
            WHERE m.rondte_id = ?
            ORDER BY psb.span_id, m.kriteria_id
        `;
        db.all(sql, [rondte_id], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// READ - Get round status (is_oop)
const getRoundStatus = (rondte_id) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT rondte_id, is_oop FROM Rondte WHERE rondte_id = ?`;
        db.get(sql, [rondte_id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

// UPDATE - Close a round (set is_oop to 0)
const closeRound = (rondte_id) => {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE Rondte SET is_oop = 0 WHERE rondte_id = ?`;
        db.run(sql, [rondte_id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ rondte_id, changes: this.changes });
            }
        });
    });
};

// UPDATE - Open a round (set is_oop to 1)
const openRound = (rondte_id) => {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE Rondte SET is_oop = 1 WHERE rondte_id = ?`;
        db.run(sql, [rondte_id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ rondte_id, changes: this.changes });
            }
        });
    });
};



// Utility function to close database connection
const closeDb = () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
    });
};



module.exports = {
    createPunt,
    getAllPunte,
    getPuntById,
    getPunteByMerkbladId,
    getPunteBySpanId,
    getPuntByMerkbladAndSpan,
    getPunteByRondteId,
    updatePunt,
    updatePuntByMerkbladAndSpan,
    deletePunt,
    deletePuntByMerkbladAndSpan,
    deletePunteByMerkblad,
    deletePunteBySpan,
    getRoundStatus,
    closeRound,
    openRound,
    closeDb
};
