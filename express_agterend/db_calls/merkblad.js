const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
function getDatabasePath() {
    return path.resolve(__dirname, '..', 'melktert.db');
}

// CREATE - Insert a new merkblad record
function createMerkblad(rondte_id, kriteria_id, totaal) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(getDatabasePath());
        
        const sql = `
            INSERT INTO Merkblad (rondte_id, kriteria_id, totaal)
            VALUES (?, ?, ?)
        `;
        
        db.run(sql, [rondte_id, kriteria_id, totaal], function(err) {
            db.close();
            if (err) {
                reject(err);
            } else {
                resolve({ merkblad_id: this.lastID, rondte_id, kriteria_id, totaal });
            }
        });
    });
}

// READ - Get all merkblad records
function getAllMerkblads() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(getDatabasePath());
        
        const sql = `
            SELECT m.*, r.is_eerste, r.is_laaste, r.max_spanne, k.beskrywing as kriteria_beskrywing, k.default_totaal
            FROM Merkblad m
            JOIN Rondte r ON m.rondte_id = r.rondte_id
            JOIN Kriteria k ON m.kriteria_id = k.kriteria_id
            ORDER BY m.merkblad_id
        `;
        
        db.all(sql, [], (err, rows) => {
            db.close();
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// READ - Get a specific merkblad by ID
function getMerkbladById(merkblad_id) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(getDatabasePath());
        
        const sql = `
            SELECT m.*, r.is_eerste, r.is_laaste, r.max_spanne, k.beskrywing as kriteria_beskrywing, k.default_totaal
            FROM Merkblad m
            JOIN Rondte r ON m.rondte_id = r.rondte_id
            JOIN Kriteria k ON m.kriteria_id = k.kriteria_id
            WHERE m.merkblad_id = ?
        `;
        
        db.get(sql, [merkblad_id], (err, row) => {
            db.close();
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// READ - Get merkblads by rondte_id
function getMerkbladsByRondteId(rondte_id) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(getDatabasePath());
        
        const sql = `
            SELECT m.*, r.is_eerste, r.is_laaste, r.max_spanne, k.beskrywing as kriteria_beskrywing, k.default_totaal
            FROM Merkblad m
            JOIN Rondte r ON m.rondte_id = r.rondte_id
            JOIN Kriteria k ON m.kriteria_id = k.kriteria_id
            WHERE m.rondte_id = ?
            ORDER BY m.kriteria_id
        `;
        
        db.all(sql, [rondte_id], (err, rows) => {
            db.close();
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// READ - Get merkblads by kriteria_id
function getMerkbladsByKriteriaId(kriteria_id) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(getDatabasePath());
        
        const sql = `
            SELECT m.*, r.is_eerste, r.is_laaste, r.max_spanne, k.beskrywing as kriteria_beskrywing, k.default_totaal
            FROM Merkblad m
            JOIN Rondte r ON m.rondte_id = r.rondte_id
            JOIN Kriteria k ON m.kriteria_id = k.kriteria_id
            WHERE m.kriteria_id = ?
            ORDER BY m.rondte_id
        `;
        
        db.all(sql, [kriteria_id], (err, rows) => {
            db.close();
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// UPDATE - Update a merkblad record
function updateMerkblad(merkblad_id, rondte_id, kriteria_id, totaal) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(getDatabasePath());
        
        const sql = `
            UPDATE Merkblad 
            SET rondte_id = ?, kriteria_id = ?, totaal = ?
            WHERE merkblad_id = ?
        `;
        
        db.run(sql, [rondte_id, kriteria_id, totaal, merkblad_id], function(err) {
            db.close();
            if (err) {
                reject(err);
            } else {
                if (this.changes > 0) {
                    resolve({ merkblad_id, rondte_id, kriteria_id, totaal });
                } else {
                    reject(new Error('No merkblad found with the given ID'));
                }
            }
        });
    });
}

// UPDATE - Update only the totaal field
function updateMerkbladTotaal(merkblad_id, totaal) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(getDatabasePath());
        
        const sql = `
            UPDATE Merkblad 
            SET totaal = ?
            WHERE merkblad_id = ?
        `;
        
        db.run(sql, [totaal, merkblad_id], function(err) {
            db.close();
            if (err) {
                reject(err);
            } else {
                if (this.changes > 0) {
                    resolve({ merkblad_id, totaal });
                } else {
                    reject(new Error('No merkblad found with the given ID'));
                }
            }
        });
    });
}

// DELETE - Delete a merkblad record
function deleteMerkblad(merkblad_id) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(getDatabasePath());
        
        const sql = `DELETE FROM Merkblad WHERE merkblad_id = ?`;
        
        db.run(sql, [merkblad_id], function(err) {
            db.close();
            if (err) {
                reject(err);
            } else {
                if (this.changes > 0) {
                    resolve({ message: 'Merkblad deleted successfully', merkblad_id });
                } else {
                    reject(new Error('No merkblad found with the given ID'));
                }
            }
        });
    });
}

// DELETE - Delete all merkblads for a specific rondte
function deleteMerkbladsByRondteId(rondte_id) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(getDatabasePath());
        
        const sql = `DELETE FROM Merkblad WHERE rondte_id = ?`;
        
        db.run(sql, [rondte_id], function(err) {
            db.close();
            if (err) {
                reject(err);
            } else {
                resolve({ message: `${this.changes} merkblads deleted for rondte ${rondte_id}` });
            }
        });
    });
}

// DELETE - Delete all merkblads for a specific kriteria
function deleteMerkbladsByKriteriaId(kriteria_id) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(getDatabasePath());
        
        const sql = `DELETE FROM Merkblad WHERE kriteria_id = ?`;
        
        db.run(sql, [kriteria_id], function(err) {
            db.close();
            if (err) {
                reject(err);
            } else {
                resolve({ message: `${this.changes} merkblads deleted for kriteria ${kriteria_id}` });
            }
        });
    });
}

// UTILITY - Check if a merkblad exists for rondte_id and kriteria_id combination
function checkMerkbladExists(rondte_id, kriteria_id) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(getDatabasePath());
        
        const sql = `
            SELECT merkblad_id FROM Merkblad 
            WHERE rondte_id = ? AND kriteria_id = ?
        `;
        
        db.get(sql, [rondte_id, kriteria_id], (err, row) => {
            db.close();
            if (err) {
                reject(err);
            } else {
                resolve(!!row);
            }
        });
    });
}

// UTILITY - Get or create merkblad for rondte_id and kriteria_id combination
function getOrCreateMerkblad(rondte_id, kriteria_id, default_totaal = null) {
    return new Promise(async (resolve, reject) => {
        try {
            const db = new sqlite3.Database(getDatabasePath());
            
            // First check if it exists
            const checkSql = `
                SELECT m.*, k.default_totaal
                FROM Merkblad m
                JOIN Kriteria k ON m.kriteria_id = k.kriteria_id
                WHERE m.rondte_id = ? AND m.kriteria_id = ?
            `;
            
            db.get(checkSql, [rondte_id, kriteria_id], (err, row) => {
                if (err) {
                    db.close();
                    reject(err);
                    return;
                }
                
                if (row) {
                    db.close();
                    resolve(row);
                } else {
                    // Create new merkblad
                    const totaal = default_totaal !== null ? default_totaal : row?.default_totaal || 0;
                    const insertSql = `
                        INSERT INTO Merkblad (rondte_id, kriteria_id, totaal)
                        VALUES (?, ?, ?)
                    `;
                    
                    db.run(insertSql, [rondte_id, kriteria_id, totaal], function(err) {
                        db.close();
                        if (err) {
                            reject(err);
                        } else {
                            resolve({ 
                                merkblad_id: this.lastID, 
                                rondte_id, 
                                kriteria_id, 
                                totaal 
                            });
                        }
                    });
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    createMerkblad,
    getAllMerkblads,
    getMerkbladById,
    getMerkbladsByRondteId,
    getMerkbladsByKriteriaId,
    updateMerkblad,
    updateMerkbladTotaal,
    deleteMerkblad,
    deleteMerkbladsByRondteId,
    deleteMerkbladsByKriteriaId,
    checkMerkbladExists,
    getOrCreateMerkblad
};
