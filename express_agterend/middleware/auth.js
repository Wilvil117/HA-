const sqlite3 = require('sqlite3').verbose();
const { getDatabasePath } = require('../db_setup/setup');

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Toegang geweier - geen token nie' });
    }

    // For now, we'll use a simple approach where the token is the user ID
    // In a real app, you'd use JWT tokens
    const userId = parseInt(token);
    
    if (isNaN(userId)) {
        return res.status(401).json({ error: 'Ongeldige token' });
    }

    const db = new sqlite3.Database(getDatabasePath());
    
    db.get('SELECT user_id, email, role FROM Users WHERE user_id = ?', [userId], (err, row) => {
        db.close();
        
        if (err) {
            return res.status(500).json({ error: 'Database fout' });
        }
        
        if (!row) {
            return res.status(401).json({ error: 'Ongeldige token' });
        }
        
        req.user = row;
        next();
    });
}

// Role-based authorization middleware
function requireRole(role) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Nie ingeteken nie' });
        }
        
        if (req.user.role !== role) {
            return res.status(403).json({ error: 'Onvoldoende bevoegdhede' });
        }
        
        next();
    };
}

// Admin only middleware
function requireAdmin(req, res, next) {
    return requireRole('admin')(req, res, next);
}

// Beoordelaar only middleware
function requireBeoordelaar(req, res, next) {
    return requireRole('beoordelaar')(req, res, next);
}

module.exports = {
    authenticateToken,
    requireRole,
    requireAdmin,
    requireBeoordelaar
};
