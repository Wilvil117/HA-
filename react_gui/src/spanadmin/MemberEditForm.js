import React, { useState, useEffect } from 'react';

function MemberEditForm({ member, teamId, onMemberUpdated, onMemberDeleted, onCancel }) {
  const [editMember, setEditMember] = useState({
    naam: '',
    bio: '',
    foto: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (member) {
      setEditMember({
        naam: member.naam || '',
        bio: member.bio || '',
        foto: member.foto || ''
      });
    }
  }, [member]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditMember(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editMember.naam.trim()) {
      alert('Naam is verpligtend');
      return;
    }

    setIsSubmitting(true);
    try {
      await onMemberUpdated(teamId, member.lid_id, editMember);
    } catch (error) {
      alert(`Fout: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await onMemberDeleted(teamId, member.lid_id);
    } catch (error) {
      alert(`Fout: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditMember({
      naam: member.naam || '',
      bio: member.bio || '',
      foto: member.foto || ''
    });
    setShowDeleteConfirm(false);
    onCancel();
  };

  if (!member) return null;

  return (
    <div className="member-edit-form" style={{
      marginTop: '1rem',
      padding: '1rem',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h4>Wysig Lid: {member.naam}</h4>
      
      {!showDeleteConfirm ? (
        <form onSubmit={handleUpdate}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="edit-naam" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Naam *
            </label>
            <input
              type="text"
              id="edit-naam"
              name="naam"
              value={editMember.naam}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="Voer lid naam in"
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="edit-bio" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Bio
            </label>
            <textarea
              id="edit-bio"
              name="bio"
              value={editMember.bio}
              onChange={handleInputChange}
              rows="3"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '1rem',
                resize: 'vertical'
              }}
              placeholder="Beskryf die lid se rol of vaardighede"
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="edit-foto" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Foto URL
            </label>
            <input
              type="url"
              id="edit-foto"
              name="foto"
              value={editMember.foto}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="https://example.com/foto.jpg"
            />
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#0e1e3b',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              {isSubmitting ? 'Stoor...' : 'Stoor Wysigings'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#77502d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              Kanselleer
            </button>
            <div style={{ marginLeft: 'auto' }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#77502d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="Verwyder Lid"
                title="Verwyder Lid"
              >
                {/* Dustbin Icon SVG */}
                <svg width="1.2em" height="1.2em" viewBox="0 0 20 20" fill="none" style={{ display: 'block' }}>
                  <path d="M6 8.5V15M10 8.5V15M14 8.5V15M3 5.5H17M8.5 2.5H11.5C12.0523 2.5 12.5 2.94772 12.5 3.5V4.5H7.5V3.5C7.5 2.94772 7.94772 2.5 8.5 2.5ZM16.5 5.5V17C16.5 17.5523 16.0523 18 15.5 18H4.5C3.94772 18 3.5 17.5523 3.5 17V5.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
          </div>
        </form>
      ) : (
        <div className="delete-confirmation">
          <h4 style={{ color: '#dc3545', marginBottom: '1rem' }}>
            Bevestig Verwydering
          </h4>
          <p style={{ marginBottom: '1rem' }}>
            Is jy seker jy wil <strong>{member.naam}</strong> van die span verwyder? 
            Hierdie aksie kan nie ongedaan gemaak word nie.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleDelete}
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#0e1e3b',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              {isSubmitting ? 'Verwyder...' : 'Ja, Verwyder'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#77502d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              Kanselleer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberEditForm;
