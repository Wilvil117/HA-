
import React, { useState, useEffect } from 'react';
import Span from './span';
import AddTeamForm from './AddTeamForm';
import { fetchAllTeamsWithMembers, addTeamMember, updateTeamMember, deleteTeamMember, updateTeam, deleteTeam, createTeam } from '../services/span_services';

function SpanAdmin() {
  const [teamsData, setTeamsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleMemberAdded = async (teamId, memberData) => {
    try {
      await addTeamMember(teamId, memberData);
      // Refresh the teams data to show the new member
      const updatedData = await fetchAllTeamsWithMembers();
      setTeamsData(updatedData);
    } catch (error) {
      console.error('Error adding team member:', error);
      throw error;
    }
  };

  const handleMemberUpdated = async (teamId, memberId, memberData) => {
    try {
      await updateTeamMember(teamId, memberId, memberData);
      // Refresh the teams data to show the updated member
      const updatedData = await fetchAllTeamsWithMembers();
      setTeamsData(updatedData);
    } catch (error) {
      console.error('Error updating team member:', error);
      throw error;
    }
  };

  const handleMemberDeleted = async (teamId, memberId) => {
    try {
      await deleteTeamMember(teamId, memberId);
      // Refresh the teams data to remove the deleted member
      const updatedData = await fetchAllTeamsWithMembers();
      setTeamsData(updatedData);
    } catch (error) {
      console.error('Error deleting team member:', error);
      throw error;
    }
  };

  const handleTeamUpdated = async (teamId, teamData) => {
    try {
      await updateTeam(teamId, teamData);
      // Refresh the teams data to show the updated team
      const updatedData = await fetchAllTeamsWithMembers();
      setTeamsData(updatedData);
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  };

  const handleTeamDeleted = async (teamId) => {
    try {
      await deleteTeam(teamId);
      // Refresh the teams data to remove the deleted team
      const updatedData = await fetchAllTeamsWithMembers();
      setTeamsData(updatedData);
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  };

  const handleTeamAdded = async (teamData) => {
    try {
      await createTeam(teamData);
      // Refresh the teams data to show the new team
      const updatedData = await fetchAllTeamsWithMembers();
      setTeamsData(updatedData);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding team:', error);
      throw error;
    }
  };

  useEffect(() => {
    const loadTeamsData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAllTeamsWithMembers();
        setTeamsData(data);
      } catch (err) {
        setError(err.message);
        console.error('Error loading teams data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTeamsData();
  }, []);

  if (loading) {
    return (
      <div>
        <h1>Welkom by die Span Admin bladsy.</h1>
        <div>Laai spanne...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Welkom by die Span Admin bladsy.</h1>
        <div className="error">Fout: {error}</div>
      </div>
    );
  }

  return (
    <div>
      <h1>Welkom by die Span Admin bladsy.</h1>
      
      <div className="teams-container">
        <div className="teams-header">
          <h2>Alle Spanne ({teamsData.length})</h2>
          <button
                  style={{
                    marginLeft: '1rem',
                    padding: '0.5em 1em',
                    fontSize: '1em',
                    background: '#0e1e3b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowAddForm(true)}
                >
                  Nuwe span
                </button>
        </div>
        {showAddForm && (
          <AddTeamForm 
            onTeamAdded={handleTeamAdded}
            onCancel={() => setShowAddForm(false)}
          />
        )}
        {teamsData.length === 0 ? (
          <p>Geen spanne gevind nie.</p>
        ) : (
          teamsData.map(({ team, members }) => (
            <div key={team.span_id} className="team-section">
              <Span 
                team={team} 
                members={members} 
                onMemberAdded={handleMemberAdded}
                onMemberUpdated={handleMemberUpdated}
                onMemberDeleted={handleMemberDeleted}
                onTeamUpdated={handleTeamUpdated}
                onTeamDeleted={handleTeamDeleted}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SpanAdmin;
