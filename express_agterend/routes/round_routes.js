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

// GET /rounds/active - Get active tournament
router.get('/active', (req, res) => {
    const db = getDb();
    
    db.get(`
        SELECT r.*, 
               ts.tournament_name,
               ts.status as tournament_status,
               ts.current_phase,
               ts.total_phases,
               ts.started_at,
               ts.completed_at,
               COUNT(DISTINCT tp.span_id) as participating_teams,
               COUNT(DISTINCT ja.user_id) as assigned_judges
        FROM Rounds r
        LEFT JOIN TournamentStatus ts ON r.round_id = ts.round_id
        LEFT JOIN TeamParticipation tp ON r.round_id = tp.round_id AND tp.is_participating = 1
        LEFT JOIN JudgeAllocations ja ON r.round_id = ja.round_id
        WHERE ts.status = 'active'
        GROUP BY r.round_id
        ORDER BY r.created_at DESC
        LIMIT 1
    `, (err, row) => {
        db.close();
        if (err) {
            return res.status(500).json({ error: 'Kon nie aktiewe toernooi laai nie' });
        }
        res.json(row || null);
    });
});

// POST /rounds - Create new round
router.post('/', (req, res) => {
    const { round_name, max_teams = 15, max_judges_per_team = 3, max_teams_per_judge = 3 } = req.body;
    
    if (!round_name) {
        return res.status(400).json({ error: 'Rondte naam is verpligtend' });
    }
    
    const db = getDb();
    
    // Check if there's already an active tournament
    db.get('SELECT round_id FROM Rounds WHERE status = ?', ['open'], (err, existingRound) => {
        if (err) {
            db.close();
            return res.status(500).json({ error: 'Kon nie bestaande rondtes kontroleer nie' });
        }
        
        if (existingRound) {
            db.close();
            return res.status(400).json({ 
                error: 'Daar is reeds \'n aktiewe toernooi. Sluit eers die bestaande toernooi voor jy \'n nuwe een skep.',
                existing_round_id: existingRound.round_id
            });
        }
        
        // Create new round
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
});

// POST /rounds/:id/tournament/start - Start tournament
router.post('/:id/tournament/start', (req, res) => {
    const roundId = parseInt(req.params.id);
    const { tournament_name, current_phase = 'Round 1', total_phases = 1 } = req.body;
    
    if (!tournament_name) {
        return res.status(400).json({ error: 'Toernooi naam is verpligtend' });
    }
    
    const db = getDb();
    
    // Check if there's already an active tournament
    db.get('SELECT tournament_id FROM TournamentStatus WHERE status = ?', ['active'], (err, existingTournament) => {
        if (err) {
            db.close();
            return res.status(500).json({ error: 'Kon nie bestaande toernooie kontroleer nie' });
        }
        
        if (existingTournament) {
            db.close();
            return res.status(400).json({ 
                error: 'Daar is reeds \'n aktiewe toernooi. Sluit eers die bestaande toernooi voor jy \'n nuwe een begin.',
                existing_tournament_id: existingTournament.tournament_id
            });
        }
        
        // Create tournament status
        db.run(`
            INSERT INTO TournamentStatus (round_id, tournament_name, status, current_phase, total_phases, started_at)
            VALUES (?, ?, 'active', ?, ?, ?)
        `, [roundId, tournament_name, current_phase, total_phases, new Date().toISOString()], function(err) {
            db.close();
            if (err) {
                return res.status(500).json({ error: 'Kon nie toernooi begin nie' });
            }
            
            res.json({ 
                message: 'Toernooi suksesvol begin',
                tournament_id: this.lastID,
                tournament_name,
                current_phase,
                total_phases
            });
        });
    });
});

// POST /rounds/:id/tournament/stop - Stop tournament
router.post('/:id/tournament/stop', (req, res) => {
    const roundId = parseInt(req.params.id);
    const db = getDb();
    
    db.run(`
        UPDATE TournamentStatus 
        SET status = 'inactive', completed_at = ?
        WHERE round_id = ?
    `, [new Date().toISOString(), roundId], function(err) {
        db.close();
        if (err) {
            return res.status(500).json({ error: 'Kon nie toernooi stop nie' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Toernooi nie gevind nie' });
        }
        
        res.json({ message: 'Toernooi suksesvol gestop' });
    });
});

// GET /rounds/:id/tournament/status - Get tournament status
router.get('/:id/tournament/status', (req, res) => {
    const roundId = parseInt(req.params.id);
    const db = getDb();
    
    db.get(`
        SELECT ts.*, r.round_name
        FROM TournamentStatus ts
        JOIN Rounds r ON ts.round_id = r.round_id
        WHERE ts.round_id = ?
    `, [roundId], (err, row) => {
        db.close();
        if (err) {
            return res.status(500).json({ error: 'Kon nie toernooi status laai nie' });
        }
        res.json(row || null);
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
    
    // If trying to open a round, check if there's already an active tournament
    if (status === 'open') {
        db.get('SELECT round_id FROM Rounds WHERE status = ? AND round_id != ?', ['open', roundId], (err, existingRound) => {
            if (err) {
                db.close();
                return res.status(500).json({ error: 'Kon nie bestaande rondtes kontroleer nie' });
            }
            
            if (existingRound) {
                db.close();
                return res.status(400).json({ 
                    error: 'Daar is reeds \'n aktiewe toernooi. Sluit eers die bestaande toernooi voor jy hierdie een oopmaak.',
                    existing_round_id: existingRound.round_id
                });
            }
            
            // Proceed with opening the round
            updateRoundStatus();
        });
    } else {
        // For closing/archiving, no need to check for existing active rounds
        updateRoundStatus();
    }
    
    function updateRoundStatus() {
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
    }
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
    
    // Validate input
    if (!team_participation || !Array.isArray(team_participation)) {
        return res.status(400).json({ error: 'team_participation moet \'n array wees' });
    }
    
    if (team_participation.length === 0) {
        return res.status(400).json({ error: 'team_participation kan nie leeg wees nie' });
    }
    
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

// GET /rounds/:id/validate-allocation - Validate if auto-allocation is possible
router.get('/:id/validate-allocation', (req, res) => {
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
            SELECT COUNT(*) as team_count
            FROM TeamParticipation tp
            WHERE tp.round_id = ? AND tp.is_participating = 1
        `, [roundId], (err, teamResult) => {
            if (err) {
                db.close();
                return res.status(500).json({ error: 'Kon nie spanne tel nie' });
            }
            
            // Get available judges
            db.all(`
                SELECT COUNT(*) as judge_count
                FROM Users 
                WHERE role = 'beoordelaar'
            `, (err, judgeResult) => {
                db.close();
                if (err) {
                    return res.status(500).json({ error: 'Kon nie beoordelaars tel nie' });
                }
                
                const teamCount = teamResult[0].team_count;
                const judgeCount = judgeResult[0].judge_count;
                const maxTeamsPerJudge = round.max_teams_per_judge;
                const maxJudgesPerTeam = round.max_judges_per_team;
                
                // Calculate requirements
                const requiredJudges = Math.ceil(teamCount * maxJudgesPerTeam / maxTeamsPerJudge);
                const isPossible = judgeCount >= requiredJudges;
                
                res.json({
                    is_possible: isPossible,
                    team_count: teamCount,
                    judge_count: judgeCount,
                    required_judges: requiredJudges,
                    max_teams_per_judge: maxTeamsPerJudge,
                    max_judges_per_team: maxJudgesPerTeam,
                    message: isPossible ? 
                        `Allocation is possible with ${judgeCount} judges for ${teamCount} teams` :
                        `Nie genoeg beoordelaars nie. Vereis: ${requiredJudges}, Beskikbaar: ${judgeCount}`
                });
            });
        });
    });
});

// GET /rounds/:id/my-allocations - Get current user's allocations for a round
router.get('/:id/my-allocations', (req, res) => {
    const roundId = parseInt(req.params.id);
    const userId = req.user.user_id; // From authentication middleware
    const db = getDb();
    
    db.all(`
        SELECT ja.allocation_id, ja.round_id, ja.span_id, ja.user_id,
               s.naam as team_name, s.projek_beskrywing, s.span_bio,
               u.email as judge_email
        FROM JudgeAllocations ja
        JOIN Span s ON ja.span_id = s.span_id
        JOIN Users u ON ja.user_id = u.user_id
        WHERE ja.round_id = ? AND ja.user_id = ?
        ORDER BY s.naam
    `, [roundId, userId], (err, rows) => {
        db.close();
        if (err) {
            return res.status(500).json({ error: 'Kon nie jou toewysings laai nie' });
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
                    
                    // Enhanced auto-allocation algorithm
                    const allocations = [];
                    const maxTeamsPerJudge = round.max_teams_per_judge;
                    const maxJudgesPerTeam = round.max_judges_per_team;
                    
                    // Check if we have enough judges
                    const requiredJudges = Math.ceil(teams.length * maxJudgesPerTeam / maxTeamsPerJudge);
                    if (judges.length < requiredJudges) {
                        db.close();
                        return res.status(400).json({ 
                            error: `Nie genoeg beoordelaars nie. Vereis: ${requiredJudges}, Beskikbaar: ${judges.length}`,
                            required: requiredJudges,
                            available: judges.length
                        });
                    }
                    
                    // Create a balanced distribution matrix
                    const judgeTeamCounts = new Array(judges.length).fill(0);
                    const teamJudgeCounts = new Array(teams.length).fill(0);
                    const usedJudgeTeamPairs = new Set(); // Track judge-team pairs to prevent duplicates
                    
                    // Shuffle judges to ensure random distribution
                    const shuffledJudges = [...judges].sort(() => Math.random() - 0.5);
                    
                    // Assign judges to teams with conflict prevention
                    for (let teamIndex = 0; teamIndex < teams.length; teamIndex++) {
                        const team = teams[teamIndex];
                        let judgesAssigned = 0;
                        const availableJudges = [];
                        
                        // Find available judges for this team
                        for (let judgeIndex = 0; judgeIndex < shuffledJudges.length; judgeIndex++) {
                            const judge = shuffledJudges[judgeIndex];
                            const pairKey = `${judge.user_id}-${team.span_id}`;
                            
                            // Check if judge can be assigned (not at max teams and not already assigned to this team)
                            if (judgeTeamCounts[judgeIndex] < maxTeamsPerJudge && 
                                !usedJudgeTeamPairs.has(pairKey)) {
                                availableJudges.push({ judge, judgeIndex });
                            }
                        }
                        
                        // Assign judges to this team
                        for (let i = 0; i < Math.min(maxJudgesPerTeam, availableJudges.length); i++) {
                            const { judge, judgeIndex } = availableJudges[i];
                            const pairKey = `${judge.user_id}-${team.span_id}`;
                            
                            allocations.push({
                                round_id: roundId,
                                span_id: team.span_id,
                                user_id: judge.user_id
                            });
                            
                            judgeTeamCounts[judgeIndex]++;
                            teamJudgeCounts[teamIndex]++;
                            judgesAssigned++;
                            usedJudgeTeamPairs.add(pairKey);
                        }
                        
                        // Check if team has minimum required judges
                        if (judgesAssigned < Math.min(2, maxJudgesPerTeam)) {
                            db.close();
                            return res.status(400).json({ 
                                error: `Kan nie genoeg beoordelaars toewys aan span "${team.naam}" nie. Vereis minimum 2 beoordelaars per span.`,
                                team: team.naam,
                                assigned: judgesAssigned,
                                required: Math.min(2, maxJudgesPerTeam)
                            });
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
                        
                        // Validate allocation results
                        const allocationSummary = {
                            total_allocations: allocations.length,
                            teams_allocated: teams.length,
                            judges_used: new Set(allocations.map(a => a.user_id)).size,
                            average_judges_per_team: (allocations.length / teams.length).toFixed(2),
                            allocation_distribution: judgeTeamCounts.map((count, index) => ({
                                judge_email: shuffledJudges[index].email,
                                teams_assigned: count
                            }))
                        };
                        
                        res.json({ 
                            message: 'Outomatiese toewysing suksesvol',
                            allocations_created: allocations.length,
                            teams_allocated: teams.length,
                            judges_used: allocationSummary.judges_used,
                            summary: allocationSummary
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

// DELETE /rounds/:id - Delete a round
router.delete('/:id', (req, res) => {
    const roundId = parseInt(req.params.id);
    const db = getDb();
    
    if (isNaN(roundId)) {
        return res.status(400).json({ error: 'Ongeldige rondte ID' });
    }
    
    // Start a transaction to delete all related data
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Delete judge scores first (foreign key constraint)
        db.run('DELETE FROM JudgeScores WHERE allocation_id IN (SELECT allocation_id FROM JudgeAllocations WHERE round_id = ?)', [roundId], (err) => {
            if (err) {
                db.run('ROLLBACK');
                db.close();
                return res.status(500).json({ error: 'Kon nie beoordelaar punte skrap nie' });
            }
            
            // Delete judge allocations
            db.run('DELETE FROM JudgeAllocations WHERE round_id = ?', [roundId], (err) => {
                if (err) {
                    db.run('ROLLBACK');
                    db.close();
                    return res.status(500).json({ error: 'Kon nie beoordelaar toewysings skrap nie' });
                }
                
                // Delete round criteria
                db.run('DELETE FROM RoundCriteria WHERE round_id = ?', [roundId], (err) => {
                    if (err) {
                        db.run('ROLLBACK');
                        db.close();
                        return res.status(500).json({ error: 'Kon nie rondte kriteria skrap nie' });
                    }
                    
                    // Delete team participation
                    db.run('DELETE FROM TeamParticipation WHERE round_id = ?', [roundId], (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            db.close();
                            return res.status(500).json({ error: 'Kon nie span deelname skrap nie' });
                        }
                        
                        // Finally delete the round
                        db.run('DELETE FROM Rounds WHERE round_id = ?', [roundId], function(err) {
                            if (err) {
                                db.run('ROLLBACK');
                                db.close();
                                return res.status(500).json({ error: 'Kon nie rondte skrap nie' });
                            }
                            
                            if (this.changes === 0) {
                                db.run('ROLLBACK');
                                db.close();
                                return res.status(404).json({ error: 'Rondte nie gevind nie' });
                            }
                            
                            // Commit the transaction
                            db.run('COMMIT', (err) => {
                                db.close();
                                if (err) {
                                    return res.status(500).json({ error: 'Kon nie transaksie voltooi nie' });
                                }
                                
                                res.json({ 
                                    message: 'Rondte en alle verwante data suksesvol geskrap',
                                    round_id: roundId,
                                    changes: this.changes
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// GET /rounds/:id/tournament-bracket - Get tournament bracket for a round
router.get('/:id/tournament-bracket', (req, res) => {
    const roundId = parseInt(req.params.id);
    const db = getDb();
    
    db.all(`
        SELECT tb.*, 
               s1.naam as team1_name, s1.projek_beskrywing as team1_description,
               s2.naam as team2_name, s2.projek_beskrywing as team2_description,
               sw.naam as winner_name
        FROM TournamentBrackets tb
        LEFT JOIN Span s1 ON tb.team1_id = s1.span_id
        LEFT JOIN Span s2 ON tb.team2_id = s2.span_id
        LEFT JOIN Span sw ON tb.winner_id = sw.span_id
        WHERE tb.round_id = ?
        ORDER BY tb.phase_name, tb.match_order
    `, [roundId], (err, rows) => {
        db.close();
        if (err) {
            return res.status(500).json({ error: 'Kon nie toernooi bracket laai nie' });
        }
        
        // Group by phase
        const bracket = {};
        rows.forEach(match => {
            if (!bracket[match.phase_name]) {
                bracket[match.phase_name] = [];
            }
            bracket[match.phase_name].push(match);
        });
        
        res.json(bracket);
    });
});

// POST /rounds/:id/tournament-bracket - Save tournament bracket
router.post('/:id/tournament-bracket', (req, res) => {
    const roundId = parseInt(req.params.id);
    const { bracket } = req.body;
    const db = getDb();
    
    // Validate input
    if (!bracket || typeof bracket !== 'object') {
        return res.status(400).json({ error: 'Bracket data is required' });
    }
    
    // Clear existing bracket
    db.run('DELETE FROM TournamentBrackets WHERE round_id = ?', [roundId], (err) => {
        if (err) {
            db.close();
            return res.status(500).json({ error: 'Kon nie bestaande bracket skoonmaak nie' });
        }
        
        // Insert new bracket
        const stmt = db.prepare(`
            INSERT INTO TournamentBrackets 
            (round_id, phase_name, match_id, team1_id, team2_id, winner_id, match_order, is_completed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        let matchId = 1;
        try {
            Object.entries(bracket).forEach(([phaseName, matches]) => {
                if (!Array.isArray(matches)) {
                    console.warn(`Phase ${phaseName} does not have an array of matches`);
                    return;
                }
                matches.forEach((match, index) => {
                    if (match && typeof match === 'object') {
                        stmt.run([
                            roundId,
                            phaseName,
                            matchId++,
                            match.team1?.span_id || null,
                            match.team2?.span_id || null,
                            match.winner?.span_id || null,
                            index + 1,
                            match.is_completed ? 1 : 0
                        ]);
                    }
                });
            });
        } catch (error) {
            console.error('Error processing bracket:', error);
            db.close();
            return res.status(500).json({ error: 'Kon nie bracket data verwerk nie' });
        }
        
        stmt.finalize((err) => {
            db.close();
            if (err) {
                return res.status(500).json({ error: 'Kon nie bracket stoor nie' });
            }
            res.json({ message: 'Toernooi bracket suksesvol gestoor' });
        });
    });
});

// GET /rounds/:id/tournament-matches/:phase/:matchId - Get match details
router.get('/:id/tournament-matches/:phase/:matchId', (req, res) => {
    const roundId = parseInt(req.params.id);
    const phase = req.params.phase;
    const matchId = parseInt(req.params.matchId);
    const db = getDb();
    
    // Get match details
    db.get(`
        SELECT tb.*, 
               s1.naam as team1_name, s1.projek_beskrywing as team1_description,
               s2.naam as team2_name, s2.projek_beskrywing as team2_description,
               sw.naam as winner_name
        FROM TournamentBrackets tb
        LEFT JOIN Span s1 ON tb.team1_id = s1.span_id
        LEFT JOIN Span s2 ON tb.team2_id = s2.span_id
        LEFT JOIN Span sw ON tb.winner_id = sw.span_id
        WHERE tb.round_id = ? AND tb.phase_name = ? AND tb.match_id = ?
    `, [roundId, phase, matchId], (err, match) => {
        if (err) {
            db.close();
            return res.status(500).json({ error: 'Kon nie wedstryd besonderhede laai nie' });
        }
        
        if (!match) {
            db.close();
            return res.status(404).json({ error: 'Wedstryd nie gevind nie' });
        }
        
        // Get match judges
        db.all(`
            SELECT tmj.*, u.email as judge_email
            FROM TournamentMatchJudges tmj
            JOIN Users u ON tmj.user_id = u.user_id
            WHERE tmj.round_id = ? AND tmj.phase_name = ? AND tmj.match_id = ?
        `, [roundId, phase, matchId], (err, judges) => {
            if (err) {
                db.close();
                return res.status(500).json({ error: 'Kon nie beoordelaars laai nie' });
            }
            
            // Get match criteria
            db.all(`
                SELECT tmc.*, k.beskrywing as criteria_name
                FROM TournamentMatchCriteria tmc
                JOIN Kriteria k ON tmc.kriteria_id = k.kriteria_id
                WHERE tmc.round_id = ? AND tmc.phase_name = ? AND tmc.match_id = ?
            `, [roundId, phase, matchId], (err, criteria) => {
                db.close();
                if (err) {
                    return res.status(500).json({ error: 'Kon nie kriteria laai nie' });
                }
                
                res.json({
                    match,
                    judges,
                    criteria
                });
            });
        });
    });
});

// POST /rounds/:id/tournament-matches/:phase/:matchId/judges - Assign judges to match
router.post('/:id/tournament-matches/:phase/:matchId/judges', (req, res) => {
    const roundId = parseInt(req.params.id);
    const phase = req.params.phase;
    const matchId = parseInt(req.params.matchId);
    const { judgeIds } = req.body;
    const db = getDb();
    
    // Clear existing judges for this match
    db.run(`
        DELETE FROM TournamentMatchJudges 
        WHERE round_id = ? AND phase_name = ? AND match_id = ?
    `, [roundId, phase, matchId], (err) => {
        if (err) {
            db.close();
            return res.status(500).json({ error: 'Kon nie bestaande beoordelaars skoonmaak nie' });
        }
        
        // Insert new judges
        const stmt = db.prepare(`
            INSERT INTO TournamentMatchJudges (round_id, phase_name, match_id, user_id)
            VALUES (?, ?, ?, ?)
        `);
        
        judgeIds.forEach(judgeId => {
            stmt.run([roundId, phase, matchId, judgeId]);
        });
        
        stmt.finalize((err) => {
            db.close();
            if (err) {
                return res.status(500).json({ error: 'Kon nie beoordelaars toewys nie' });
            }
            res.json({ message: 'Beoordelaars suksesvol toegewys' });
        });
    });
});

// POST /rounds/:id/tournament-matches/:phase/:matchId/criteria - Assign criteria to match
router.post('/:id/tournament-matches/:phase/:matchId/criteria', (req, res) => {
    const roundId = parseInt(req.params.id);
    const phase = req.params.phase;
    const matchId = parseInt(req.params.matchId);
    const { criteriaIds } = req.body;
    const db = getDb();
    
    // Clear existing criteria for this match
    db.run(`
        DELETE FROM TournamentMatchCriteria 
        WHERE round_id = ? AND phase_name = ? AND match_id = ?
    `, [roundId, phase, matchId], (err) => {
        if (err) {
            db.close();
            return res.status(500).json({ error: 'Kon nie bestaande kriteria skoonmaak nie' });
        }
        
        // Insert new criteria
        const stmt = db.prepare(`
            INSERT INTO TournamentMatchCriteria (round_id, phase_name, match_id, kriteria_id)
            VALUES (?, ?, ?, ?)
        `);
        
        criteriaIds.forEach(criteriaId => {
            stmt.run([roundId, phase, matchId, criteriaId]);
        });
        
        stmt.finalize((err) => {
            db.close();
            if (err) {
                return res.status(500).json({ error: 'Kon nie kriteria toewys nie' });
            }
            res.json({ message: 'Kriteria suksesvol toegewys' });
        });
    });
});

// GET /rounds/:id/tournament-matches/my-assignments - Get current user's tournament assignments
router.get('/:id/tournament-matches/my-assignments', (req, res) => {
    const roundId = parseInt(req.params.id);
    const userId = req.user.user_id;
    const db = getDb();
    
    db.all(`
        SELECT tmj.*, tb.team1_id, tb.team2_id, tb.is_completed,
               s1.naam as team1_name, s2.naam as team2_name,
               u.email as judge_email
        FROM TournamentMatchJudges tmj
        JOIN TournamentBrackets tb ON tmj.round_id = tb.round_id 
            AND tmj.phase_name = tb.phase_name 
            AND tmj.match_id = tb.match_id
        LEFT JOIN Span s1 ON tb.team1_id = s1.span_id
        LEFT JOIN Span s2 ON tb.team2_id = s2.span_id
        JOIN Users u ON tmj.user_id = u.user_id
        WHERE tmj.round_id = ? AND tmj.user_id = ?
        ORDER BY tb.phase_name, tb.match_order
    `, [roundId, userId], (err, rows) => {
        db.close();
        if (err) {
            return res.status(500).json({ error: 'Kon nie jou toernooi toewysings laai nie' });
        }
        res.json(rows);
    });
});

module.exports = router;
