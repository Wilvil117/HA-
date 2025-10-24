import React, { useState, useEffect } from 'react';

function DetailedKriteriaItem({ kriteria, onSave, onCancel, isExpanded, onToggle, subCriteria = [] }) {
  const [scores, setScores] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize scores when component mounts or kriteria changes
  useEffect(() => {
    if (kriteria && subCriteria.length > 0) {
      const initialScores = {};
      subCriteria.forEach(sub => {
        initialScores[sub.name] = 0;
      });
      setScores(initialScores);
    }
  }, [kriteria, subCriteria]);

  const handleScoreChange = (subCriteriaName, value) => {
    const numValue = parseFloat(value) || 0;
    setScores(prev => ({
      ...prev,
      [subCriteriaName]: numValue
    }));
  };

  const calculateCurrentTotal = () => {
    return Object.values(scores).reduce((sum, score) => sum + score, 0);
  };

  const calculateMaxTotal = () => {
    if (!kriteria || subCriteria.length === 0) return 0;
    return subCriteria.reduce((sum, sub) => sum + sub.maxPoints, 0);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // Here you would typically save the detailed scores to your backend
      // For now, we'll just simulate a save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const detailedScores = {
        kriteriaId: kriteria.kriteria_id,
        totalScore: calculateCurrentTotal(),
        maxScore: calculateMaxTotal(),
        subCriteriaScores: scores
      };
      
      console.log('Saving detailed scores:', detailedScores);
      onSave(detailedScores);
    } catch (error) {
      alert(`Fout: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!kriteria || subCriteria.length === 0) {
    return null;
  }

  const currentTotal = calculateCurrentTotal();
  const maxTotal = calculateMaxTotal();

  return (
    <div style={{
      marginTop: '1rem',
      padding: '1.5rem',
      border: '2px solid #77502d',
      borderRadius: '12px',
      backgroundColor: '#f9f9f9',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '2px solid #77502d'
      }}>
        <div>
          <h3 style={{ 
            margin: '0 0 0.5rem 0', 
            color: '#0e1e3b',
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}>
            {kriteria.beskrywing} ({kriteria.default_totaal} punte)
          </h3>
          <p style={{ 
            margin: '0', 
            color: '#666',
            fontStyle: 'italic',
            fontSize: '1rem'
          }}>
            Beoordeel hierdie kriteria volgens die sub-kriteria hieronder.
          </p>
        </div>
        <button
          onClick={onToggle}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#77502d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold'
          }}
        >
          {isExpanded ? 'Sluit' : 'Wysig'}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div>
          {/* Total Score Display */}
          <div style={{
            backgroundColor: '#e3f2fd',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            border: '1px solid #2196f3'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0e1e3b' }}>Huidige Totaal</h4>
                <p style={{ margin: '0', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  {currentTotal.toFixed(1)} / {maxTotal} punte
                </p>
              </div>
              <div style={{
                padding: '0.5rem 1rem',
                backgroundColor: currentTotal > maxTotal ? '#f44336' : currentTotal === maxTotal ? '#4caf50' : '#ff9800',
                color: 'white',
                borderRadius: '6px',
                fontWeight: 'bold'
              }}>
                {currentTotal > maxTotal ? 'Oorskry' : currentTotal === maxTotal ? 'Voltooi' : 'Gedeeltelik'}
              </div>
            </div>
          </div>

          {/* Sub-criteria */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: '#0e1e3b', marginBottom: '1rem' }}>Sub-kriteria:</h4>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {subCriteria.map((sub, index) => (
                <div key={index} style={{
                  padding: '1rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <h5 style={{ margin: '0 0 0.25rem 0', color: '#0e1e3b' }}>
                        {sub.name} ({sub.maxPoints} punte)
                      </h5>
                      <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
                        {sub.description}
                      </p>
                    </div>
                    <div style={{ marginLeft: '1rem', minWidth: '120px' }}>
                      <input
                        type="number"
                        min="0"
                        max={sub.maxPoints}
                        step="0.1"
                        value={scores[sub.name] || 0}
                        onChange={(e) => handleScoreChange(sub.name, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          fontSize: '1rem',
                          textAlign: 'center'
                        }}
                        placeholder="0"
                      />
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#666',
                        textAlign: 'center',
                        marginTop: '0.25rem'
                      }}>
                        {scores[sub.name] || 0} / {sub.maxPoints}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.min(((scores[sub.name] || 0) / sub.maxPoints) * 100, 100)}%`,
                      height: '100%',
                      backgroundColor: (scores[sub.name] || 0) > sub.maxPoints ? '#f44336' : '#4caf50',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#77502d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              Kanselleer
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#0e1e3b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              {isSubmitting ? 'Stoor...' : 'Stoor Beoordeling'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DetailedKriteriaItem;
