const express = require('express');
const router = express.Router();
const { getDb } = require('../db_calls/db_connection');

// GET /rounds - Get all rounds
router.get('/', (req, res) => {
    const db = getDb();
    
    db.all(`
        SELECT r.*, 
               COUNT(DISTINCT tp.span_id) as participating_teams,
               COUNT(DISTINCT ja.user_id) as assigned_judges
        FROM Rounds r
        LEFT JOIN TeamParticipation tp ON r.round_id = tp.round_id AND tp.is_participating = 1
        LEFT JOIN JudgeAllocations ja ON r.round_id = ja.round_id
        GROUP BY r.round_id
        ORDER BY r.created_at DESC
    `, (err, rows) => {
        db.close();
        if (err) {
            return res.status(500).json({ error: 'Kon nie rondtes laai nie' });
        }
        res.json(rows);
    });
});

// POST /rounds - Create new round
router.post('/', (req, res) => {
    const { round_name, max_teams = 15, max_judges_per_team = 3, max_teams_per_judge = 3 } = req.body;
    
    if (!round_name) {
        return res.status(400).json({ error: 'Rondte naam is verpligtend' });
    }
    
    const db = getDb();
    
    db.run(`
        INSERT INTO Rounds (round_name, max_teams, max_judges_per_team, max_teams_per_judge)
        VALUES (?, ?, ?, ?)
    `, [round_name, max_teams, max_judges_per_team, max_teams_per_judge], function(err) {
        db.close();
        if (err) {
            return res.status(500).json({ error: 'Kon nie rondte skep nie' });
        }
        
        res.json({ 
            round_id: this.lastID, 
            message: 'Rondte suksesvol geskep' 
        });
    });
});

// PUT /rounds/:id/status - Update round status
router.put('/:id/status', (req, res) => {
    const { status } = req.body;
    const roundId = parseInt(req.params.id);
    
    if (!['open', 'closed', 'archived'].includes(status)) {
        return res.status(400).json({ error: 'Ongeldige status' });
    }
    
    const db = getDb();
    const closedAt = status === 'closed' ? new Date().toISOString() : null;
    
    db.run(`
        UPDATE Rounds 
        SET status = ?, closed_at = ?
        WHERE round_id = ?
    `, [status, closedAt, roundId], function(err) {
        db.close();
        if (err) {
            return res.status(500).json({ error: 'Kon nie rondte status opdateer nie' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Rondte nie gevind nie' });
        }
        
        res.json({ message: `Rondte ${status} suksesvol` });
    });
});

// GET /rounds/:id/teams - Get teams for a round
router.get('/:id/teams', (req, res) => {
    const roundId = parseInt(req.params.id);
    const db = getDb();
    
    db.all(`
        SELECT s.span_id, s.naam, tp.is_participating
        FROM Span s
        LEFT JOIN TeamParticipation tp ON s.span_id = tp.span_id AND tp.round_id = ?
        ORDER BY s.naam
    `, [roundId], (err, rows) => {
        db.close();
        if (err) {
            return res.status(500).json({ error: 'Kon nie spanne laai nie' });
        }
        res.json(rows);
    });
});

// PUT /rounds/:id/teams - Update team participation
router.put('/:id/teams', (req, res) => {
    const roundId = parseInt(req.params.id);
    const { team_participation } = req.body; // Array of {span_id, is_participating}
    
    const db = getDb();
    
    db.serialize(() => {
        // Clear existing participation
        db.run('DELETE FROM TeamParticipation WHERE round_id = ?', [roundId]);
        
        // Insert new participation
        const stmt = db.prepare(`
            INSERT INTO TeamParticipation (round_id, span_id, is_participating)
            VALUES (?, ?, ?)
        `);
        
        team_participation.forEach(({ span_id, is_participating }) => {
            stmt.run([roundId, span_id, is_participating ? 1 : 0]);
        });
        
        stmt.finalize((err) => {
            db.close();
            if (err) {
                return res.status(500).json({ error: 'Kon nie span deelname opdateer nie' });
            }
            res.json({ message: 'Span deelname suksesvol opdateer' });
        });
    });
});

// GET /rounds/:id/criteria - Get criteria for a round
router.get('/:id/criteria', (req, res) => {
    const roundId = parseInt(req.params.id);
    const db = getDb();
    
    db.all(`
        SELECT k.kriteria_id, k.beskrywing, k.default_totaal, 
               rc.is_active, rc.weight
        FROM Kriteria k
        LEFT JOIN RoundCriteria rc ON k.kriteria_id = rc.kriteria_id AND rc.round_id = ?
        ORDER BY k.beskrywing
    `, [roundId], (err, rows) => {
        db.close();
        if (err) {
            return res.status(500).json({ error: 'Kon nie kriteria laai nie' });
        }
        res.json(rows);
    });
});

// PUT /rounds/:id/criteria - Update round criteria
router.put('/:id/criteria', (req, res) => {
    const roundId = parseInt(req.params.id);
    const { criteria_selection } = req.body; // Array of {kriteria_id, is_active, weight}
    
    const db = getDb();
    
    db.serialize(() => {
        // Clear existing criteria
        db.run('DELETE FROM RoundCriteria WHERE round_id = ?', [roundId]);
        
        // Insert new criteria
        const stmt = db.prepare(`
            INSERT INTO RoundCriteria (round_id, kriteria_id, is_active, weight)
            VALUES (?, ?, ?, ?)
        `);
        
        criteria_selection.forEach(({ kriteria_id, is_active, weight = 1.0 }) => {
            stmt.run([roundId, kriteria_id, is_active ? 1 : 0, weight]);
        });
        
        stmt.finalize((err) => {
            db.close();
            if (err) {
                return res.status(500).json({ error: 'Kon nie kriteria opdateer nie' });
            }
            res.json({ message: 'Kriteria suksesvol opdateer' });
        });
    });
});

// GET /rounds/:id/allocations - Get judge allocations for a round
router.get('/:id/allocations', (req, res) => {
    const roundId = parseInt(req.params.id);
    const db = getDb();
    
    db.all(`
        SELECT ja.allocation_id, ja.span_id, ja.user_id,
               s.naam as team_name, u.email as judge_email
        FROM JudgeAllocations ja
        JOIN Span s ON ja.span_id = s.span_id
        JOIN Users u ON ja.user_id = u.user_id
        WHERE ja.round_id = ?
        ORDER BY s.naam, u.email
    `, [roundId], (err, rows) => {
        db.close();
        if (err) {
            return res.status(500).json({ error: 'Kon nie toewysings laai nie' });
        }
        res.json(rows);
    });
});

// POST /rounds/:id/auto-allocate - Auto allocate judges to teams
router.post('/:id/auto-allocate', (req, res) => {
    const roundId = parseInt(req.params.id);
    const db = getDb();
    
    // Get round configuration
    db.get(`
        SELECT max_teams_per_judge, max_judges_per_team
        FROM Rounds WHERE round_id = ?
    `, [roundId], (err, round) => {
        if (err) {
            db.close();
            return res.status(500).json({ error: 'Kon nie rondte konfigurasie laai nie' });
        }
        
        if (!round) {
            db.close();
            return res.status(404).json({ error: 'Rondte nie gevind nie' });
        }
        
        // Get participating teams
        db.all(`
            SELECT s.span_id, s.naam
            FROM Span s
            JOIN TeamParticipation tp ON s.span_id = tp.span_id
            WHERE tp.round_id = ? AND tp.is_participating = 1
        `, [roundId], (err, teams) => {
            if (err) {
                db.close();
                return res.status(500).json({ error: 'Kon nie spanne laai nie' });
            }
            
            // Get available judges
            db.all(`
                SELECT user_id, email
                FROM Users 
                WHERE role = 'beoordelaar'
                ORDER BY user_id
            `, (err, judges) => {
                if (err) {
                    db.close();
                    return res.status(500).json({ error: 'Kon nie beoordelaars laai nie' });
                }
                
                // Clear existing allocations
                db.run('DELETE FROM JudgeAllocations WHERE round_id = ?', [roundId], (err) => {
                    if (err) {
                        db.close();
                        return res.status(500).json({ error: 'Kon nie bestaande toewysings skoonmaak nie' });
                    }
                    
                    // Auto-allocate using round-robin algorithm
                    const allocations = [];
                    const maxTeamsPerJudge = round.max_teams_per_judge;
                    const maxJudgesPerTeam = round.max_judges_per_team;
                    
                    // Round-robin allocation
                    let judgeIndex = 0;
                    const judgeTeamCounts = new Array(judges.length).fill(0);
                    const teamJudgeCounts = new Array(teams.length).fill(0);
                    
                    for (let teamIndex = 0; teamIndex < teams.length; teamIndex++) {
                        const team = teams[teamIndex];
                        let judgesAssigned = 0;
                        
                        while (judgesAssigned < maxJudgesPerTeam && judgesAssigned < judges.length) {
                            const judge = judges[judgeIndex];
                            
                            // Check if judge can be assigned to this team
                            if (judgeTeamCounts[judgeIndex] < maxTeamsPerJudge) {
                                allocations.push({
                                    round_id: roundId,
                                    span_id: team.span_id,
                                    user_id: judge.user_id
                                });
                                judgeTeamCounts[judgeIndex]++;
                                teamJudgeCounts[teamIndex]++;
                                judgesAssigned++;
                            }
                            
                            judgeIndex = (judgeIndex + 1) % judges.length;
                            
                            // Prevent infinite loop
                            if (judgesAssigned === 0 && judgeTeamCounts.every(count => count >= maxTeamsPerJudge)) {
                                break;
                            }
                        }
                    }
                    
                    // Insert allocations
                    const stmt = db.prepare(`
                        INSERT INTO JudgeAllocations (round_id, span_id, user_id)
                        VALUES (?, ?, ?)
                    `);
                    
                    allocations.forEach(allocation => {
                        stmt.run([allocation.round_id, allocation.span_id, allocation.user_id]);
                    });
                    
                    stmt.finalize((err) => {
                        db.close();
                        if (err) {
                            return res.status(500).json({ error: 'Kon nie toewysings stoor nie' });
                        }
                        
                        res.json({ 
                            message: 'Outomatiese toewysing suksesvol',
                            allocations_created: allocations.length,
                            teams_allocated: teams.length,
                            judges_used: judges.length
                        });
                    });
                });
            });
        });
    });
});

// GET /rounds/:id/summary - Get round summary with scores
router.get('/:id/summary', (req, res) => {
    const roundId = parseInt(req.params.id);
    const db = getDb();
    
    db.all(`
        SELECT s.span_id, s.naam,
               AVG(js.score) as average_score,
               COUNT(DISTINCT ja.user_id) as judge_count,
               COUNT(js.score_id) as scores_count
        FROM Span s
        JOIN TeamParticipation tp ON s.span_id = tp.span_id
        LEFT JOIN JudgeAllocations ja ON s.span_id = ja.span_id AND ja.round_id = ?
        LEFT JOIN JudgeScores js ON ja.allocation_id = js.allocation_id
        WHERE tp.round_id = ? AND tp.is_participating = 1
        GROUP BY s.span_id, s.naam
        ORDER BY average_score DESC
    `, [roundId, roundId], (err, rows) => {
        db.close();
        if (err) {
            return res.status(500).json({ error: 'Kon nie rondte opsomming laai nie' });
        }
        res.json(rows);
    });
});

module.exports = router;
