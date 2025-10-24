const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { getDatabasePath } = require('../db_setup/setup');

// Helper function to get database connection
function getDb() {
    return new sqlite3.Database(getDatabasePath());
}

// Register new user
router.post('/register', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email en wagwoord is verpligtend' });
    }

    // Determine role based on email domain
    let role = 'beoordelaar';
    if (email.endsWith('@admin.co.za')) {
        role = 'admin';
    } else if (email.endsWith('@beoordelaar.co.za')) {
        role = 'beoordelaar';
    }

    const db = getDb();
    
    // Check if user already exists
    db.get('SELECT * FROM Users WHERE email = ?', [email], (err, row) => {
        if (err) {
            db.close();
            return res.status(500).json({ error: 'Database fout' });
        }
        
        if (row) {
            db.close();
            return res.status(400).json({ error: 'Gebruiker bestaan reeds' });
        }

        // Insert new user
        db.run('INSERT INTO Users (email, password, role) VALUES (?, ?, ?)', 
            [email, password, role], function(err) {
                db.close();
                if (err) {
                    return res.status(500).json({ error: 'Kon nie gebruiker skep nie' });
                }
                
                res.status(201).json({ 
                    message: 'Gebruiker suksesvol geregistreer',
                    user: { id: this.lastID, email, role }
                });
            });
    });
});

// Login user
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email en wagwoord is verpligtend' });
    }

    const db = getDb();
    
    db.get('SELECT * FROM Users WHERE email = ? AND password = ?', [email, password], (err, row) => {
        db.close();
        
        if (err) {
            return res.status(500).json({ error: 'Database fout' });
        }
        
        if (!row) {
            return res.status(401).json({ error: 'Ongeldige inloggegevens' });
        }
        
        // Return user info (without password)
        res.json({
            message: 'Suksesvol ingeteken',
            user: {
                id: row.user_id,
                email: row.email,
                role: row.role
            }
        });
    });
});

// Get current user info
router.get('/me', (req, res) => {
    const { user } = req;
    
    if (!user) {
        return res.status(401).json({ error: 'Nie ingeteken nie' });
    }
    
    res.json({ user });
});

// Get all beoordelaars
router.get('/beoordelaars', (req, res) => {
    const db = getDb();
    
    db.all('SELECT user_id, email, role FROM Users WHERE role = ?', ['beoordelaar'], (err, rows) => {
        db.close();
        if (err) {
            return res.status(500).json({ error: 'Kon nie beoordelaars laai nie' });
        }
        
        res.json(rows);
    });
});

module.exports = router;
