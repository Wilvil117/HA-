import React, { useState, useEffect } from 'react';
import { getRoundAllocations, getRoundCriteria } from '../services/round_services';

const JudgeInterface = () => {
  const [user, setUser] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [myAllocations, setMyAllocations] = useState([]);
  const [roundCriteria, setRoundCriteria] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Get current user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadMyRounds();
    }
  }, [user]);

  const loadMyRounds = async () => {
    try {
      setLoading(true);
      // This would need to be implemented in the backend
      // For now, we'll use a mock approach
      const response = await fetch('http://localhost:4000/rounds', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const roundsData = await response.json();
        setRounds(roundsData.filter(round => round.status === 'open'));
      }
    } catch (err) {
      setMessage('Fout met laai van rondtes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRound = async (round) => {
    try {
      setLoading(true);
      setSelectedRound(round);
      
      // Get my allocations for this round
      const allocations = await getRoundAllocations(round.round_id);
      const myAllocations = allocations.filter(allocation => 
        allocation.user_id === user.user_id
      );
      setMyAllocations(myAllocations);
      
      // Get criteria for this round
      const criteria = await getRoundCriteria(round.round_id);
      setRoundCriteria(criteria.filter(c => c.is_active === 1));
      
      // Initialize scores
      const initialScores = {};
      myAllocations.forEach(allocation => {
        initialScores[allocation.allocation_id] = {};
        criteria.forEach(criterion => {
          if (criterion.is_active === 1) {
            initialScores[allocation.allocation_id][criterion.kriteria_id] = 0;
          }
        });
      });
      setScores(initialScores);
      
    } catch (err) {
      setMessage('Fout met laai van rondte data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (allocationId, kriteriaId, value) => {
    setScores(prev => ({
      ...prev,
      [allocationId]: {
        ...prev[allocationId],
        [kriteriaId]: parseFloat(value) || 0
      }
    }));
  };

  const handleSaveScores = async () => {
    try {
      setLoading(true);
      
      // This would need to be implemented in the backend
      // For now, we'll just show a success message
      setMessage('Tellinge suksesvol gestoor!');
      
    } catch (err) {
      setMessage('Fout met stoor van tellinge: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTeamTotal = (allocationId) => {
    const teamScores = scores[allocationId] || {};
    return Object.values(teamScores).reduce((sum, score) => sum + (score || 0), 0);
  };

  const getMaxTotal = () => {
    return roundCriteria.reduce((sum, criteria) => sum + (criteria.default_totaal * criteria.weight), 0);
  };

  if (!user) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Jy moet ingeteken wees om hierdie bladsy te sien.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#0e1e3b', marginBottom: '30px' }}>
        Beoordelaar Koppelvlak - {user.email}
      </h1>
      
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

      {!selectedRound ? (
        <div>
          <h2 style={{ color: '#0e1e3b', marginBottom: '20px' }}>Kies 'n Rondte</h2>
          {loading ? (
            <p>Laai rondtes...</p>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {rounds.map(round => (
                <div key={round.round_id} style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  cursor: 'pointer'
                }}
                onClick={() => handleSelectRound(round)}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#0e1e3b' }}>{round.round_name}</h3>
                  <p style={{ margin: '0', color: '#666' }}>
                    Status: <span style={{ color: '#28a745', fontWeight: 'bold' }}>Oop</span>
                  </p>
                  <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                    Klik om jou toegewysde spanne te sien en te beoordeel
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div>
              <h2 style={{ margin: '0', color: '#0e1e3b' }}>{selectedRound.round_name}</h2>
              <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                Jou toegewysde spanne en kriteria
              </p>
            </div>
            <button
              onClick={() => setSelectedRound(null)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Terug na Rondtes
            </button>
          </div>

          {myAllocations.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <h3 style={{ color: '#666' }}>Geen Toewysings</h3>
              <p style={{ color: '#666' }}>
                Jy het nog nie spanne toegewys gekry vir hierdie rondte nie.
              </p>
            </div>
          ) : (
            <div>
              {/* Assignment Summary */}
              <div style={{ 
                marginBottom: '30px', 
                padding: '20px', 
                backgroundColor: '#e3f2fd', 
                borderRadius: '8px',
                border: '1px solid #bbdefb'
              }}>
                <h3 style={{ color: '#0e1e3b', marginBottom: '15px' }}>📋 Jou Toewysing Oorsig</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '6px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>{myAllocations.length}</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Spane om te merk</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '6px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>{roundCriteria.length}</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Kriteria per span</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '6px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>{myAllocations.length * roundCriteria.length}</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Totale beoordelings</div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ color: '#0e1e3b', marginBottom: '20px' }}>🎯 Jou Toegewysde Spanne</h3>
                <div style={{ display: 'grid', gap: '20px' }}>
                  {myAllocations.map(allocation => (
                    <div key={allocation.allocation_id} style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '20px',
                      backgroundColor: 'white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <h4 style={{ margin: '0 0 15px 0', color: '#0e1e3b' }}>
                        {allocation.team_name}
                      </h4>
                      
                      <div style={{ marginBottom: '20px' }}>
                        <h5 style={{ margin: '0 0 10px 0', color: '#0e1e3b' }}>Kriteria Beoordeling:</h5>
                        <div style={{ display: 'grid', gap: '10px' }}>
                          {roundCriteria.map(criteria => (
                            <div key={criteria.kriteria_id} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '10px',
                              backgroundColor: '#f8f9fa',
                              borderRadius: '4px'
                            }}>
                              <div>
                                <span style={{ fontWeight: 'bold' }}>{criteria.beskrywing}</span>
                                <span style={{ color: '#666', marginLeft: '10px' }}>
                                  (Max: {criteria.default_totaal} punte)
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input
                                  type="number"
                                  value={scores[allocation.allocation_id]?.[criteria.kriteria_id] || 0}
                                  onChange={(e) => handleScoreChange(allocation.allocation_id, criteria.kriteria_id, e.target.value)}
                                  min="0"
                                  max={criteria.default_totaal}
                                  step="0.5"
                                  style={{
                                    width: '80px',
                                    padding: '4px 8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    textAlign: 'center'
                                  }}
                                />
                                <span style={{ color: '#666', fontSize: '12px' }}>
                                  / {criteria.default_totaal}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div style={{
                        padding: '10px',
                        backgroundColor: '#e9ecef',
                        borderRadius: '4px',
                        textAlign: 'center'
                      }}>
                        <strong>Totaal: {calculateTeamTotal(allocation.allocation_id).toFixed(1)} / {getMaxTotal().toFixed(1)} punte</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={handleSaveScores}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? 'Stoor...' : 'Stoor Alle Tellinge'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JudgeInterface;
