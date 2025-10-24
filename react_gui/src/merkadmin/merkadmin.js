import React, { useState, useEffect } from 'react';
import KriteriaItem from './kriteria_item';
import DetailedKriteriaItem from './DetailedKriteriaItem';
import SubCriteriaManager from './SubCriteriaManager';
import SubCriteriaSetupForm from './SubCriteriaSetupForm';
import { getAllKriteria, createKriteria, updateKriteria, deleteKriteria } from '../services/kriteria_services';

function MerkAdmin() {
  const [kriteriaList, setKriteriaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingKriteria, setEditingKriteria] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKriteria, setNewKriteria] = useState({
    beskrywing: '',
    default_totaal: 0
  });
  const [showSubCriteriaSetup, setShowSubCriteriaSetup] = useState(false);
  const [newSubCriteria, setNewSubCriteria] = useState([]);
  const [subCriteriaCount, setSubCriteriaCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedKriteria, setExpandedKriteria] = useState(null);
  const [detailedScores, setDetailedScores] = useState({});
  const [showSubCriteriaManager, setShowSubCriteriaManager] = useState(false);
  const [subCriteriaData, setSubCriteriaData] = useState({});
  const [subCriteriaList, setSubCriteriaList] = useState([]);

  // Helper function to get default sub-criteria
  const getDefaultSubCriteria = () => [
    { id: 1, name: 'API Functionality', mark: 30 },
    { id: 2, name: 'Authentication & Security', mark: 25 },
    { id: 3, name: 'Error Handling', mark: 20 },
    { id: 4, name: 'Code Organization', mark: 15 },
    { id: 5, name: 'Integration', mark: 10 }
  ];

  // Load kriteria on component mount
  useEffect(() => {
    loadKriteria();
  }, []);

  const loadKriteria = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllKriteria();
      setKriteriaList(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKriteria = async (e) => {
    e.preventDefault();
    if (!newKriteria.beskrywing.trim()) {
      alert('Beskrywing is verpligtend');
      return;
    }

    if (newKriteria.default_totaal < 0) {
      alert('Default totaal moet 0 of meer wees');
      return;
    }

    // Validate sub-criteria if any exist
    if (subCriteriaList.length > 0) {
      const invalidSubCriteria = subCriteriaList.filter(sub => !sub.name.trim() || sub.mark <= 0);
      if (invalidSubCriteria.length > 0) {
        alert('Alle sub-kriteria moet \'n naam en positiewe puntwaarde hê');
        return;
      }
      
      // Check if total equals 100
      const total = calculateSubCriteriaTotal();
      if (total !== 100) {
        alert(`Die totaal van sub-kriteria moet presies 100 punte wees. Huidige totaal: ${total} punte`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Create kriteria with sub-criteria data
      const kriteriaData = {
        ...newKriteria,
        subCriteria: subCriteriaList.map(sub => ({
          name: sub.name,
          mark: sub.mark
        }))
      };
      
      const result = await createKriteria(kriteriaData);
      // Add the new kriteria to the list
      const createdKriteria = {
        kriteria_id: result.id,
        beskrywing: newKriteria.beskrywing,
        default_totaal: newKriteria.default_totaal
      };
      setKriteriaList(prev => [...prev, createdKriteria]);
      
      // Save sub-criteria to localStorage if any
      if (subCriteriaList.length > 0) {
        localStorage.setItem(`subcriteria_${result.id}`, JSON.stringify(subCriteriaList));
      }
      
      setNewKriteria({ beskrywing: '', default_totaal: 0 });
      setSubCriteriaList(getDefaultSubCriteria());
      setShowAddForm(false);
      
      // Show success message
      alert(`Kriteria suksesvol geskep!\n\nBeskrywing: ${newKriteria.beskrywing}\nTotaal Punte: ${newKriteria.default_totaal}${subCriteriaList.length > 0 ? `\nSub-kriteria: ${subCriteriaList.length} items` : ''}`);
    } catch (err) {
      alert(`Fout: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const createKriteriaWithSubCriteria = async (subCriteriaList = []) => {
    setIsSubmitting(true);
    try {
      // Calculate total points from sub-criteria
      const calculatedTotal = subCriteriaList.reduce((sum, sub) => sum + sub.maxPoints, 0);
      
      // Update the kriteria with calculated total
      const kriteriaToCreate = {
        ...newKriteria,
        default_totaal: calculatedTotal
      };
      
      const result = await createKriteria(kriteriaToCreate);
      // Add the new kriteria to the list
      const createdKriteria = {
        kriteria_id: result.id,
        beskrywing: kriteriaToCreate.beskrywing,
        default_totaal: kriteriaToCreate.default_totaal
      };
      setKriteriaList(prev => [...prev, createdKriteria]);
      
      // Save sub-criteria if any
      if (subCriteriaList.length > 0) {
        setSubCriteriaData(prev => ({
          ...prev,
          [result.id]: subCriteriaList
        }));
        localStorage.setItem(`subcriteria_${result.id}`, JSON.stringify(subCriteriaList));
      }
      
      setNewKriteria({ beskrywing: '', default_totaal: 0 });
      setShowAddForm(false);
      setShowSubCriteriaSetup(false);
      setNewSubCriteria([]);
      setSubCriteriaCount(0);
      
      // Show success message with calculated total
      if (subCriteriaList.length > 0) {
        alert(`Kriteria suksesvol geskep!\n\nBeskrywing: ${kriteriaToCreate.beskrywing}\nTotaal Punte: ${calculatedTotal} (bereken uit ${subCriteriaList.length} sub-kriteria)`);
      } else {
        alert(`Kriteria suksesvol geskep!\n\nBeskrywing: ${kriteriaToCreate.beskrywing}\nTotaal Punte: ${calculatedTotal}`);
      }
    } catch (err) {
      alert(`Fout: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKriteriaUpdated = async (kriteriaId, updatedData) => {
    try {
      await updateKriteria(kriteriaId, updatedData);
      // Update the kriteria in the list
      setKriteriaList(prev => 
        prev.map(kriteria => 
          kriteria.kriteria_id === kriteriaId 
            ? { ...kriteria, ...updatedData }
            : kriteria
        )
      );
      setEditingKriteria(null);
    } catch (err) {
      throw err;
    }
  };

  const handleKriteriaDeleted = async (kriteriaId) => {
    try {
      await deleteKriteria(kriteriaId);
      // Remove the kriteria from the list
      setKriteriaList(prev => 
        prev.filter(kriteria => kriteria.kriteria_id !== kriteriaId)
      );
      setEditingKriteria(null);
    } catch (err) {
      throw err;
    }
  };

  const handleEditKriteria = (kriteria) => {
    setEditingKriteria(kriteria);
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setEditingKriteria(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewKriteria(prev => ({
      ...prev,
      [name]: name === 'default_totaal' ? parseFloat(value) || 0 : value
    }));
  };

  const handleToggleDetailedView = (kriteria) => {
    if (expandedKriteria?.kriteria_id === kriteria.kriteria_id) {
      setExpandedKriteria(null);
    } else {
      setExpandedKriteria(kriteria);
      setEditingKriteria(null);
    }
  };

  const handleSaveDetailedScores = (scoresData) => {
    setDetailedScores(prev => ({
      ...prev,
      [scoresData.kriteriaId]: scoresData
    }));
    setExpandedKriteria(null);
    alert('Beoordeling suksesvol gestoor!');
  };

  const handleCancelDetailedView = () => {
    setExpandedKriteria(null);
  };

  const handleToggleSubCriteriaManager = (kriteria) => {
    if (showSubCriteriaManager && expandedKriteria?.kriteria_id === kriteria.kriteria_id) {
      setShowSubCriteriaManager(false);
      setExpandedKriteria(null);
    } else {
      setExpandedKriteria(kriteria);
      setShowSubCriteriaManager(true);
    }
  };

  const handleSaveSubCriteria = (data) => {
    setSubCriteriaData(prev => ({
      ...prev,
      [data.kriteriaId]: data.subCriteria
    }));
    setShowSubCriteriaManager(false);
    setExpandedKriteria(null);
    alert('Sub-kriteria suksesvol gestoor!');
  };

  const handleCancelSubCriteriaManager = () => {
    setShowSubCriteriaManager(false);
    setExpandedKriteria(null);
  };

  const handleAddSubCriteria = (subCriteria) => {
    setNewSubCriteria(prev => [...prev, subCriteria]);
  };

  const handleRemoveSubCriteria = (index) => {
    setNewSubCriteria(prev => prev.filter((_, i) => i !== index));
  };

  const handleFinishSubCriteriaSetup = async () => {
    if (newSubCriteria.length !== subCriteriaCount) {
      alert(`Jy moet ${subCriteriaCount} sub-kriteria byvoeg. Huidig: ${newSubCriteria.length}`);
      return;
    }
    await createKriteriaWithSubCriteria(newSubCriteria);
  };

  const handleCancelSubCriteriaSetup = () => {
    setShowSubCriteriaSetup(false);
    setNewSubCriteria([]);
    setSubCriteriaCount(0);
  };

  // Sub-criteria management functions
  const addSubCriteria = () => {
    const currentTotal = calculateSubCriteriaTotal();
    if (currentTotal >= 100) {
      alert('Jy kan nie meer sub-kriteria byvoeg nie - die totaal is reeds 100 punte!');
      return;
    }
    
    const newSub = {
      id: Date.now(), // Simple ID generation
      name: '',
      mark: 0
    };
    setSubCriteriaList(prev => [...prev, newSub]);
  };

  const updateSubCriteria = (id, field, value) => {
    setSubCriteriaList(prev => {
      const updated = prev.map(sub => 
        sub.id === id ? { ...sub, [field]: value } : sub
      );
      
      // If updating mark, ensure total doesn't exceed 100
      if (field === 'mark') {
        const total = updated.reduce((sum, sub) => sum + (parseFloat(sub.mark) || 0), 0);
        if (total > 100) {
          alert('Die totaal van alle sub-kriteria mag nie meer as 100 punte wees nie!');
          return prev; // Don't update if it would exceed 100
        }
      }
      
      return updated;
    });
  };

  const deleteSubCriteria = (id) => {
    if (window.confirm('Is jy seker jy wil hierdie sub-kriterium verwyder?')) {
      setSubCriteriaList(prev => prev.filter(sub => sub.id !== id));
    }
  };

  const calculateSubCriteriaTotal = () => {
    return subCriteriaList.reduce((total, sub) => total + (parseFloat(sub.mark) || 0), 0);
  };

  // Initialize sub-criteria when form opens
  useEffect(() => {
    if (showAddForm && subCriteriaList.length === 0) {
      setSubCriteriaList(getDefaultSubCriteria());
    }
  }, [showAddForm]);

  // Update total when sub-criteria change
  useEffect(() => {
    const total = calculateSubCriteriaTotal();
    if (subCriteriaList.length > 0) {
      setNewKriteria(prev => ({ ...prev, default_totaal: total }));
    }
  }, [subCriteriaList]);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#0e1e3b', marginBottom: '2rem' }}>
        Welkom by die Merk Admin bladsy
      </h1>
      
      {error && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          border: '1px solid #f5c6cb', 
          borderRadius: '4px', 
          marginBottom: '1rem' 
        }}>
          Fout: {error}
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            if (showAddForm) {
              setNewKriteria({ beskrywing: '', default_totaal: 0 });
              setSubCriteriaList(getDefaultSubCriteria());
            }
          }}
          disabled={editingKriteria !== null}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#0e1e3b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: editingKriteria ? 'not-allowed' : 'pointer',
            opacity: editingKriteria ? 0.6 : 1,
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          {showAddForm ? 'Kanselleer Nuwe Kriteria' : 'Skep Nuwe Kriteria'}
        </button>
      </div>

      {showAddForm && (
        <div style={{
          marginBottom: '2rem',
          padding: '1rem',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9'
        }}>
          <h3>Skep Nuwe Kriteria</h3>
          <form onSubmit={handleAddKriteria}>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="new-beskrywing" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Beskrywing *
              </label>
              <input
                type="text"
                id="new-beskrywing"
                name="beskrywing"
                value={newKriteria.beskrywing}
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
              <label htmlFor="new-default-totaal" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Default Totaal *
              </label>
              <input
                type="number"
                id="new-default-totaal"
                name="default_totaal"
                value={newKriteria.default_totaal}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                readOnly={subCriteriaList.length > 0}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  backgroundColor: subCriteriaList.length > 0 ? '#f8f9fa' : 'white',
                  color: subCriteriaList.length > 0 ? '#6c757d' : 'black'
                }}
                placeholder="0.00"
              />
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                Hierdie totaal word outomaties bereken uit die sub-kriteria hieronder
              </p>
            </div>

            {/* Sub-kriteria Section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: '0', color: '#0e1e3b' }}>
                  Sub-kriteria {subCriteriaList.length > 0 && `(${subCriteriaList.length})`}
                </h4>
                <button
                  type="button"
                  onClick={addSubCriteria}
                  disabled={calculateSubCriteriaTotal() >= 100}
                  style={{
                    padding: '0.4rem 0.8rem',
                    backgroundColor: calculateSubCriteriaTotal() >= 100 ? '#6c757d' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: calculateSubCriteriaTotal() >= 100 ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 'normal',
                    opacity: calculateSubCriteriaTotal() >= 100 ? 0.5 : 1
                  }}
                >
                  {calculateSubCriteriaTotal() >= 100 ? 'Maksimum Bereik' : '+ Voeg By'}
                </button>
              </div>
              
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#666', fontStyle: 'italic' }}>
                Sub-kriteria word outomaties bygevoeg. Wysig die name en punte soos nodig. Die totaal moet presies 100 punte wees.
              </p>

              {/* Sub-criteria List */}
              {subCriteriaList.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  {subCriteriaList.map((sub, index) => (
                    <div key={sub.id} style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center',
                      marginBottom: '0.5rem',
                      padding: '0.75rem',
                      backgroundColor: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '6px'
                    }}>
                      <div style={{ flex: '1' }}>
                        <input
                          type="text"
                          value={sub.name}
                          onChange={(e) => updateSubCriteria(sub.id, 'name', e.target.value)}
                          placeholder="Sub-kriterium naam"
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>
                      <div style={{ width: '120px' }}>
                        <input
                          type="number"
                          value={sub.mark}
                          onChange={(e) => updateSubCriteria(sub.id, 'mark', parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          step="0.5"
                          placeholder="Punte"
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteSubCriteria(sub.id)}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                        title="Verwyder sub-kriterium"
                      >
                        🗑
                      </button>
                    </div>
                  ))}
                  
                  {/* Total Display */}
                  <div style={{
                    backgroundColor: calculateSubCriteriaTotal() === 100 ? '#d4edda' : '#e3f2fd',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: calculateSubCriteriaTotal() === 100 ? '1px solid #28a745' : '1px solid #2196f3',
                    marginTop: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: '#0e1e3b' }}>Sub-kriteria Totaal:</span>
                      <span style={{ 
                        fontSize: '1.1rem', 
                        fontWeight: 'bold', 
                        color: calculateSubCriteriaTotal() === 100 ? '#28a745' : '#1976d2'
                      }}>
                        {calculateSubCriteriaTotal()} punte
                        {calculateSubCriteriaTotal() === 100 && ' ✓'}
                      </span>
                    </div>
                    {calculateSubCriteriaTotal() !== 100 && (
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: '#dc3545', 
                        marginTop: '0.25rem',
                        fontStyle: 'italic'
                      }}>
                        Totaal moet presies 100 punte wees
                      </div>
                    )}
                  </div>
                </div>
              )}
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
                {isSubmitting ? 'Skep...' : 'Skep Kriteria'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewKriteria({ beskrywing: '', default_totaal: 0 });
                  setSubCriteriaList(getDefaultSubCriteria());
                }}
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
      )}

      {/* Sub-criteria Setup for New Kriteria */}
      {showSubCriteriaSetup && (
        <div style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          border: '2px solid #28a745',
          borderRadius: '12px',
          backgroundColor: '#f8fff9'
        }}>
          <h3 style={{ color: '#0e1e3b', marginBottom: '1rem' }}>
            Voeg Sub-kriteria By vir: {newKriteria.beskrywing}
          </h3>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Jy moet {subCriteriaCount} sub-kriteria byvoeg. Huidig: {newSubCriteria.length}
          </p>
          <div style={{
            backgroundColor: '#fff3cd',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #ffeaa7',
            marginBottom: '1.5rem'
          }}>
            <p style={{ margin: '0', color: '#856404', fontWeight: 'bold' }}>
              ⚠️ Belangrik: Die kriteria se default totaal sal outomaties gestel word na die som van alle sub-kriteria punte.
            </p>
          </div>
          
          <SubCriteriaSetupForm
            onAdd={handleAddSubCriteria}
            onRemove={handleRemoveSubCriteria}
            subCriteria={newSubCriteria}
            maxCount={subCriteriaCount}
          />
          
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button
              onClick={handleCancelSubCriteriaSetup}
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
              onClick={handleFinishSubCriteriaSetup}
              disabled={isSubmitting}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              {isSubmitting ? 'Skep...' : 'Voltooi Kriteria'}
            </button>
          </div>
        </div>
      )}

      {editingKriteria && (
        <KriteriaItem
          kriteria={editingKriteria}
          onKriteriaUpdated={handleKriteriaUpdated}
          onKriteriaDeleted={handleKriteriaDeleted}
          onCancel={handleCancelEdit}
        />
      )}

      {expandedKriteria && showSubCriteriaManager && (
        <SubCriteriaManager
          kriteria={expandedKriteria}
          onSave={handleSaveSubCriteria}
          onCancel={handleCancelSubCriteriaManager}
          isVisible={true}
        />
      )}

      {expandedKriteria && !showSubCriteriaManager && (
        <DetailedKriteriaItem
          kriteria={expandedKriteria}
          onSave={handleSaveDetailedScores}
          onCancel={handleCancelDetailedView}
          isExpanded={true}
          onToggle={() => handleToggleDetailedView(expandedKriteria)}
          subCriteria={subCriteriaData[expandedKriteria.kriteria_id] || []}
        />
      )}

      {/* Saved Detailed Scores Display */}
      {Object.keys(detailedScores).length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#0e1e3b', marginBottom: '1rem' }}>
            Gestoor Beoordelings ({Object.keys(detailedScores).length})
          </h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {Object.values(detailedScores).map((scoreData, index) => {
              const kriteria = kriteriaList.find(k => k.kriteria_id === scoreData.kriteriaId);
              return (
                <div key={index} style={{
                  padding: '1rem',
                  border: '1px solid #4caf50',
                  borderRadius: '8px',
                  backgroundColor: '#f1f8e9'
                }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#0e1e3b' }}>
                    {kriteria?.beskrywing || 'Onbekende Kriteria'}
                  </h4>
                  <p style={{ margin: '0', color: '#666' }}>
                    Totaal: <strong>{scoreData.totalScore.toFixed(1)}</strong> / {scoreData.maxScore} punte
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 style={{ color: '#0e1e3b', marginBottom: '1rem' }}>
          Bestaande Kriteria ({kriteriaList.length})
        </h2>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Laai kriteria...
          </div>
        ) : kriteriaList.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            color: '#666',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            Geen kriteria gevind nie. Skep die eerste kriteria hierbo.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {kriteriaList.map(kriteria => (
              <div
                key={kriteria.kriteria_id}
                style={{
                  padding: '1rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: editingKriteria?.kriteria_id === kriteria.kriteria_id ? '#e3f2fd' : 'white',
                  cursor: editingKriteria?.kriteria_id === kriteria.kriteria_id ? 'default' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onClick={() => editingKriteria?.kriteria_id !== kriteria.kriteria_id && handleEditKriteria(kriteria)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#0e1e3b' }}>
                      {kriteria.beskrywing}
                    </h4>
                    <p style={{ margin: '0', color: '#666' }}>
                      Default Totaal: <strong>{kriteria.default_totaal}</strong>
                    </p>
                  </div>
                  {editingKriteria?.kriteria_id !== kriteria.kriteria_id && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSubCriteriaManager(kriteria);
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {showSubCriteriaManager && expandedKriteria?.kriteria_id === kriteria.kriteria_id ? 'Sluit Beheer' : 'Beheer Sub-kriteria'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleDetailedView(kriteria);
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#0e1e3b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {expandedKriteria?.kriteria_id === kriteria.kriteria_id && !showSubCriteriaManager ? 'Sluit' : 'Beoordeel'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditKriteria(kriteria);
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
                        Wysig
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MerkAdmin;