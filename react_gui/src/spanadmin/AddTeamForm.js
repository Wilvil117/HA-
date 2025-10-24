import React, { useState } from 'react';

function AddTeamForm({ onTeamAdded, onCancel }) {
  const [newTeam, setNewTeam] = useState({
    naam: '',
    projek_beskrywing:'',
    span_bio: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTeam(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTeam.naam.trim()) {
      alert('Naam is verpligtend');
      return;
    }

    setIsSubmitting(true);
    try {
      await onTeamAdded( newTeam);
      setNewTeam({ naam: '', projek_beskrywing: '', span_bio: '' });
    } catch (error) {
      alert(`Fout: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setNewTeam({ naam: '', projek_beskrywing: '', span_bio: '' });
    onCancel();
  };

  return (
    <div className="add-team-form" style={{
      marginTop: '1rem',
      padding: '1rem',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h4>Voeg nuwe span by</h4>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="naam" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Naam *
          </label>
          <input
            type="text"
            id="naam"
            name="naam"
            value={newTeam.naam}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
            placeholder="Voer span naam in"
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="projek_beskrywing" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Projek beskrywing
          </label>
          <textarea
            id="projek_beskrywing"
            name="projek_beskrywing"
            value={newTeam.projek_beskrywing}
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
            placeholder="Beskryf die span se projek"
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="span_bio" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Bio
          </label>
          <textarea
            id="span_bio"
            name="span_bio"
            value={newTeam.span_bio}
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
            placeholder="Beskryf die span"
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
            {isSubmitting ? 'Voeg by...' : 'Voeg span by'}
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

export default AddTeamForm;
