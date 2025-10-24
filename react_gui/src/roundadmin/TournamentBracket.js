import React, { useState, useEffect } from 'react';
import { getRoundTeams, getRoundAllocations } from '../services/round_services';

const TournamentBracket = ({ round, onClose }) => {
  const [teams, setTeams] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [bracket, setBracket] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (round) {
      loadTournamentData();
    }
  }, [round]);

  const loadTournamentData = async () => {
    try {
      setLoading(true);
      const [teamsData, allocationsData] = await Promise.all([
        getRoundTeams(round.round_id),
        getRoundAllocations(round.round_id)
      ]);
      
      setTeams(teamsData.filter(team => team.is_participating === 1));
      setAllocations(allocationsData);
      
      // Create tournament bracket
      createTournamentBracket(teamsData.filter(team => team.is_participating === 1));
    } catch (err) {
      setMessage('Fout met laai van toernooi data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTournamentBracket = (participatingTeams) => {
    const teamCount = participatingTeams.length;
    let rounds = [];
    
    if (teamCount <= 2) {
      // Final match
      rounds = [{
        name: 'Finale',
        matches: [{
          id: 1,
          team1: participatingTeams[0],
          team2: participatingTeams[1] || null,
          winner: null,
          score1: 0,
          score2: 0
        }]
      }];
    } else if (teamCount <= 4) {
      // Semi-finals + Final
      const shuffled = [...participatingTeams].sort(() => Math.random() - 0.5);
      rounds = [
        {
          name: 'Halfeindstryd',
          matches: [
            { id: 1, team1: shuffled[0], team2: shuffled[1], winner: null, score1: 0, score2: 0 },
            { id: 2, team1: shuffled[2], team2: shuffled[3] || null, winner: null, score1: 0, score2: 0 }
          ]
        },
        {
          name: 'Finale',
          matches: [
            { id: 3, team1: null, team2: null, winner: null, score1: 0, score2: 0 }
          ]
        }
      ];
    } else if (teamCount <= 8) {
      // Quarter-finals + Semi-finals + Final
      const shuffled = [...participatingTeams].sort(() => Math.random() - 0.5);
      rounds = [
        {
          name: 'Kwarteindstryd',
          matches: [
            { id: 1, team1: shuffled[0], team2: shuffled[1], winner: null, score1: 0, score2: 0 },
            { id: 2, team1: shuffled[2], team2: shuffled[3], winner: null, score1: 0, score2: 0 },
            { id: 3, team1: shuffled[4], team2: shuffled[5], winner: null, score1: 0, score2: 0 },
            { id: 4, team1: shuffled[6], team2: shuffled[7] || null, winner: null, score1: 0, score2: 0 }
          ]
        },
        {
          name: 'Halfeindstryd',
          matches: [
            { id: 5, team1: null, team2: null, winner: null, score1: 0, score2: 0 },
            { id: 6, team1: null, team2: null, winner: null, score1: 0, score2: 0 }
          ]
        },
        {
          name: 'Finale',
          matches: [
            { id: 7, team1: null, team2: null, winner: null, score1: 0, score2: 0 }
          ]
        }
      ];
    } else if (teamCount <= 16) {
      // Round of 16 + Quarter-finals + Semi-finals + Final
      const shuffled = [...participatingTeams].sort(() => Math.random() - 0.5);
      rounds = [
        {
          name: 'Laaste 16',
          matches: Array.from({ length: 8 }, (_, i) => ({
            id: i + 1,
            team1: shuffled[i * 2] || null,
            team2: shuffled[i * 2 + 1] || null,
            winner: null,
            score1: 0,
            score2: 0
          }))
        },
        {
          name: 'Kwarteindstryd',
          matches: [
            { id: 9, team1: null, team2: null, winner: null, score1: 0, score2: 0 },
            { id: 10, team1: null, team2: null, winner: null, score1: 0, score2: 0 },
            { id: 11, team1: null, team2: null, winner: null, score1: 0, score2: 0 },
            { id: 12, team1: null, team2: null, winner: null, score1: 0, score2: 0 }
          ]
        },
        {
          name: 'Halfeindstryd',
          matches: [
            { id: 13, team1: null, team2: null, winner: null, score1: 0, score2: 0 },
            { id: 14, team1: null, team2: null, winner: null, score1: 0, score2: 0 }
          ]
        },
        {
          name: 'Finale',
          matches: [
            { id: 15, team1: null, team2: null, winner: null, score1: 0, score2: 0 }
          ]
        }
      ];
    } else if (teamCount <= 32) {
      // Round of 32 + Round of 16 + Quarter-finals + Semi-finals + Final
      const shuffled = [...participatingTeams].sort(() => Math.random() - 0.5);
      rounds = [
        {
          name: 'Laaste 32',
          matches: Array.from({ length: 16 }, (_, i) => ({
            id: i + 1,
            team1: shuffled[i * 2] || null,
            team2: shuffled[i * 2 + 1] || null,
            winner: null,
            score1: 0,
            score2: 0
          }))
        },
        {
          name: 'Laaste 16',
          matches: Array.from({ length: 8 }, (_, i) => ({
            id: i + 17,
            team1: null,
            team2: null,
            winner: null,
            score1: 0,
            score2: 0
          }))
        },
        {
          name: 'Kwarteindstryd',
          matches: [
            { id: 25, team1: null, team2: null, winner: null, score1: 0, score2: 0 },
            { id: 26, team1: null, team2: null, winner: null, score1: 0, score2: 0 },
            { id: 27, team1: null, team2: null, winner: null, score1: 0, score2: 0 },
            { id: 28, team1: null, team2: null, winner: null, score1: 0, score2: 0 }
          ]
        },
        {
          name: 'Halfeindstryd',
          matches: [
            { id: 29, team1: null, team2: null, winner: null, score1: 0, score2: 0 },
            { id: 30, team1: null, team2: null, winner: null, score1: 0, score2: 0 }
          ]
        },
        {
          name: 'Finale',
          matches: [
            { id: 31, team1: null, team2: null, winner: null, score1: 0, score2: 0 }
          ]
        }
      ];
    } else {
      // Large tournament with group stage + knockout
      const shuffled = [...participatingTeams].sort(() => Math.random() - 0.5);
      const groupCount = Math.ceil(teamCount / 8); // 6-8 teams per group
      const teamsPerGroup = Math.ceil(teamCount / groupCount);
      const groups = [];
      
      for (let i = 0; i < shuffled.length; i += teamsPerGroup) {
        groups.push(shuffled.slice(i, i + teamsPerGroup));
      }
      
      // Group stage matches (round-robin within each group)
      const groupMatches = [];
      groups.forEach((group, groupIndex) => {
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            groupMatches.push({
              id: groupIndex * 1000 + i * 10 + j,
              team1: group[i],
              team2: group[j],
              winner: null,
              score1: 0,
              score2: 0,
              group: groupIndex + 1
            });
          }
        }
      });
      
      rounds = [
        {
          name: `Groepfase (${groupCount} groepe)`,
          matches: groupMatches
        },
        {
          name: 'Laaste 32',
          matches: Array.from({ length: 16 }, (_, i) => ({
            id: i + 2000,
            team1: null,
            team2: null,
            winner: null,
            score1: 0,
            score2: 0
          }))
        },
        {
          name: 'Laaste 16',
          matches: Array.from({ length: 8 }, (_, i) => ({
            id: i + 2016,
            team1: null,
            team2: null,
            winner: null,
            score1: 0,
            score2: 0
          }))
        },
        {
          name: 'Kwarteindstryd',
          matches: [
            { id: 2025, team1: null, team2: null, winner: null, score1: 0, score2: 0 },
            { id: 2026, team1: null, team2: null, winner: null, score1: 0, score2: 0 },
            { id: 2027, team1: null, team2: null, winner: null, score1: 0, score2: 0 },
            { id: 2028, team1: null, team2: null, winner: null, score1: 0, score2: 0 }
          ]
        },
        {
          name: 'Halfeindstryd',
          matches: [
            { id: 2029, team1: null, team2: null, winner: null, score1: 0, score2: 0 },
            { id: 2030, team1: null, team2: null, winner: null, score1: 0, score2: 0 }
          ]
        },
        {
          name: 'Finale',
          matches: [
            { id: 2031, team1: null, team2: null, winner: null, score1: 0, score2: 0 }
          ]
        }
      ];
    }
    
    setBracket(rounds);
  };

  const handleScoreUpdate = (roundIndex, matchIndex, team, score) => {
    const newBracket = [...bracket];
    const match = newBracket[roundIndex].matches[matchIndex];
    
    if (team === 1) {
      match.score1 = parseInt(score) || 0;
    } else {
      match.score2 = parseInt(score) || 0;
    }
    
    // Determine winner
    if (match.score1 > match.score2) {
      match.winner = match.team1;
    } else if (match.score2 > match.score1) {
      match.winner = match.team2;
    } else {
      match.winner = null;
    }
    
    // Auto-advance teams without opponents
    if (roundIndex < newBracket.length - 1) {
      const nextRound = newBracket[roundIndex + 1];
      const nextMatchIndex = Math.floor(matchIndex / 2);
      
      if (nextMatchIndex < nextRound.matches.length) {
        const nextMatch = nextRound.matches[nextMatchIndex];
        
        // If this is the first match of a pair, set team1 in next round
        if (matchIndex % 2 === 0) {
          nextMatch.team1 = match.winner;
        } else {
          // If this is the second match of a pair, set team2 in next round
          nextMatch.team2 = match.winner;
        }
      }
    }
    
    setBracket(newBracket);
  };

  const getRequiredJudges = (roundIndex) => {
    const round = bracket[roundIndex];
    if (!round) return 0;
    
    // Progressive judge assignment: more judges for later rounds
    const baseJudges = 2;
    const progressiveJudges = Math.min(roundIndex + 1, 5); // Max 5 judges for finals
    return Math.max(baseJudges, progressiveJudges);
  };

  const getMatchCriteria = (roundIndex, matchIndex) => {
    // Different criteria for different tournament stages
    const round = bracket[roundIndex];
    if (!round) return [];
    
    const baseCriteria = ['Backend Development', 'Frontend Development', 'Database Design'];
    
    if (round.name.includes('Groepfase')) {
      return [...baseCriteria, 'Team Collaboration', 'Project Management'];
    } else if (round.name.includes('Laaste 32') || round.name.includes('Laaste 16')) {
      return [...baseCriteria, 'Code Quality', 'Performance', 'Security'];
    } else if (round.name.includes('Kwarteindstryd')) {
      return [...baseCriteria, 'Innovation', 'User Experience', 'Scalability'];
    } else if (round.name.includes('Halfeindstryd')) {
      return [...baseCriteria, 'Technical Excellence', 'Business Value', 'Presentation'];
    } else if (round.name.includes('Finale')) {
      return [...baseCriteria, 'Overall Excellence', 'Innovation', 'Impact', 'Presentation', 'Technical Mastery'];
    }
    
    return baseCriteria;
  };

  const getMatchStyle = (match) => {
    if (match.winner) {
      return {
        border: '2px solid #28a745',
        backgroundColor: '#d4edda'
      };
    }
    return {
      border: '1px solid #ddd',
      backgroundColor: '#f8f9fa'
    };
  };

  const getTeamStyle = (team, isWinner) => {
    if (isWinner) {
      return {
        fontWeight: 'bold',
        color: '#28a745'
      };
    }
    return {};
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: '0', color: '#0e1e3b' }}>🏆 {round.round_name} - Toernooi Bracket</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
            {teams.length} spanne • {bracket.length} rondes
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Terug na Rondte
        </button>
      </div>

      {message && (
        <div style={{
          padding: '10px',
          backgroundColor: message.includes('Fout') ? '#f8d7da' : '#d4edda',
          color: message.includes('Fout') ? '#721c24' : '#155724',
          border: `1px solid ${message.includes('Fout') ? '#f5c6cb' : '#c3e6cb'}`,
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {message}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Laai toernooi bracket...</p>
        </div>
      ) : (
        <>
          {/* Tournament Progression Summary */}
          <div style={{ 
            marginBottom: '30px', 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#0e1e3b' }}>🏆 Toernooi Voortgang</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              {bracket.map((round, roundIndex) => (
                <div key={roundIndex} style={{
                  padding: '10px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  border: '1px solid #ddd'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#0e1e3b', marginBottom: '5px' }}>
                    {round.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '3px' }}>
                    {round.matches.length} wedstryd(e)
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '3px' }}>
                    {getRequiredJudges(roundIndex)} beoordelaar(s)
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {getMatchCriteria(roundIndex, 0).length} kriteria
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '30px', overflowX: 'auto' }}>
          {bracket.map((round, roundIndex) => (
            <div key={roundIndex} style={{ minWidth: '300px' }}>
              <h3 style={{ 
                textAlign: 'center', 
                marginBottom: '20px', 
                color: '#0e1e3b',
                padding: '10px',
                backgroundColor: '#e3f2fd',
                borderRadius: '6px'
              }}>
                {round.name}
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  {getRequiredJudges(roundIndex)} beoordelaar(s) • {getMatchCriteria(roundIndex, 0).length} kriteria
                </div>
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {round.matches.map((match, matchIndex) => (
                  <div key={match.id} style={{
                    padding: '15px',
                    borderRadius: '8px',
                    ...getMatchStyle(match)
                  }}>
                    <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
                      {match.group ? `Groep ${match.group}` : `Wedstryd ${matchIndex + 1}`}
                    </div>
                    
                    {/* Match-specific criteria */}
                    <div style={{ marginBottom: '10px', fontSize: '11px', color: '#666' }}>
                      <strong>Kriteria:</strong> {getMatchCriteria(roundIndex, matchIndex).join(', ')}
                    </div>
                    
                    {/* Judge assignment info */}
                    <div style={{ marginBottom: '10px', fontSize: '11px', color: '#666' }}>
                      <strong>Beoordelaars:</strong> {getRequiredJudges(roundIndex)} aangewys
                    </div>
                    
                    {/* Team 1 */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '8px',
                      padding: '8px',
                      backgroundColor: 'white',
                      borderRadius: '4px'
                    }}>
                      <span style={getTeamStyle(match.team1, match.winner === match.team1)}>
                        {match.team1 ? match.team1.naam : 'TBD'}
                        {!match.team2 && match.team1 && (
                          <span style={{ color: '#28a745', marginLeft: '5px', fontSize: '10px' }}>
                            ⚡ Auto-advance
                          </span>
                        )}
                      </span>
                      <input
                        type="number"
                        value={match.score1}
                        onChange={(e) => handleScoreUpdate(roundIndex, matchIndex, 1, e.target.value)}
                        style={{
                          width: '50px',
                          padding: '4px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          textAlign: 'center'
                        }}
                        disabled={!match.team1}
                      />
                    </div>
                    
                    <div style={{ textAlign: 'center', margin: '5px 0', fontSize: '14px', color: '#666' }}>
                      VS
                    </div>
                    
                    {/* Team 2 */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '8px',
                      backgroundColor: 'white',
                      borderRadius: '4px'
                    }}>
                      <span style={getTeamStyle(match.team2, match.winner === match.team2)}>
                        {match.team2 ? match.team2.naam : 'TBD'}
                        {!match.team1 && match.team2 && (
                          <span style={{ color: '#28a745', marginLeft: '5px', fontSize: '10px' }}>
                            ⚡ Auto-advance
                          </span>
                        )}
                      </span>
                      <input
                        type="number"
                        value={match.score2}
                        onChange={(e) => handleScoreUpdate(roundIndex, matchIndex, 2, e.target.value)}
                        style={{
                          width: '50px',
                          padding: '4px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          textAlign: 'center'
                        }}
                        disabled={!match.team2}
                      />
                    </div>
                    
                    {match.winner && (
                      <div style={{ 
                        marginTop: '8px', 
                        textAlign: 'center', 
                        fontSize: '12px', 
                        color: '#28a745',
                        fontWeight: 'bold'
                      }}>
                        🏆 Wenner: {match.winner.naam}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TournamentBracket;
