import React, { useState, useEffect } from 'react';

function SubCriteriaManager({ kriteria, onSave, onCancel, isVisible }) {
  const [subCriteria, setSubCriteria] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newSubCriteria, setNewSubCriteria] = useState({
    name: '',
    maxPoints: 0,
    description: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);

  // Initialize sub-criteria when component mounts or kriteria changes
  useEffect(() => {
    if (kriteria) {
      // Load existing sub-criteria from localStorage or initialize with defaults
      const savedSubCriteria = localStorage.getItem(`subcriteria_${kriteria.kriteria_id}`);
      if (savedSubCriteria) {
        setSubCriteria(JSON.parse(savedSubCriteria));
      } else {
        // Initialize with default sub-criteria based on category
        const defaultSubCriteria = getDefaultSubCriteria(kriteria.beskrywing);
        setSubCriteria(defaultSubCriteria);
      }
    }
  }, [kriteria]);

  const getDefaultSubCriteria = (categoryName) => {
    const defaults = {
      'Backend Development': [
        { name: 'API Functionality', maxPoints: 25, description: 'RESTful API design, endpoints, and functionality' },
        { name: 'Authentication & Security', maxPoints: 25, description: 'User authentication, authorization, and security measures' },
        { name: 'Error Handling', maxPoints: 20, description: 'Proper error handling, logging, and user feedback' },
        { name: 'Code Organization & Documentation', maxPoints: 15, description: 'Clean code structure, comments, and documentation' },
        { name: 'Integration with Frontend', maxPoints: 15, description: 'Seamless frontend-backend communication' }
      ],
      'Frontend Development': [
        { name: 'User Interface Design', maxPoints: 30, description: 'Visual design, layout, and user experience' },
        { name: 'Responsive Design', maxPoints: 20, description: 'Mobile and desktop compatibility' },
        { name: 'Component Architecture', maxPoints: 25, description: 'Reusable components and code organization' },
        { name: 'State Management', maxPoints: 15, description: 'Efficient state handling and data flow' },
        { name: 'Performance Optimization', maxPoints: 10, description: 'Loading speed and resource optimization' }
      ],
      'Database Design': [
        { name: 'Data Modeling', maxPoints: 30, description: 'Entity relationships and data structure design' },
        { name: 'Query Optimization', maxPoints: 25, description: 'Efficient database queries and indexing' },
        { name: 'Data Integrity', maxPoints: 20, description: 'Constraints, validation, and data consistency' },
        { name: 'Scalability', maxPoints: 15, description: 'Database design for growth and performance' },
        { name: 'Documentation', maxPoints: 10, description: 'Database schema documentation and comments' }
      ],
      'Supabase DB': [
        { name: 'Real-time Features', maxPoints: 2000, description: 'Real-time subscriptions and live updates' },
        { name: 'Authentication Integration', maxPoints: 2000, description: 'Supabase Auth implementation and user management' },
        { name: 'Row Level Security', maxPoints: 2000, description: 'RLS policies and security implementation' },
        { name: 'Edge Functions', maxPoints: 2000, description: 'Serverless functions and edge computing' },
        { name: 'Database Performance', maxPoints: 1001, description: 'Query performance and optimization' }
      ]
    };
    return defaults[categoryName] || [];
  };

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

    const updatedSubCriteria = [...subCriteria, { ...newSubCriteria }];
    setSubCriteria(updatedSubCriteria);
    setNewSubCriteria({ name: '', maxPoints: 0, description: '' });
    setShowAddForm(false);
  };

  const handleEditSubCriteria = (index) => {
    setEditingIndex(index);
  };

  const handleUpdateSubCriteria = (index, updatedData) => {
    const updatedSubCriteria = [...subCriteria];
    updatedSubCriteria[index] = { ...updatedSubCriteria[index], ...updatedData };
    setSubCriteria(updatedSubCriteria);
    setEditingIndex(null);
  };

  const handleDeleteSubCriteria = (index) => {
    if (window.confirm('Is jy seker jy wil hierdie sub-kriteria verwyder?')) {
      const updatedSubCriteria = subCriteria.filter((_, i) => i !== index);
      setSubCriteria(updatedSubCriteria);
    }
  };

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem(`subcriteria_${kriteria.kriteria_id}`, JSON.stringify(subCriteria));
    
    // Calculate total points
    const totalPoints = subCriteria.reduce((sum, sub) => sum + sub.maxPoints, 0);
    
    onSave({
      kriteriaId: kriteria.kriteria_id,
      subCriteria: subCriteria,
      totalPoints: totalPoints
    });
  };

  const calculateTotalPoints = () => {
    return subCriteria.reduce((sum, sub) => sum + sub.maxPoints, 0);
  };

  if (!isVisible || !kriteria) return null;

  return (
    <div style={{
      marginTop: '1rem',
      padding: '1.5rem',
      border: '2px solid #0e1e3b',
      borderRadius: '12px',
      backgroundColor: '#f8f9fa',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '2px solid #0e1e3b'
      }}>
        <div>
          <h3 style={{ 
            margin: '0 0 0.5rem 0', 
            color: '#0e1e3b',
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}>
            Sub-kriteria Beheer: {kriteria.beskrywing}
          </h3>
          <p style={{ 
            margin: '0', 
            color: '#666',
            fontSize: '1rem'
          }}>
            Totaal Punte: <strong>{calculateTotalPoints()}</strong>
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#0e1e3b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold'
          }}
        >
          {showAddForm ? 'Kanselleer' : 'Voeg Sub-kriteria By'}
        </button>
      </div>

      {/* Add New Sub-criteria Form */}
      {showAddForm && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: 'white'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#0e1e3b' }}>Voeg Nuwe Sub-kriteria By</h4>
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
                  backgroundColor: '#0e1e3b',
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
                onClick={() => {
                  setShowAddForm(false);
                  setNewSubCriteria({ name: '', maxPoints: 0, description: '' });
                }}
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

      {/* Sub-criteria List */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#0e1e3b', marginBottom: '1rem' }}>Sub-kriteria ({subCriteria.length}):</h4>
        {subCriteria.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#666',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            Geen sub-kriteria nie. Voeg die eerste een by hierbo.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {subCriteria.map((sub, index) => (
              <div key={index} style={{
                padding: '1rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: 'white'
              }}>
                {editingIndex === index ? (
                  <EditSubCriteriaForm
                    subCriteria={sub}
                    onSave={(updatedData) => handleUpdateSubCriteria(index, updatedData)}
                    onCancel={() => setEditingIndex(null)}
                  />
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h5 style={{ margin: '0 0 0.5rem 0', color: '#0e1e3b' }}>
                        {sub.name} ({sub.maxPoints} punte)
                      </h5>
                      <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
                        {sub.description}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                      <button
                        onClick={() => handleEditSubCriteria(index)}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#0e1e3b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Wysig
                      </button>
                      <button
                        onClick={() => handleDeleteSubCriteria(index)}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Verwyder
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#77502d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          Kanselleer
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#0e1e3b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          Stoor Sub-kriteria
        </button>
      </div>
    </div>
  );
}

// Edit Sub-criteria Form Component
function EditSubCriteriaForm({ subCriteria, onSave, onCancel }) {
  const [editData, setEditData] = useState({
    name: subCriteria.name,
    maxPoints: subCriteria.maxPoints,
    description: subCriteria.description
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!editData.name.trim()) {
      alert('Naam is verpligtend');
      return;
    }
    if (editData.maxPoints <= 0) {
      alert('Maksimum punte moet groter as 0 wees');
      return;
    }
    onSave(editData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Naam *
          </label>
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Maksimum Punte *
          </label>
          <input
            type="number"
            min="1"
            value={editData.maxPoints}
            onChange={(e) => setEditData(prev => ({ ...prev, maxPoints: parseInt(e.target.value) || 0 }))}
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
        </div>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Beskrywing
        </label>
        <textarea
          value={editData.description}
          onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '1rem',
            minHeight: '60px'
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="submit"
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#0e1e3b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Stoor
        </button>
        <button
          type="button"
          onClick={onCancel}
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
  );
}

export default SubCriteriaManager;
