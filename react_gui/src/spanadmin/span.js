import React, { useState } from 'react';
import AddMemberForm from './AddMemberForm';
import MemberEditForm from './MemberEditForm';
import './span.css';

function Span({ team, members = [], onMemberAdded, onMemberUpdated, onMemberDeleted, onTeamUpdated, onTeamDeleted }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [showMembers, setShowMembers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleMemberAdded = async (teamId, memberData) => {
    await onMemberAdded(teamId, memberData);
    setShowAddForm(false);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
  };

  const handleMemberClick = (member) => {
    setSelectedMember(member);
    setShowAddForm(false); // Close add form if open
  };

  const handleMemberUpdated = async (teamId, memberId, memberData) => {
    await onMemberUpdated(teamId, memberId, memberData);
    setSelectedMember(null);
  };

  const handleMemberDeleted = async (teamId, memberId) => {
    await onMemberDeleted(teamId, memberId);
    setSelectedMember(null);
  };

  const handleCancelEdit = () => {
    setSelectedMember(null);
  };

  const handleEditField = (fieldName, currentValue) => {
    setEditingField(fieldName);
    setEditValues({ ...editValues, [fieldName]: currentValue });
  };

  const handleSaveField = async (fieldName) => {
    if (onTeamUpdated && editValues[fieldName] !== undefined) {
      // Merge current team info with updated field; send the full team object along with the changed field
      await onTeamUpdated(team.span_id, { ...team, [fieldName]: editValues[fieldName] });
    }
    setEditingField(null);
    setEditValues({});
  };

  const handleCancelFieldEdit = () => {
    setEditingField(null);
    setEditValues({});
  };

  const handleInputChange = (fieldName, value) => {
    setEditValues({ ...editValues, [fieldName]: value });
  };

  const handleConfirmDelete = async () => {
    if (onTeamDeleted) {
      await onTeamDeleted(team.span_id);
    }
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleShowDeleteConfirm = () => {
    setShowDeleteConfirm(true);
  };

  const toggleMembersVisibility = () => {
    setShowMembers(!showMembers);
  };

  if (!team) {
    return (
      <div className="span-container">
        <div className="error">Geen span inligting beskikbaar nie</div>
      </div>
    );
  }

  return (
    <div className="span-container">
      {team && (
        <div className="team-card">
          <div className="team-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="team-info" style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editingField === 'naam' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <input
                      type="text"
                      value={editValues.naam || ''}
                      onChange={(e) => handleInputChange('naam', e.target.value)}
                      style={{ flex: 1, padding: '4px 8px', fontSize: '1.5em', fontWeight: 'bold' }}
                    />
                    <button onClick={() => handleSaveField('naam')} style={{ color: '#ffffff', background: 'none', border: 'none', cursor: 'pointer' }}>Stoor</button>
                    <button onClick={handleCancelFieldEdit} style={{ color: '#77502d', background: 'none', border: 'none', cursor: 'pointer' }}>Kanselleer</button>
                  </div>
                  
                ) : (
                  <>
                    <h2 className="team-name">{team.naam}</h2>
                    <span 
                      onClick={() => handleEditField('naam', team.naam)}
                      style={{ color: 'white', cursor: 'pointer', fontSize: '1.2em' }}
                      title="Wysig naam"
                    >
                      <svg width="1em" height="1em" viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                        <path d="M2 13.5V14H2.5L12.876 3.624a.5.5 0 0 0 0-.707l-2.793-2.793a.5.5 0 0 0-.707 0L2 10.793V13.5zM13.854 3.146a1.5 1.5 0 0 0 0-2.121l-1.879-1.879a1.5 1.5 0 0 0-2.121 0l-.829.829 3.999 3.999.83-.828z" stroke="white" strokeWidth="1.1" fill="none"/>
                      </svg>
                    </span>
                  </>
                )}

                
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editingField === 'projek_beskrywing' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <textarea
                      value={editValues.projek_beskrywing || ''}
                      onChange={(e) => handleInputChange('projek_beskrywing', e.target.value)}
                      style={{ flex: 1, padding: '4px 8px', fontSize: '1em', minHeight: '60px', resize: 'vertical' }}
                    />
                    <button onClick={() => handleSaveField('projek_beskrywing')} style={{ color: '#ffffff', background: 'none', border: 'none', cursor: 'pointer' }}>Stoor</button>
                    <button onClick={handleCancelFieldEdit} style={{ color: '#77502d', background: 'none', border: 'none', cursor: 'pointer' }}>Kanselleer</button>
                  </div>
                ) : (
                  <>
                    <p className="team-description">{team.projek_beskrywing}</p>
                    <span 
                      onClick={() => handleEditField('projek_beskrywing', team.projek_beskrywing)}
                      style={{ color: 'white', cursor: 'pointer', fontSize: '1.2em' }}
                      title="Wysig projek beskrywing"
                    >
                      <svg width="1em" height="1em" viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                        <path d="M2 13.5V14H2.5L12.876 3.624a.5.5 0 0 0 0-.707l-2.793-2.793a.5.5 0 0 0-.707 0L2 10.793V13.5zM13.854 3.146a1.5 1.5 0 0 0 0-2.121l-1.879-1.879a1.5 1.5 0 0 0-2.121 0l-.829.829 3.999 3.999.83-.828z" stroke="white" strokeWidth="1.1" fill="none"/>
                      </svg>
                    </span>
                  </>
                )}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editingField === 'span_bio' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <textarea
                      value={editValues.span_bio || ''}
                      onChange={(e) => handleInputChange('span_bio', e.target.value)}
                      style={{ flex: 1, padding: '4px 8px', fontSize: '1em', minHeight: '60px', resize: 'vertical' }}
                    />
                    <button onClick={() => handleSaveField('span_bio')} style={{ color: '#ffffff', background: 'none', border: 'none', cursor: 'pointer' }}>Stoor</button>
                    <button onClick={handleCancelFieldEdit} style={{ color: '#77502d', background: 'none', border: 'none', cursor: 'pointer' }}>Kanselleer</button>
                  </div>
                ) : (
                  <>
                    <p className="team-bio">{team.span_bio}</p>
                    <span 
                      onClick={() => handleEditField('span_bio', team.span_bio)}
                      style={{ color: 'white', cursor: 'pointer', fontSize: '1.2em' }}
                      title="Wysig span bio"
                    >
                      <svg width="1em" height="1em" viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                        <path d="M2 13.5V14H2.5L12.876 3.624a.5.5 0 0 0 0-.707l-2.793-2.793a.5.5 0 0 0-.707 0L2 10.793V13.5zM13.854 3.146a1.5 1.5 0 0 0 0-2.121l-1.879-1.879a1.5 1.5 0 0 0-2.121 0l-.829.829 3.999 3.999.83-.828z" stroke="white" strokeWidth="1.1" fill="none"/>
                      </svg>
                    </span>
                  </>
                )}
              </div>
            </div>
            
            <div style={{ marginLeft: '1rem' }}>
              {showDeleteConfirm ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={handleConfirmDelete}
                    style={{
                      background: '#0e1e3b',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '0.8em',
                      transition: 'background-color 0.2s ease'
                    }}
                    title="Bevestig skrap"
                  >
                    Bevestig
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    style={{
                      background: '#77502d',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '0.8em',
                      transition: 'background-color 0.2s ease'
                    }}
                    title="Kanselleer skrap"
                  >
                    Kanselleer
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleShowDeleteConfirm}
                  style={{
                    background: '#77502d',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    color: '#ffffff',
                    transition: 'background-color 0.2s ease'
                  }}
                  title="Skrap span"
                >
                  <svg width="1.2em" height="1.2em" viewBox="0 0 20 20" fill="none" style={{ display: 'block' }}>
                    <path d="M6 8.5V15M10 8.5V15M14 8.5V15M3 5.5H17M8.5 2.5H11.5C12.0523 2.5 12.5 2.94772 12.5 3.5V4.5H7.5V3.5C7.5 2.94772 7.94772 2.5 8.5 2.5ZM16.5 5.5V17C16.5 17.5523 16.0523 18 15.5 18H4.5C3.94772 18 3.5 17.5523 3.5 17V5.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="members-section">
            <div className="members-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 
                style={{ 
                  margin: 0, 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  userSelect: 'none'
                }}
                onClick={toggleMembersVisibility}
                title={showMembers ? "Klik om lede te versteek" : "Klik om lede te wys"}
              >
                <span style={{ 
                  transform: showMembers ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  fontSize: '0.8em'
                }}>
                  ▶
                </span>
                Span Lede ({members.length})
              </h3>
              {showMembers && (
                <button
                  className="add-member-btn"
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
                  Nuwe lid
                </button>
              )}
            </div>
            {showMembers && (
              <div className="members-grid">
              {members.map((member) => (
                <div 
                  key={member.lid_id} 
                  className="member-card"
                  onClick={() => handleMemberClick(member)}
                  style={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="member-avatar">
                    {member.foto ? (
                      <img src={member.foto} alt={member.naam} />
                    ) : (
                      <div className="default-avatar">
                        {member.naam.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="member-info">
                    <h4 className="member-name">{member.naam}</h4>
                    <p className="member-bio">{member.bio}</p>
                    <small style={{ color: '#666', fontSize: '0.8em' }}>
                      Klik om te wysig
                    </small>
                  </div>
                </div>
              ))}
              </div>
            )}
            
            {showAddForm && (
              <AddMemberForm
                teamId={team.span_id}
                onMemberAdded={handleMemberAdded}
                onCancel={handleCancelForm}
              />
            )}
            
            {selectedMember && (
              <MemberEditForm
                member={selectedMember}
                teamId={team.span_id}
                onMemberUpdated={handleMemberUpdated}
                onMemberDeleted={handleMemberDeleted}
                onCancel={handleCancelEdit}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Span;
