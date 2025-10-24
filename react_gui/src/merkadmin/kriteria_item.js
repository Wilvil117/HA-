import React, { useState, useEffect } from 'react';

function KriteriaItem({ kriteria, onKriteriaUpdated, onKriteriaDeleted, onCancel }) {
  const [editKriteria, setEditKriteria] = useState({
    beskrywing: '',
    default_totaal: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (kriteria) {
      setEditKriteria({
        beskrywing: kriteria.beskrywing || '',
        default_totaal: kriteria.default_totaal || 0
      });
    }
  }, [kriteria]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditKriteria(prev => ({
      ...prev,
      [name]: name === 'default_totaal' ? parseFloat(value) || 0 : value
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editKriteria.beskrywing.trim()) {
      alert('Beskrywing is verpligtend');
      return;
    }

    if (editKriteria.default_totaal < 0) {
      alert('Default totaal moet 0 of meer wees');
      return;
    }

    setIsSubmitting(true);
    try {
      await onKriteriaUpdated(kriteria.kriteria_id, editKriteria);
    } catch (error) {
      alert(`Fout: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await onKriteriaDeleted(kriteria.kriteria_id);
    } catch (error) {
      alert(`Fout: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditKriteria({
      beskrywing: kriteria.beskrywing || '',
      default_totaal: kriteria.default_totaal || 0
    });
    setShowDeleteConfirm(false);
    onCancel();
  };

  if (!kriteria) return null;

  return (
    <div className="kriteria-item" style={{
      marginTop: '1rem',
      padding: '1rem',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h4>Wysig Kriteria: {kriteria.beskrywing}</h4>
      
      {!showDeleteConfirm ? (
        <form onSubmit={handleUpdate}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="edit-beskrywing" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Beskrywing *
            </label>
            <input
              type="text"
              id="edit-beskrywing"
              name="beskrywing"
              value={editKriteria.beskrywing}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="Voer kriteria beskrywing in"
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="edit-default-totaal" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Default Totaal *
            </label>
            <input
              type="number"
              id="edit-default-totaal"
              name="default_totaal"
              value={editKriteria.default_totaal}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="0.00"
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
                aria-label="Verwyder Kriteria"
                title="Verwyder Kriteria"
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
            Is jy seker jy wil <strong>{kriteria.beskrywing}</strong> verwyder? 
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

export default KriteriaItem;
