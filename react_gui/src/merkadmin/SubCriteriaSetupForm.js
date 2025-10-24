import React, { useState } from 'react';

function SubCriteriaSetupForm({ onAdd, onRemove, subCriteria, maxCount }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSubCriteria, setNewSubCriteria] = useState({
    name: '',
    maxPoints: 0,
    description: ''
  });

  const handleAddSubCriteria = (e) => {
    e.preventDefault();
    if (!newSubCriteria.name.trim()) {
      alert('Sub-kriteria naam is verpligtend');
      return;
    }
    if (newSubCriteria.maxPoints <= 0) {
      alert('Maksimum punte moet groter as 0 wees');
      return;
    }
    if (subCriteria.length >= maxCount) {
      alert(`Jy kan nie meer as ${maxCount} sub-kriteria byvoeg nie`);
      return;
    }

    onAdd(newSubCriteria);
    setNewSubCriteria({ name: '', maxPoints: 0, description: '' });
    setShowAddForm(false);
  };

  const handleCancelAdd = () => {
    setNewSubCriteria({ name: '', maxPoints: 0, description: '' });
    setShowAddForm(false);
  };

  const calculateTotalPoints = () => {
    return subCriteria.reduce((sum, sub) => sum + sub.maxPoints, 0);
  };

  return (
    <div>
      {/* Add New Sub-criteria Button */}
      {subCriteria.length < maxCount && (
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            {showAddForm ? 'Kanselleer' : 'Voeg Sub-kriteria By'}
          </button>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: 'white'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#0e1e3b' }}>
            Voeg Nuwe Sub-kriteria By ({subCriteria.length + 1} van {maxCount})
          </h4>
          <form onSubmit={handleAddSubCriteria}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Naam *
                </label>
                <input
                  type="text"
                  value={newSubCriteria.name}
                  onChange={(e) => setNewSubCriteria(prev => ({ ...prev, name: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                  placeholder="Sub-kriteria naam"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Maksimum Punte *
                </label>
                <input
                  type="number"
                  min="1"
                  value={newSubCriteria.maxPoints}
                  onChange={(e) => setNewSubCriteria(prev => ({ ...prev, maxPoints: parseInt(e.target.value) || 0 }))}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                  placeholder="0"
                />
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Beskrywing
              </label>
              <textarea
                value={newSubCriteria.description}
                onChange={(e) => setNewSubCriteria(prev => ({ ...prev, description: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  minHeight: '60px'
                }}
                placeholder="Beskrywing van die sub-kriteria"
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="submit"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Voeg By
              </button>
              <button
                type="button"
                onClick={handleCancelAdd}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#77502d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Kanselleer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Current Sub-criteria List */}
      {subCriteria.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ color: '#0e1e3b', marginBottom: '1rem' }}>
            Huidige Sub-kriteria ({subCriteria.length} van {maxCount})
          </h4>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {subCriteria.map((sub, index) => (
              <div key={index} style={{
                padding: '1rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div style={{ flex: 1 }}>
                  <h5 style={{ margin: '0 0 0.5rem 0', color: '#0e1e3b' }}>
                    {sub.name} ({sub.maxPoints} punte)
                  </h5>
                  <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
                    {sub.description}
                  </p>
                </div>
                <button
                  onClick={() => onRemove(index)}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    marginLeft: '1rem'
                  }}
                >
                  Verwyder
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total Points Display */}
      <div style={{
        backgroundColor: '#e3f2fd',
        padding: '1rem',
        borderRadius: '8px',
        border: '1px solid #2196f3',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#0e1e3b' }}>Kriteria Totaal Punte</h4>
            <p style={{ margin: '0', fontSize: '1.2rem', fontWeight: 'bold' }}>
              {calculateTotalPoints()} punte
            </p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
              Hierdie sal die kriteria se default totaal wees
            </p>
          </div>
          <div style={{
            padding: '0.5rem 1rem',
            backgroundColor: subCriteria.length === maxCount ? '#28a745' : '#ffc107',
            color: 'white',
            borderRadius: '6px',
            fontWeight: 'bold'
          }}>
            {subCriteria.length === maxCount ? 'Voltooi' : 'Gedeeltelik'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubCriteriaSetupForm;
