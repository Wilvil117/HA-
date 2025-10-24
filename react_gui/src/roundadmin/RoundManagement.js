import React, { useState, useEffect } from 'react';
import { 
  getAllRounds, 
  createRound, 
  updateRoundStatus, 
  getRoundTeams, 
  updateTeamParticipation,
  getRoundCriteria,
  updateRoundCriteria,
  getRoundAllocations,
  autoAllocateJudges,
  getRoundSummary
} from '../services/round_services';
import { fetchAllTeams } from '../services/span_services';
import { getAllKriteria } from '../services/kriteria_services';

const RoundManagement = () => {
  const [rounds, setRounds] = useState([]);
  const [, setTeams] = useState([]);
  const [, setKriteria] = useState([]);
  const [beoordelaars, setBeoordelaars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedRound, setSelectedRound] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRoundDetails, setShowRoundDetails] = useState(false);
  const [roundTeams, setRoundTeams] = useState([]);
  const [roundCriteria, setRoundCriteria] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [summary, setSummary] = useState([]);
  const [activeTab, setActiveTab] = useState('teams');

  // New round form state
  const [newRound, setNewRound] = useState({
    round_name: '',
    max_teams: 15,
    max_judges_per_team: 3,
    max_teams_per_judge: 3
  });

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

  const handleCreateRound = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createRound(newRound);
      setMessage('Rondte suksesvol geskep!');
      setShowCreateForm(false);
      setNewRound({
        round_name: '',
        max_teams: 15,
        max_judges_per_team: 3,
        max_teams_per_judge: 3
      });
      loadData();
    } catch (err) {
      setMessage('Fout met skep van rondte: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (roundId, status) => {
    try {
      setLoading(true);
      await updateRoundStatus(roundId, status);
      setMessage(`Rondte ${status} suksesvol!`);
      loadData();
    } catch (err) {
      setMessage('Fout met opdateer van status: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRoundDetails = async (round) => {
    try {
      setLoading(true);
      setSelectedRound(round);
      
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
      setShowRoundDetails(true);
    } catch (err) {
      setMessage('Fout met laai van rondte besonderhede: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeamParticipation = async (teamId, isParticipating) => {
    try {
      const updatedTeams = roundTeams.map(team => 
        team.span_id === teamId 
          ? { ...team, is_participating: isParticipating ? 1 : 0 }
          : team
      );
      
      const participationData = updatedTeams.map(team => ({
        span_id: team.span_id,
        is_participating: team.is_participating
      }));
      
      await updateTeamParticipation(selectedRound.round_id, participationData);
      setRoundTeams(updatedTeams);
      setMessage('Span deelname opdateer!');
    } catch (err) {
      setMessage('Fout met opdateer van span deelname: ' + err.message);
    }
  };

  const handleUpdateCriteria = async (kriteriaId, isActive, weight = 1.0) => {
    try {
      const updatedCriteria = roundCriteria.map(criteria => 
        criteria.kriteria_id === kriteriaId 
          ? { ...criteria, is_active: isActive ? 1 : 0, weight }
          : criteria
      );
      
      const criteriaData = updatedCriteria.map(criteria => ({
        kriteria_id: criteria.kriteria_id,
        is_active: criteria.is_active,
        weight: criteria.weight
      }));
      
      await updateRoundCriteria(selectedRound.round_id, criteriaData);
      setRoundCriteria(updatedCriteria);
      setMessage('Kriteria opdateer!');
    } catch (err) {
      setMessage('Fout met opdateer van kriteria: ' + err.message);
    }
  };

  const handleAutoAllocate = async () => {
    try {
      setLoading(true);
      const result = await autoAllocateJudges(selectedRound.round_id);
      setMessage(`Outomatiese toewysing voltooi! ${result.allocations_created} toewysings geskep.`);
      
      // Reload allocations
      const allocationsData = await getRoundAllocations(selectedRound.round_id);
      setAllocations(allocationsData);
    } catch (err) {
      setMessage('Fout met outomatiese toewysing: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#28a745';
      case 'closed': return '#dc3545';
      case 'archived': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'open': return 'Oop';
      case 'closed': return 'Gesluit';
      case 'archived': return 'Argief';
      default: return status;
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#0e1e3b', marginBottom: '30px' }}>Rondte Bestuur</h1>
      
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

      {/* Create Round Button */}
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
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

      {/* Create Round Form */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ marginTop: 0, color: '#0e1e3b' }}>Skep Nuwe Rondte</h2>
            <form onSubmit={handleCreateRound}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Rondte Naam:
                </label>
                <input
                  type="text"
                  value={newRound.round_name}
                  onChange={(e) => setNewRound({...newRound, round_name: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Maksimum Spanne:
                </label>
                <input
                  type="number"
                  value={newRound.max_teams}
                  onChange={(e) => setNewRound({...newRound, max_teams: parseInt(e.target.value)})}
                  min="1"
                  max="15"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Maksimum Beoordelaars per Span:
                </label>
                <input
                  type="number"
                  value={newRound.max_judges_per_team}
                  onChange={(e) => setNewRound({...newRound, max_judges_per_team: parseInt(e.target.value)})}
                  min="1"
                  max="5"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Maksimum Spanne per Beoordelaar:
                </label>
                <input
                  type="number"
                  value={newRound.max_teams_per_judge}
                  onChange={(e) => setNewRound({...newRound, max_teams_per_judge: parseInt(e.target.value)})}
                  min="1"
                  max="5"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? 'Skep...' : 'Skep Rondte'}
                </button>
                <button
                  type="button"
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
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rounds List */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#0e1e3b', marginBottom: '20px' }}>Bestaande Rondtes</h2>
        {loading ? (
          <p>Laai...</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {rounds.map(round => (
              <div key={round.round_id} style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: '#0e1e3b' }}>{round.round_name}</h3>
                    <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                      Geskep: {new Date(round.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: getStatusColor(round.status),
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {getStatusText(round.status)}
                    </span>
                    <button
                      onClick={() => handleViewRoundDetails(round)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Besonderhede
                    </button>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <strong>Deelnemende Spanne:</strong> {round.participating_teams || 0}
                  </div>
                  <div>
                    <strong>Toegewysde Beoordelaars:</strong> {round.assigned_judges || 0}
                  </div>
                  <div>
                    <strong>Maksimum Spanne:</strong> {round.max_teams}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {round.status === 'open' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(round.round_id, 'closed')}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Sluit Rondte
                      </button>
                    </>
                  )}
                  {round.status === 'closed' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(round.round_id, 'open')}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Maak Oop
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(round.round_id, 'archived')}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Argief
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Round Details Modal */}
      {showRoundDetails && selectedRound && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '1000px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#0e1e3b' }}>{selectedRound.round_name} - Besonderhede</h2>
              <button
                onClick={() => setShowRoundDetails(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Sluit
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
              <button
                onClick={() => setActiveTab('teams')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid #007bff',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Spanne
              </button>
              <button
                onClick={() => setActiveTab('criteria')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                Kriteria
              </button>
              <button
                onClick={() => setActiveTab('allocations')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                Toewysings
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                Opsomming
              </button>
            </div>

            {/* Teams Tab */}
            {activeTab === 'teams' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h3>Span Deelname</h3>
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                      Klik "Outomatiese Toewysing" om beoordelaars ewe te verdeel tussen alle spanne
                    </p>
                  </div>
                  <button
                    onClick={handleAutoAllocate}
                    disabled={loading}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                      fontSize: '16px',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {loading ? 'Toewys...' : '🎯 Outomatiese Toewysing'}
                  </button>
                </div>
                
                {/* Available Beoordelaars */}
                <div style={{ marginBottom: '30px' }}>
                  <h4 style={{ marginBottom: '15px', color: '#0e1e3b' }}>Beskikbare Beoordelaars</h4>
                  {beoordelaars.length === 0 ? (
                    <p style={{ color: '#dc3545', fontStyle: 'italic' }}>
                      ⚠️ Geen beoordelaars beskikbaar nie. Voeg beoordelaars by in die gebruikersbestuur.
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                      {beoordelaars.map(beoordelaar => (
                        <div key={beoordelaar.user_id} style={{
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          backgroundColor: '#f8f9fa',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontWeight: 'bold', color: '#0e1e3b' }}>{beoordelaar.email}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>Beoordelaar</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'grid', gap: '10px' }}>
                  {roundTeams.map(team => (
                    <div key={team.span_id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '15px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      backgroundColor: team.is_participating ? '#f8f9fa' : '#fff'
                    }}>
                      <span style={{ fontWeight: 'bold' }}>{team.naam}</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={team.is_participating === 1}
                          onChange={(e) => handleUpdateTeamParticipation(team.span_id, e.target.checked)}
                        />
                        Deelneem
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Criteria Tab */}
            {activeTab === 'criteria' && (
              <div>
                <h3 style={{ marginBottom: '20px' }}>Kriteria vir hierdie Rondte</h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {roundCriteria.map(criteria => (
                    <div key={criteria.kriteria_id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '15px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      backgroundColor: criteria.is_active ? '#f8f9fa' : '#fff'
                    }}>
                      <div>
                        <span style={{ fontWeight: 'bold' }}>{criteria.beskrywing}</span>
                        <span style={{ color: '#666', marginLeft: '10px' }}>
                          (Max: {criteria.default_totaal} punte)
                        </span>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={criteria.is_active === 1}
                          onChange={(e) => handleUpdateCriteria(criteria.kriteria_id, e.target.checked, 1.0)}
                        />
                        Aktief
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Allocations Tab */}
            {activeTab === 'allocations' && (
              <div>
                <h3 style={{ marginBottom: '20px' }}>Beoordelaar Toewysings</h3>
                
                {/* Team Judge Count Summary */}
                {allocations.length > 0 && (
                  <div style={{ marginBottom: '30px' }}>
                    <h4 style={{ marginBottom: '15px', color: '#0e1e3b' }}>Span Beoordelaar Telling</h4>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {Object.entries(
                        allocations.reduce((acc, allocation) => {
                          if (!acc[allocation.team_name]) {
                            acc[allocation.team_name] = [];
                          }
                          acc[allocation.team_name].push(allocation.judge_email);
                          return acc;
                        }, {})
                      ).map(([teamName, judges]) => (
                        <div key={teamName} style={{
                          padding: '12px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          backgroundColor: '#f8f9fa'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong>{teamName}</strong>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ 
                                backgroundColor: judges.length >= 2 ? '#d4edda' : '#fff3cd',
                                color: judges.length >= 2 ? '#155724' : '#856404',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                {judges.length} beoordelaar(s)
                              </span>
                              {judges.length < 2 && (
                                <span style={{ color: '#dc3545', fontSize: '12px' }}>
                                  ⚠️ Min 2 beoordelaars aanbeveel
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                            {judges.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Judge Workload Summary */}
                {allocations.length > 0 && (
                  <div style={{ marginBottom: '30px' }}>
                    <h4 style={{ marginBottom: '15px', color: '#0e1e3b' }}>Beoordelaar Werkbelasting</h4>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {Object.entries(
                        allocations.reduce((acc, allocation) => {
                          if (!acc[allocation.judge_email]) {
                            acc[allocation.judge_email] = [];
                          }
                          acc[allocation.judge_email].push(allocation.team_name);
                          return acc;
                        }, {})
                      ).map(([judgeEmail, teams]) => (
                        <div key={judgeEmail} style={{
                          padding: '12px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          backgroundColor: '#f8f9fa'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong>{judgeEmail}</strong>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ 
                                backgroundColor: teams.length <= 3 ? '#d4edda' : '#fff3cd',
                                color: teams.length <= 3 ? '#155724' : '#856404',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                {teams.length} span(ne)
                              </span>
                              {teams.length > 3 && (
                                <span style={{ color: '#dc3545', fontSize: '12px' }}>
                                  ⚠️ Hoë werkbelasting
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                            <strong>Spane om te merk:</strong> {teams.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Detailed Allocations */}
                <h4 style={{ marginBottom: '15px', color: '#0e1e3b' }}>Gedetailleerde Toewysings</h4>
                {allocations.length === 0 ? (
                  <p style={{ color: '#666', fontStyle: 'italic' }}>Geen toewysings nie. Klik "Outomatiese Toewysing" om te begin.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {allocations.map(allocation => (
                      <div key={allocation.allocation_id} style={{
                        padding: '15px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        backgroundColor: '#f8f9fa'
                      }}>
                        <strong>{allocation.team_name}</strong> → {allocation.judge_email}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <div>
                <h3 style={{ marginBottom: '20px' }}>Rondte Opsomming</h3>
                {summary.length === 0 ? (
                  <p style={{ color: '#666', fontStyle: 'italic' }}>Geen data beskikbaar nie.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {summary.map((team, index) => (
                      <div key={team.span_id} style={{
                        padding: '15px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        backgroundColor: index === 0 ? '#d4edda' : '#f8f9fa',
                        borderColor: index === 0 ? '#c3e6cb' : '#ddd'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong>{team.naam}</strong>
                            {index === 0 && <span style={{ color: '#28a745', marginLeft: '10px' }}>🏆 Wenner!</span>}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                              {team.average_score ? team.average_score.toFixed(1) : '0.0'} punte
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {team.judge_count} beoordelaar(s) • {team.scores_count} telling(e)
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoundManagement;
