import React, { useState, useEffect } from 'react';
import { getAllKriteria } from '../services/kriteria_services';
import { 
  getMerkbladsByRondteId, 
  getOrCreateMerkblad, 
  updateMerkbladTotaal,
  deleteMerkblad 
} from '../services/merkblad_services';

function MerkbladKriteriaManager({ rondteId, onKriteriaUpdated }) {
  const [kriteria, setKriteria] = useState([]);
  const [selectedKriteria, setSelectedKriteria] = useState('');
  const [merkblads, setMerkblads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load kriteria and existing merkblads on component mount
  useEffect(() => {
    loadData();
  }, [rondteId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Load all kriteria
      const kriteriaData = await getAllKriteria();
      setKriteria(kriteriaData);
      
      // Load existing merkblads for this rondte
      const merkbladsData = await getMerkbladsByRondteId(rondteId);
      setMerkblads(merkbladsData);
      
    } catch (err) {
      setError(`Fout met laai van data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKriteriaSelect = (e) => {
    setSelectedKriteria(e.target.value);
  };

  const handleAddKriteria = async (e) => {
    e.preventDefault();
    
    if (!selectedKriteria) {
      alert("Kies asseblief 'n kriteria");
      return;
    }

    // Check if kriteria already exists for this rondte
    const existingMerkblad = merkblads.find(m => m.kriteria_id === parseInt(selectedKriteria));
    if (existingMerkblad) {
      alert('Hierdie kriteria bestaan reeds vir hierdie rondte');
      return;
    }

    setIsSubmitting(true);
    try {
      const kriteriaData = kriteria.find(k => k.kriteria_id === parseInt(selectedKriteria));
      const defaultTotaal = kriteriaData ? kriteriaData.default_totaal : null;
      
      const newMerkblad = await getOrCreateMerkblad({
        rondte_id: rondteId,
        kriteria_id: parseInt(selectedKriteria),
        default_totaal: defaultTotaal
      });
      
      // Update local state
      setMerkblads(prev => [...prev, newMerkblad]);
      setSelectedKriteria('');
      
      // Notify parent component
      if (onKriteriaUpdated) {
        onKriteriaUpdated();
      }
      
    } catch (err) {
      alert(`Fout met toevoeg van kriteria: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTotaalUpdate = async (merkbladId, newTotaal) => {
    try {
      const updatedMerkblad = await updateMerkbladTotaal(merkbladId, newTotaal);
      
      // Update local state
      setMerkblads(prev => 
        prev.map(m => m.merkblad_id === merkbladId ? updatedMerkblad : m)
      );
      
    } catch (err) {
      alert(`Fout met opdatering van totaal: ${err.message}`);
    }
  };

  const handleRemoveKriteria = async (merkbladId) => {

    try {
      await deleteMerkblad(merkbladId);
      
      // Update local state
      setMerkblads(prev => prev.filter(m => m.merkblad_id !== merkbladId));
      
      // Notify parent component
      if (onKriteriaUpdated) {
        onKriteriaUpdated();
      }
      
    } catch (err) {
      alert(`Fout met verwydering van kriteria: ${err.message}`);
    }
  };

  const getKriteriaBeskrywing = (kriteriaId) => {
    const kriteriaItem = kriteria.find(k => k.kriteria_id === kriteriaId);
    return kriteriaItem ? kriteriaItem.beskrywing : 'Onbekende kriteria';
  };

  if (isLoading) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        color: '#666'
      }}>
        Laai kriteria...
      </div>
    );
  }

  return (
    <div style={{
      marginTop: '1rem',
      padding: '1rem',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3 style={{ marginBottom: '1rem', color: '#0e1e3b' }}>
        Kriteria vir Rondte {rondteId}
      </h3>
      
      {error && (
        <div style={{
          padding: '0.5rem',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {/* Add new kriteria form */}
      <form onSubmit={handleAddKriteria} style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          
          <select
            id="kriteria-select"
            value={selectedKriteria}
            onChange={handleKriteriaSelect}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem',
              backgroundColor: 'white'
            }}
          >
            <option value="">Kies 'n kriteria...</option>
            {kriteria.map(k => (
              <option key={k.kriteria_id} value={k.kriteria_id}>
                {k.beskrywing} (Default: {k.default_totaal || 0})
              </option>
            ))}
          </select>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting || !selectedKriteria}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#0e1e3b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.6 : 1,
            fontSize: '1rem'
          }}
        >
          {isSubmitting ? 'Voeg toe...' : 'Voeg Kriteria toe'}
        </button>
      </form>

      {/* Display existing merkblads */}
      <div>
        <h4 style={{ marginBottom: '1rem', color: '#0e1e3b' }}>
          Bestaande Kriteria ({merkblads.length})
        </h4>
        
        {merkblads.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            Geen kriteria vir hierdie rondte nie. Voeg kriteria hierbo toe.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {merkblads.map(merkblad => (
              <div
                key={merkblad.merkblad_id}
                style={{
                  padding: '1rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}
              >
                <div style={{ flex: 1 }}>
                  <strong style={{ color: '#0e1e3b' }}>
                    {getKriteriaBeskrywing(merkblad.kriteria_id)}
                  </strong>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', color: '#666' }}>
                    Totaal:
                  </label>
                  <input
                    type="number"
                    value={merkblad.totaal || ''}
                    onChange={(e) => {
                      const newTotaal = parseInt(e.target.value) || 0;
                      handleTotaalUpdate(merkblad.merkblad_id, newTotaal);
                    }}
                    style={{
                      width: '80px',
                      padding: '0.25rem',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}
                    placeholder="0"
                  />
                </div>
                
                <button
                  onClick={() => handleRemoveKriteria(merkblad.merkblad_id)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#77502d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                  title="Verwyder kriteria"
                >
                  Verwyder
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MerkbladKriteriaManager;
