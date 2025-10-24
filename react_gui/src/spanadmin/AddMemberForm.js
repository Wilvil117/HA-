import React, { useState } from 'react';

function AddMemberForm({ teamId, onMemberAdded, onCancel }) {
  const [newMember, setNewMember] = useState({
    naam: '',
    bio: '',
    foto: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMember(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMember.naam.trim()) {
      alert('Naam is verpligtend');
      return;
    }

    setIsSubmitting(true);
    try {
      await onMemberAdded(teamId, newMember);
      setNewMember({ naam: '', bio: '', foto: '' });
    } catch (error) {
      alert(`Fout: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setNewMember({ naam: '', bio: '', foto: '' });
    onCancel();
  };

  return (
    <div className="add-member-form" style={{
      marginTop: '1rem',
      padding: '1rem',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h4>Voeg nuwe lid by</h4>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="naam" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Naam *
          </label>
          <input
            type="text"
            id="naam"
            name="naam"
            value={newMember.naam}
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
          <label htmlFor="bio" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            value={newMember.bio}
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
          <label htmlFor="foto" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Foto URL
          </label>
          <input
            type="url"
            id="foto"
            name="foto"
            value={newMember.foto}
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
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
            {isSubmitting ? 'Voeg by...' : 'Voeg lid by'}
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
        </div>
      </form>
    </div>
  );
}

export default AddMemberForm;
