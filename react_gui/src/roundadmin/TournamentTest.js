import React, { useState, useEffect } from 'react';
import { getAllRounds, createRound, updateRoundStatus, getRoundTeams, updateTeamParticipation, getRoundCriteria, updateRoundCriteria, getRoundAllocations, autoAllocateJudges, getRoundSummary } from '../services/round_services';
import { fetchAllTeams } from '../services/span_services';
import { getAllKriteria } from '../services/kriteria_services';

const TournamentTest = () => {
  const [rounds, setRounds] = useState([]);
  const [teams, setTeams] = useState([]);
  const [kriteria, setKriteria] = useState([]);
  const [beoordelaars, setBeoordelaars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('tournament');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRoundDetails, setShowRoundDetails] = useState(false);
  const [selectedRound, setSelectedRound] = useState(null);
  const [roundTeams, setRoundTeams] = useState([]);
  const [roundCriteria, setRoundCriteria] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [summary, setSummary] = useState([]);
  const [judgeTeamAssignments, setJudgeTeamAssignments] = useState({});
  const [showJudgeAssignment, setShowJudgeAssignment] = useState(false);

  // New round form state
  const [newRound, setNewRound] = useState({
    round_name: '',
    max_teams: 15,
    max_judges_per_team: 3,
    max_teams_per_judge: 3
  });

  const [testBracket, setTestBracket] = useState([
    {
      name: 'Kwarteindstryd',
      matches: [
        { id: 1, team1: { naam: 'Team A' }, team2: { naam: 'Team B' }, winner: null, score1: 0, score2: 0 },
        { id: 2, team1: { naam: 'Team C' }, team2: { naam: 'Team D' }, winner: null, score1: 0, score2: 0 },
        { id: 3, team1: { naam: 'Team E' }, team2: null, winner: null, score1: 0, score2: 0 },
        { id: 4, team1: { naam: 'Team F' }, team2: { naam: 'Team G' }, winner: null, score1: 0, score2: 0 }
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
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [roundsData, teamsData, kriteriaData, beoordelaarsData] = await Promise.all([
        getAllRounds(),
        fetchAllTeams(),
        getAllKriteria(),
        loadBeoordelaars()
      ]);
      setRounds(roundsData);
      setTeams(teamsData);
      setKriteria(kriteriaData);
      setBeoordelaars(beoordelaarsData);
    } catch (err) {
      setMessage('Fout met laai van data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBeoordelaars = async () => {
    try {
      const response = await fetch('http://localhost:4000/auth/beoordelaars');
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Kon nie beoordelaars laai nie');
      }
    } catch (err) {
      console.error('Error loading beoordelaars:', err);
      return [];
    }
  };

  // Judge-Team Assignment Functions
  const handleJudgeTeamAssignment = (judgeId, teamId, isAssigned) => {
    setJudgeTeamAssignments(prev => {
      const newAssignments = { ...prev };
      if (!newAssignments[judgeId]) {
        newAssignments[judgeId] = [];
      }
      
      if (isAssigned) {
        if (!newAssignments[judgeId].includes(teamId)) {
          newAssignments[judgeId].push(teamId);
        }
      } else {
        newAssignments[judgeId] = newAssignments[judgeId].filter(id => id !== teamId);
      }
      
      return newAssignments;
    });
  };

  const isJudgeAssignedToTeam = (judgeId, teamId) => {
    return judgeTeamAssignments[judgeId]?.includes(teamId) || false;
  };

  const getTeamsForJudge = (judgeId) => {
    return judgeTeamAssignments[judgeId] || [];
  };

  const getJudgesForTeam = (teamId) => {
    const judges = [];
    Object.entries(judgeTeamAssignments).forEach(([judgeId, teamIds]) => {
      if (teamIds.includes(teamId)) {
        const judge = beoordelaars.find(b => b.user_id === parseInt(judgeId));
        if (judge) judges.push(judge);
      }
    });
    return judges;
  };

  // Round Management Functions
  const handleCreateRound = async () => {
    try {
      setLoading(true);
      await createRound(newRound);
      setMessage('Rondte suksesvol geskep!');
      setShowCreateForm(false);
      setNewRound({ round_name: '', max_teams: 15, max_judges_per_team: 3, max_teams_per_judge: 3 });
      loadData();
    } catch (err) {
      setMessage('Fout met skep van rondte: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRoundStatus = async (roundId, status) => {
    try {
      setLoading(true);
      await updateRoundStatus(roundId, status);
      setMessage(`Rondte ${status === 'open' ? 'oopgemaak' : 'gesluit'}!`);
      loadData();
    } catch (err) {
      setMessage('Fout met bywerk van rondte status: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRoundDetails = async (round) => {
    try {
      setLoading(true);
      const [teamsData, criteriaData, allocationsData, summaryData] = await Promise.all([
        getRoundTeams(round.round_id),
        getRoundCriteria(round.round_id),
        getRoundAllocations(round.round_id),
        getRoundSummary(round.round_id)
      ]);
      
      setRoundTeams(teamsData);
      setRoundCriteria(criteriaData);
      setAllocations(allocationsData);
      setSummary(summaryData);
      setSelectedRound(round);
      setShowRoundDetails(true);
    } catch (err) {
      setMessage('Fout met laai van rondte besonderhede: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAllocate = async (roundId) => {
    try {
      setLoading(true);
      await autoAllocateJudges(roundId);
      setMessage('Beoordelaars outomaties toegewys!');
      loadData();
    } catch (err) {
      setMessage('Fout met outomatiese toewysing: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreUpdate = (roundIndex, matchIndex, team, score) => {
    const newBracket = [...testBracket];
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
    
    setTestBracket(newBracket);
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
      <h1 style={{ color: '#0e1e3b', marginBottom: '30px' }}>🏆 Tournament & Round Management</h1>
      
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

      {/* Tab Navigation */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('tournament')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'tournament' ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            🏆 Tournament Test
          </button>
          <button
            onClick={() => setActiveTab('rounds')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'rounds' ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            📋 Round Management
          </button>
          <button
            onClick={() => setActiveTab('judges')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'judges' ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            👥 Judge Assignment
          </button>
        </div>
      </div>

      {/* Tournament Test Tab */}
      {activeTab === 'tournament' && (
        <div>
          <h2 style={{ color: '#0e1e3b', marginBottom: '20px' }}>Tournament Bracket Test</h2>
          <div style={{ display: 'flex', gap: '30px', overflowX: 'auto' }}>
            {testBracket.map((round, roundIndex) => (
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
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {round.matches.map((match, matchIndex) => (
                    <div key={match.id} style={{
                      padding: '15px',
                      borderRadius: '8px',
                      ...getMatchStyle(match)
                    }}>
                      <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
                        Wedstryd {matchIndex + 1}
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
        </div>
      )}

      {/* Round Management Tab */}
      {activeTab === 'rounds' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: '#0e1e3b', margin: '0' }}>Round Management</h2>
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              + Skep Nuwe Rondte
            </button>
          </div>

          {/* Rounds List */}
          <div style={{ display: 'grid', gap: '20px' }}>
            {rounds.map(round => (
              <div key={round.round_id} style={{
                padding: '20px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#f8f9fa'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <div>
                    <h3 style={{ margin: '0', color: '#0e1e3b' }}>{round.round_name}</h3>
                    <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                      Status: <span style={{ 
                        color: round.status === 'open' ? '#28a745' : round.status === 'closed' ? '#dc3545' : '#6c757d',
                        fontWeight: 'bold'
                      }}>
                        {round.status === 'open' ? 'Oop' : round.status === 'closed' ? 'Gesluit' : 'Argief'}
                      </span>
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleViewRoundDetails(round)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Besonderhede
                    </button>
                    <button
                      onClick={() => handleUpdateRoundStatus(round.round_id, round.status === 'open' ? 'closed' : 'open')}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: round.status === 'open' ? '#dc3545' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      {round.status === 'open' ? 'Sluit' : 'Maak Oop'}
                    </button>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                  <div>
                    <strong>Maksimum Spanne:</strong> {round.max_teams}
                  </div>
                  <div>
                    <strong>Beoordelaars per Span:</strong> {round.max_judges_per_team}
                  </div>
                  <div>
                    <strong>Spane per Beoordelaar:</strong> {round.max_teams_per_judge}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Judge Assignment Tab */}
      {activeTab === 'judges' && (
        <div>
          <h2 style={{ color: '#0e1e3b', marginBottom: '20px' }}>Judge-Team Assignment</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {/* Judges List */}
            <div>
              <h3 style={{ color: '#0e1e3b', marginBottom: '15px' }}>Beoordelaars</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {beoordelaars.map(judge => (
                  <div key={judge.user_id} style={{
                    padding: '15px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    backgroundColor: 'white'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{judge.email}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                      Toegewys aan {getTeamsForJudge(judge.user_id).length} span(ne)
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Spane: {getTeamsForJudge(judge.user_id).map(teamId => {
                        const team = teams.find(t => t.span_id === teamId);
                        return team ? team.naam : `Span ${teamId}`;
                      }).join(', ') || 'Geen'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Teams List */}
            <div>
              <h3 style={{ color: '#0e1e3b', marginBottom: '15px' }}>Spane</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {teams.map(team => (
                  <div key={team.span_id} style={{
                    padding: '15px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    backgroundColor: 'white'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{team.naam}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                      Toegewys aan {getJudgesForTeam(team.span_id).length} beoordelaar(s)
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Beoordelaars: {getJudgesForTeam(team.span_id).map(judge => judge.email).join(', ') || 'Geen'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Assignment Matrix */}
          <div style={{ marginTop: '30px' }}>
            <h3 style={{ color: '#0e1e3b', marginBottom: '15px' }}>Assignment Matrix</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Beoordelaar</th>
                    {teams.map(team => (
                      <th key={team.span_id} style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', minWidth: '120px' }}>
                        {team.naam}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {beoordelaars.map(judge => (
                    <tr key={judge.user_id}>
                      <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                        {judge.email}
                      </td>
                      {teams.map(team => (
                        <td key={team.span_id} style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isJudgeAssignedToTeam(judge.user_id, team.span_id)}
                            onChange={(e) => handleJudgeTeamAssignment(judge.user_id, team.span_id, e.target.checked)}
                            style={{ transform: 'scale(1.2)' }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Round Modal */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#0e1e3b' }}>Skep Nuwe Rondte</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Rondte Naam:</label>
              <input
                type="text"
                value={newRound.round_name}
                onChange={(e) => setNewRound({ ...newRound, round_name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                placeholder="Byv. Capstone 2024 - Final Round"
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Maksimum Spanne:</label>
              <input
                type="number"
                value={newRound.max_teams}
                onChange={(e) => setNewRound({ ...newRound, max_teams: parseInt(e.target.value) || 15 })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                min="1"
                max="100"
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Beoordelaars per Span:</label>
              <input
                type="number"
                value={newRound.max_judges_per_team}
                onChange={(e) => setNewRound({ ...newRound, max_judges_per_team: parseInt(e.target.value) || 3 })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                min="1"
                max="10"
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Spane per Beoordelaar:</label>
              <input
                type="number"
                value={newRound.max_teams_per_judge}
                onChange={(e) => setNewRound({ ...newRound, max_teams_per_judge: parseInt(e.target.value) || 3 })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                min="1"
                max="20"
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowCreateForm(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Kanselleer
              </button>
              <button
                onClick={handleCreateRound}
                disabled={loading || !newRound.round_name}
                style={{
                  padding: '10px 20px',
                  backgroundColor: loading || !newRound.round_name ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading || !newRound.round_name ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Skep...' : 'Skep Rondte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentTest;
