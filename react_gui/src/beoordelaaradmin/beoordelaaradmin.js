import React, { useState, useEffect } from 'react';
import MerkbladKriteriaManager from './merkblad';
import SpanScores from './span_scores';
import RoundManagement from '../roundadmin/RoundManagement';
import BeoordelaarAssignments from './BeoordelaarAssignments';
import { getRoundStatus, closeRound, openRound, getPunteByRondteId } from '../services/merk_services';
import { getAllKriteria } from '../services/kriteria_services';
import { fetchAllTeams } from '../services/span_services';

function BeoordelaarAdmin() {
  const [rondteId] = useState(1); // default rondte ID is 1 vir HA1
  const [roundStatus, setRoundStatus] = useState(null);
  const [topTeam, setTopTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);  // NEW: add refreshKey
  // const [, setTeams] = useState([]);
  const [kriteria, setKriteria] = useState([]);
  const [beoordelaars, setBeoordelaars] = useState([]);
  const [teamAssignments, setTeamAssignments] = useState({});
  const [criteriaAssignments, setCriteriaAssignments] = useState({});
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [viewMode, setViewMode] = useState('assignments'); // 'legacy', 'rounds', or 'assignments'

  const handleKriteriaUpdated = () => {
    // This function can be used to refresh other components or show notifications
    console.log('Kriteria updated for rondte:', rondteId);
  };
  
  useEffect(() => {
    const eventSource = new EventSource("http://localhost:4001/stream");
  
    eventSource.onmessage = (event) => {
      const nuwePunte = JSON.parse(event.data);
      console.log(nuwePunte)
      setRefreshKey(prev => prev + 1);  // NEW: increment refreshKey on update
    };
  
    return () => eventSource.close();
  }, []);
  // Load round status and calculate top team
  useEffect(() => {
    const loadRoundData = async () => {
      try {
        setLoading(true);
        
        // Get round status
        const status = await getRoundStatus(rondteId);
        setRoundStatus(status);
        
        // Get all scores for this round
        const scores = await getPunteByRondteId(rondteId);
        
        // Get all teams
        // const teams = await fetchAllTeams();
        
        // Calculate total scores and possible totals for each team
        const teamScores = {};
        scores.forEach(score => {
          if (!teamScores[score.span_id]) {
            teamScores[score.span_id] = {
              span_id: score.span_id,
              span_naam: score.span_naam,
              totalScore: 0,         // Actual points awarded
              totalPossible: 0       // Total possible points for this team (criteria * score per criteria)
            };
          }
          teamScores[score.span_id].totalScore += score.punt;
          teamScores[score.span_id].totalPossible += score.totaal; // Use 'totaal' from the score itself (like in span_scores.js)
        });
        
        // Find top team by percentage
        const teamsArray = Object.values(teamScores).map(team => ({
          ...team,
          percentage: team.totalPossible > 0 ? (team.totalScore / team.totalPossible) * 100 : 0
        }));
        if (teamsArray.length > 0) {
          const top = teamsArray.reduce((prev, current) =>
            (prev.percentage > current.percentage) ? prev : current
          );
          setTopTeam(top);
        }
        
      } catch (err) {
        setMessage('Fout met laai van rondte data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadRoundData();
  }, [rondteId]);

  // Handle opening the round
  const handleOpenRound = async () => {
    if (roundStatus && roundStatus.is_open) {
      setMessage('Rondte is reeds oop.');
      return;
    }
    
    try {
      setLoading(true);
      await openRound(rondteId);
      setMessage('Rondte suksesvol oopgemaak!');
      
      // Refresh round status
      const status = await getRoundStatus(rondteId);
      setRoundStatus(status);
      
    } catch (err) {
      setMessage('Fout met oopmaak van rondte: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle closing the round
  const handleCloseRound = async () => {
    if (!roundStatus || !roundStatus.is_open) {
      setMessage('Rondte is reeds gesluit.');
      return;
    }
    
    try {
      setLoading(true);
      await closeRound(rondteId);
      setMessage('Rondte suksesvol gesluit!');
      
      // Refresh round status
      const status = await getRoundStatus(rondteId);
      setRoundStatus(status);
      
    } catch (err) {
      setMessage('Fout met sluit van rondte: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load teams and kriteria for assignments
  useEffect(() => {
    const loadAssignmentData = async () => {
      try {
        const [, kriteriaData] = await Promise.all([
          fetchAllTeams(),
          getAllKriteria()
        ]);
        setKriteria(kriteriaData);
        
        // Load beoordelaars from database
        try {
          const beoordelaarsResponse = await fetch('http://localhost:4000/auth/beoordelaars');
          if (beoordelaarsResponse.ok) {
            const beoordelaarsData = await beoordelaarsResponse.json();
            setBeoordelaars(beoordelaarsData);
          } else {
            // Fallback to mock data if API fails
            setBeoordelaars([
              { user_id: 1, email: 'beoordelaar@beoordelaar.co.za', role: 'beoordelaar' },
              { user_id: 2, email: 'beoordelaar1@beoordelaar.co.za', role: 'beoordelaar' },
              { user_id: 3, email: 'beoordelaar2@beoordelaar.co.za', role: 'beoordelaar' },
              { user_id: 4, email: 'beoordelaar3@beoordelaar.co.za', role: 'beoordelaar' }
            ]);
          }
        } catch (err) {
          console.log('Using fallback beoordelaars data');
          setBeoordelaars([
            { user_id: 1, email: 'beoordelaar@beoordelaar.co.za', role: 'beoordelaar' },
            { user_id: 2, email: 'beoordelaar1@beoordelaar.co.za', role: 'beoordelaar' },
            { user_id: 3, email: 'beoordelaar2@beoordelaar.co.za', role: 'beoordelaar' },
            { user_id: 4, email: 'beoordelaar3@beoordelaar.co.za', role: 'beoordelaar' }
          ]);
        }
      } catch (err) {
        setMessage('Fout met laai van toewysing data: ' + err.message);
      }
    };
    
    loadAssignmentData();
  }, []);

  // Handle team assignment
  // const handleTeamAssignment = (teamId, beoordelaarId) => {
  //   setTeamAssignments(prev => ({
  //     ...prev,
  //     [teamId]: beoordelaarId
  //   }));
  // };

  // Handle criteria assignment
  const handleCriteriaAssignment = (kriteriaId, beoordelaarId) => {
    setCriteriaAssignments(prev => ({
      ...prev,
      [kriteriaId]: beoordelaarId
    }));
  };

  // Save assignments
  const handleSaveAssignments = () => {
    // In a real app, this would save to the backend
    console.log('Team Assignments:', teamAssignments);
    console.log('Criteria Assignments:', criteriaAssignments);
    setMessage('Toewysings suksesvol gestoor!');
    setShowAssignmentModal(false);
  };

  return (
    <div>
        <h1>Welkom by die Beoordelaar Admin bladsy.</h1>
        
        {/* View Mode Toggle */}
        <div style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setViewMode('assignments')}
            style={{
              padding: '10px 20px',
              backgroundColor: viewMode === 'assignments' ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            🎯 My Toewysings
          </button>
          <button
            onClick={() => setViewMode('rounds')}
            style={{
              padding: '10px 20px',
              backgroundColor: viewMode === 'rounds' ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            🏆 Rondte Bestuur
          </button>
          <button
            onClick={() => setViewMode('legacy')}
            style={{
              padding: '10px 20px',
              backgroundColor: viewMode === 'legacy' ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            📊 Tradisionele Weergawe
          </button>
        </div>
        
        {/* Conditional Rendering based on view mode */}
        {viewMode === 'assignments' ? (
          <BeoordelaarAssignments />
        ) : viewMode === 'rounds' ? (
          <RoundManagement />
        ) : (
          <>
            {/* Top Team Display - Only show when round is closed */}
        {topTeam && roundStatus && !roundStatus.is_open && (
          <div style={{
            backgroundColor: '#0e1e3b',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <h2 style={{ margin: '0 0 10px 0', color: '#ffffff' }}>
              🏆 Wenner: {topTeam.span_naam}
            </h2>
            <div style={{ fontSize: '18px', color: '#ffffff', fontWeight: 'bold' }}>
              {/* Show winner's percentage to 1 decimal */}
              {topTeam.percentage.toFixed(1)}% 
              ({topTeam.totalScore.toFixed(1)} van {topTeam.totalPossible})
            </div>
          </div>
        )}

        {/* Round Status and Control Buttons */}
        <div style={{
          backgroundColor: '#0e1e3b',
          padding: '15px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: '0 0 5px 0', color: '#ffffff' }}>
              Rondte Status: {roundStatus?.is_open ? 'OOP' : 'GESLUIT'}
            </h3>
            <p style={{ margin: '0', color: '#ffffff' }}>
              {roundStatus?.is_open 
                ? 'Rondte is oop vir merk' 
                : 'Rondte is gesluit'
              }
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleOpenRound}
              disabled={roundStatus?.is_open || loading}
              style={{
                padding: '10px 20px',
                backgroundColor: !roundStatus?.is_open && !loading ? '#28a745' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: !roundStatus?.is_open && !loading ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: 'bold',
                opacity: !roundStatus?.is_open && !loading ? 1 : 0.6
              }}
            >
              {loading ? 'Maak Oop...' : 'Maak Rondte Oop'}
            </button>
            
            <button
              onClick={handleCloseRound}
              disabled={!roundStatus?.is_open || loading}
              style={{
                padding: '10px 20px',
                backgroundColor: roundStatus?.is_open && !loading ? '#dc3545' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: roundStatus?.is_open && !loading ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: 'bold',
                opacity: roundStatus?.is_open && !loading ? 1 : 0.6
              }}
            >
              {loading ? 'Sluit...' : 'Sluit Rondte'}
            </button>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div style={{
            backgroundColor: '#0e1e3b',
            color: '#ffffff',
            padding: '15px',
            marginBottom: '20px'
          }}>
            {message}
          </div>
        )}

        {/* Assignment Management Section */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          marginBottom: '20px',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: '0', color: '#0e1e3b' }}>Toewysing Bestuur</h3>
            <button
              onClick={() => setShowAssignmentModal(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#0e1e3b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Beheer Toewysings
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Team Assignments Summary */}
            <div>
              <h4 style={{ margin: '0 0 10px 0', color: '#0e1e3b' }}>Span Toewysings</h4>
              {Object.keys(teamAssignments).length > 0 ? (
                <div style={{ fontSize: '14px' }}>
                  {Object.entries(teamAssignments).map(([teamId, beoordelaarId]) => {
                    const beoordelaar = beoordelaars.find(b => b.user_id === beoordelaarId);
                    return (
                      <div key={teamId} style={{ marginBottom: '5px', padding: '5px', backgroundColor: 'white', borderRadius: '4px' }}>
                        <strong>Span {teamId}</strong> → {beoordelaar?.email}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: '#666', fontSize: '14px' }}>Geen span toewysings nie</p>
              )}
            </div>
            
            {/* Criteria Assignments Summary */}
            <div>
              <h4 style={{ margin: '0 0 10px 0', color: '#0e1e3b' }}>Kriteria Toewysings</h4>
              {Object.keys(criteriaAssignments).length > 0 ? (
                <div style={{ fontSize: '14px' }}>
                  {Object.entries(criteriaAssignments).map(([kriteriaId, beoordelaarId]) => {
                    const kriteriaItem = kriteria.find(k => k.kriteria_id === kriteriaId);
                    const beoordelaar = beoordelaars.find(b => b.user_id === beoordelaarId);
                    return (
                      <div key={kriteriaId} style={{ marginBottom: '5px', padding: '5px', backgroundColor: 'white', borderRadius: '4px' }}>
                        <strong>{kriteriaItem?.beskrywing}</strong> → {beoordelaar?.email}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: '#666', fontSize: '14px' }}>Geen kriteria toewysings nie</p>
              )}
            </div>
          </div>
        </div>

        <ul>
        <li>Maak rondtes oop en toe</li>
        <li>Ken spane aan beoordelaars toe</li>
        <li>Ken kriteria aan beoordelaars toe</li>
        <li>Kies die kriteria vir 'n rondte</li>
        <li>Sien die punte soos dit tans staan</li>
        <li>Vertoon die wenspan</li>
      </ul>

      {/* Main Content Grid */}
      <div className="admin-layout">
        {/* Kriteria Management Section */}
        <div className="admin-section">
          <h2 className="text-xl font-semibold text-gray-800">Kriteria Bestuur</h2>
          <MerkbladKriteriaManager 
            rondteId={rondteId} 
            onKriteriaUpdated={handleKriteriaUpdated}
          />
        </div>

        {/* Span Scores Section */}
        <div className="admin-section">
          <h2 className="text-xl font-semibold text-gray-800">Span Punte</h2>
          <SpanScores rondteId={rondteId} refreshKey={refreshKey} />
        </div>
      </div>

      <style>{`
        .admin-layout {
          display: flex;
          flex-direction: row;
          gap: 2rem;
          margin-top: 2rem;
          align-items: flex-start;
        }
        
        .admin-section {
          width: 40%;
          min-width: 300px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        @media (max-width: 1500px) {
          .admin-layout {
            flex-direction: column;
          }
          
          .admin-section {
            width: 100%;
            min-width: auto;
          }
        }
      `}</style>

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#0e1e3b' }}>Beheer Toewysings</h2>
            
            {/* Team Assignments */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#0e1e3b' }}>Span Toewysings</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                <p style={{ color: '#666', fontStyle: 'italic' }}>
                  Gebruik die "Nuwe Rondte Bestuur" weergawe vir volledige span bestuur.
                </p>
              </div>
            </div>
            
            {/* Criteria Assignments */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#0e1e3b' }}>Kriteria Toewysings</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {kriteria.map(kriteriaItem => (
                  <div key={kriteriaItem.kriteria_id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #dee2e6'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>{kriteriaItem.beskrywing}</span>
                    <select
                      value={criteriaAssignments[kriteriaItem.kriteria_id] || ''}
                      onChange={(e) => handleCriteriaAssignment(kriteriaItem.kriteria_id, parseInt(e.target.value))}
                      style={{
                        padding: '5px 10px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        minWidth: '150px'
                      }}
                    >
                      <option value="">Kies Beoordelaar</option>
                      {beoordelaars.map(beoordelaar => (
                        <option key={beoordelaar.user_id} value={beoordelaar.user_id}>
                          {beoordelaar.email}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowAssignmentModal(false)}
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
                onClick={handleSaveAssignments}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#0e1e3b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Stoor Toewysings
              </button>
            </div>
          </div>
        </div>
      )}
          </>
        )}

    </div>
    
  );
}

export default BeoordelaarAdmin;
