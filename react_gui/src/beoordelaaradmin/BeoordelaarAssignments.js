import React, { useState, useEffect } from 'react';
import { getAllKriteria } from '../services/kriteria_services';

function BeoordelaarAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [kriteria, setKriteria] = useState([]);

  useEffect(() => {
    // Load user data
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    if (storedUser) {
      loadAssignments();
      loadKriteria();
    }
  }, []);

  const loadKriteria = async () => {
    try {
      const kriteriaData = await getAllKriteria();
      setKriteria(kriteriaData);
    } catch (error) {
      console.error('Error loading kriteria:', error);
    }
  };

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setMessage('Please log in to view your assignments');
        return;
      }
      
      // Get active tournament
      const activeResponse = await fetch('http://localhost:4000/rounds/active', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!activeResponse.ok) {
        if (activeResponse.status === 404) {
          setMessage('No active tournament found. Please wait for an admin to start a tournament.');
          setAssignments([]);
          return;
        }
        throw new Error(`Server error: ${activeResponse.status}`);
      }
      
      const activeTournament = await activeResponse.json();
      
      if (!activeTournament) {
        setMessage('No active tournament found. Please wait for an admin to start a tournament.');
        setAssignments([]);
        return;
      }
      
      // Get my assignments for this tournament
      const assignmentsResponse = await fetch(`http://localhost:4000/rounds/${activeTournament.round_id}/tournament-matches/my-assignments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (assignmentsResponse.ok) {
        const myAssignments = await assignmentsResponse.json();
        setAssignments(myAssignments);
        if (myAssignments.length === 0) {
          setMessage('You have no assignments yet. Please wait for an admin to assign you to matches.');
        }
      } else {
        setAssignments([]);
        setMessage('No assignments found for you in this tournament.');
      }
      
    } catch (error) {
      console.error('Error loading assignments:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (isCompleted) => {
    return isCompleted ? '#28a745' : '#ffc107';
  };

  const getStatusText = (isCompleted) => {
    return isCompleted ? 'Completed' : 'Pending';
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h3>Please log in to view your assignments</h3>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '24px', marginBottom: '20px' }}>⏳</div>
        <h3>Loading your assignments...</h3>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📋</div>
        <h3>No Assignments Found</h3>
        <p style={{ color: '#666', fontSize: '16px' }}>
          You haven't been assigned to any matches yet. Contact your admin to get assigned.
        </p>
        <button 
          onClick={loadAssignments}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            marginTop: '20px'
          }}
        >
          🔄 Refresh Assignments
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        padding: '30px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '2px solid #e9ecef'
        }}>
          <div>
            <h2 style={{ 
              margin: '0 0 8px 0', 
              color: '#0e1e3b',
              fontSize: '1.8rem',
              fontWeight: 'bold'
            }}>
              🎯 My Tournament Assignments
            </h2>
            <p style={{ 
              margin: '0', 
              color: '#666', 
              fontSize: '16px' 
            }}>
              Welcome {user.email} - Here are your assigned matches
            </p>
          </div>
          <button 
            onClick={loadAssignments}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Kriteria Display */}
        {kriteria.length > 0 && (
          <div style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '30px',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{ 
              margin: '0 0 15px 0', 
              color: '#0e1e3b',
              fontSize: '1.3rem',
              fontWeight: 'bold'
            }}>
              📋 Marking Criteria
            </h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {kriteria.map((kriteria) => (
                <div key={kriteria.kriteria_id} style={{
                  padding: '12px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  border: '1px solid #dee2e6',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#0e1e3b', marginBottom: '4px' }}>
                      {kriteria.beskrywing}
                    </div>
                    <div style={{ color: '#666', fontSize: '14px' }}>
                      Max Score: {kriteria.totale_punte}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    backgroundColor: kriteria.is_active ? '#d4edda' : '#f8d7da',
                    color: kriteria.is_active ? '#155724' : '#721c24',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {kriteria.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {message && (
          <div style={{
            padding: '12px 20px',
            backgroundColor: message.includes('Error') ? '#f8d7da' : '#d4edda',
            color: message.includes('Error') ? '#721c24' : '#155724',
            borderRadius: '8px',
            marginBottom: '20px',
            border: `1px solid ${message.includes('Error') ? '#f5c6cb' : '#c3e6cb'}`
          }}>
            {message}
          </div>
        )}

        <div style={{ display: 'grid', gap: '20px' }}>
          {assignments.map((assignment, index) => (
            <div key={index} style={{
              padding: '25px',
              border: '2px solid #e9ecef',
              borderRadius: '12px',
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ 
                    margin: '0 0 8px 0', 
                    color: '#0e1e3b',
                    fontSize: '1.3rem',
                    fontWeight: 'bold'
                  }}>
                    🏆 {assignment.phase_name} - Match {assignment.match_id}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#666', fontSize: '14px' }}>Status:</span>
                    <span style={{ 
                      color: getStatusColor(assignment.is_completed),
                      fontWeight: 'bold',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      backgroundColor: assignment.is_completed ? '#d4edda' : '#fff3cd',
                      fontSize: '12px'
                    }}>
                      {getStatusText(assignment.is_completed)}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#495057', fontSize: '1.1rem' }}>
                    Team 1
                  </h4>
                  {assignment.team1_name ? (
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#0e1e3b', marginBottom: '5px' }}>
                        {assignment.team1_name}
                      </div>
                      <div style={{ color: '#666', fontSize: '14px' }}>
                        {assignment.team1_description || 'No description available'}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#6c757d', fontStyle: 'italic' }}>
                      No team assigned yet
                    </div>
                  )}
                </div>

                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#495057', fontSize: '1.1rem' }}>
                    Team 2
                  </h4>
                  {assignment.team2_name ? (
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#0e1e3b', marginBottom: '5px' }}>
                        {assignment.team2_name}
                      </div>
                      <div style={{ color: '#666', fontSize: '14px' }}>
                        {assignment.team2_description || 'No description available'}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#6c757d', fontStyle: 'italic' }}>
                      No team assigned yet
                    </div>
                  )}
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                paddingTop: '20px',
                borderTop: '1px solid #e9ecef'
              }}>
                <div style={{ color: '#666', fontSize: '14px' }}>
                  Judge: {assignment.judge_email}
                </div>
                <button 
                  onClick={() => {
                    // TODO: Navigate to scoring interface
                    alert('Scoring interface coming soon!');
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: assignment.is_completed ? '#6c757d' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: assignment.is_completed ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                  disabled={assignment.is_completed}
                >
                  {assignment.is_completed ? '✅ Completed' : '📝 Score Match'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BeoordelaarAssignments;
