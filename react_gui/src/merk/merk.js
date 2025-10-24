import { useState, useEffect } from "react";
import { createBulkPunte, getRoundStatus } from "../services/merk_services";
import { notifyBulkPunte } from "../services/notify_service"
import { fetchAllTeams } from "../services/span_services";
import { getMerkbladsByRondteId } from "../services/merkblad_services";
import { getKriteriaById } from "../services/kriteria_services";

function Merk() {
  const [message, setMessage] = useState("");
  const [rondteId, setRondteId] = useState(1); // default rondte ID is 1 vir HA1
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [merkblads, setMerkblads] = useState([]);
  const [kriteriaDetails, setKriteriaDetails] = useState({});
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [roundStatus, setRoundStatus] = useState(null);
  const [roundStatusLoading, setRoundStatusLoading] = useState(true);

  // Load teams and check round status on component mount
  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoading(true);
        const teamsData = await fetchAllTeams();
        setTeams(teamsData);
      } catch (err) {
        setMessage("Fout met laai van spanne: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadTeams();
  }, []);

  // Check round status on component mount
  useEffect(() => {
    const checkRoundStatus = async () => {
      try {
        setRoundStatusLoading(true);
        const status = await getRoundStatus(rondteId);
        setRoundStatus(status);
        if (!status.is_open) {
          setMessage("Hierdie rondte is gesluit. Jy kan nie spanne merk nie.");
        }
      } catch (err) {
        setMessage("Fout met laai van rondte status: " + err.message);
      } finally {
        setRoundStatusLoading(false);
      }
    };
    checkRoundStatus();
  }, [rondteId]);

  // Handle team selection
  const handleTeamClick = async (team) => {
    // Don't allow team selection if round is closed
    if (roundStatus && !roundStatus.is_open) {
      setMessage("Hierdie rondte is gesluit. Jy kan nie spanne merk nie.");
      return;
    }

    try {
      setLoading(true);
      setSelectedTeam(team);
      setScores({}); // Reset scores for new team
      setKriteriaDetails({}); // Reset kriteria details
      
      // Load merkblads for the current rondte
      const merkbladsData = await getMerkbladsByRondteId(rondteId);
      setMerkblads(merkbladsData);
      
      // Load kriteria details for each merkblad
      const kriteriaPromises = merkbladsData.map(async (merkblad) => {
        try {
          const kriteriaData = await getKriteriaById(merkblad.kriteria_id);
          return { kriteriaId: merkblad.kriteria_id, kriteriaData };
        } catch (err) {
          console.error(`Error loading kriteria ${merkblad.kriteria_id}:`, err);
          return { kriteriaId: merkblad.kriteria_id, kriteriaData: null };
        }
      });
      
      const kriteriaResults = await Promise.all(kriteriaPromises);
      const kriteriaMap = {};
      kriteriaResults.forEach(({ kriteriaId, kriteriaData }) => {
        kriteriaMap[kriteriaId] = kriteriaData;
      });
      
      setKriteriaDetails(kriteriaMap);
      setMessage("");
    } catch (err) {
      setMessage("Fout met laai van merkblad kriteria: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle score input change with validation
  const handleScoreChange = (kriteriaId, value) => {
    const numValue = parseFloat(value);
    const merkblad = merkblads.find(m => m.kriteria_id === kriteriaId);
    const maxForKriteria = merkblad?.totaal || kriteriaDetails[kriteriaId]?.default_totaal || 100;
    
    // Don't allow values above the maximum for this kriteria
    if (!isNaN(numValue) && numValue > maxForKriteria) {
      return; // Don't update if value exceeds maximum
    }
    
    setScores(prev => ({
      ...prev,
      [kriteriaId]: value
    }));
  };

  // Calculate total score
  const calculateTotalScore = () => {
    return Object.values(scores).reduce((total, score) => {
      const numScore = parseFloat(score);
      return total + (isNaN(numScore) ? 0 : numScore);
    }, 0);
  };

  // Calculate maximum possible score
  const calculateMaxScore = () => {
    return merkblads.reduce((total, merkblad) => {
      const maxForKriteria = merkblad.totaal || kriteriaDetails[merkblad.kriteria_id]?.default_totaal || 100;
      return total + maxForKriteria;
    }, 0);
  };

  // Validate that all kriteria are completed and total is within range
  const validateScores = () => {
    if (merkblads.length === 0) return false;
    
    // Check that all kriteria are completed
    const allCompleted = merkblads.every(merkblad => {
      const score = scores[merkblad.kriteria_id];
      return score !== undefined && score !== null && score !== '';
    });
    
    if (!allCompleted) return false;
    
    // Check that total score is within valid range (0 to max possible)
    const totalScore = calculateTotalScore();
    const maxScore = calculateMaxScore();
    
    return totalScore >= 0 && totalScore <= maxScore;
  };

  // Get validation message for total score
  const getTotalValidationMessage = () => {
    const totalScore = calculateTotalScore();
    const maxScore = calculateMaxScore();
    
    if (totalScore < 0) {
      return "Totale punt kan nie negatief wees nie";
    } else if (totalScore > maxScore) {
      return `Totale punt (${totalScore.toFixed(1)}) kan nie meer as maksimum (${maxScore}) wees nie`;
    }
    return null;
  };

  // Submit scores
  const handleSubmitScores = async () => {
    // Don't allow submission if round is closed
    if (roundStatus && !roundStatus.is_open) {
      setMessage("Hierdie rondte is gesluit. Jy kan nie punte stuur nie.");
      return;
    }

    if (!validateScores()) {
      const totalValidationMsg = getTotalValidationMessage();
      if (totalValidationMsg) {
        setMessage(totalValidationMsg);
      } else {
        setMessage("Alle kriteria moet voltooi word voordat punte gestuur kan word.");
      }
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare score data
      const scoreData = {
        span_id: selectedTeam.span_id,
        rondte_id: rondteId,
        kriteria_scores: {}
      };

      // Add each kriteria score
      merkblads.forEach(merkblad => {
        scoreData.kriteria_scores[merkblad.kriteria_id] = {
          merkblad_id: merkblad.merkblad_id,
          score: parseFloat(scores[merkblad.kriteria_id])
        };
      });

      await createBulkPunte(scoreData);
      await notifyBulkPunte(scoreData);
      setMessage(`Punte suksesvol gestuur vir ${selectedTeam.naam}!`);
      setScores({}); // Reset scores after successful submission
    } catch (err) {
      setMessage("Fout met stuur van punte: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Welkom by die Merk bladsy</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Instruksies:</h2>
        <ul>
          <li>Kies 'n span om te merk</li>
          <li>Voltooi die merkblad kriteria</li>
          <li>Dien die voltooide merkblad in</li>
        </ul>
      </div>

      {/* Round Status Display */}
      <div style={{ marginBottom: '20px' }}>
        {roundStatusLoading ? (
          <div style={{ padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '6px' }}>
            Laai rondte status...
          </div>
        ) : roundStatus ? (
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#0e1e3b',
            borderRadius: '6px',
            border: `#0e1e3b`
          }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#ffffff' }}>
              Rondte Status: {roundStatus.is_open ? 'OOP' : 'GESLUIT'}
            </h3>
            <p style={{ margin: '0', color: '#ffffff' }}>
              {roundStatus.is_open 
                ? 'Jy kan spanne merk en punte stuur.' 
                : 'Hierdie rondte is gesluit. Jy kan nie spanne merk nie.'
              }
            </p>
          </div>
        ) : null}
      </div>

      {/* Teams Grid */}
      <div style={{ marginBottom: '30px' }}>
        <h2>Kies 'n Span:</h2>
        {loading && !selectedTeam ? (
          <div>Laai spanne...</div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
            gap: '15px',
            marginBottom: '20px'
          }}>
            {teams.map(team => (
              <div
                key={team.span_id}
                onClick={() => handleTeamClick(team)}
                style={{
                  padding: '15px',
                  border: selectedTeam?.span_id === team.span_id ? '5px solid #77502d' : '1px solid #0e1e3b',
                  borderRadius: '8px',
                  cursor: roundStatus && !roundStatus.is_open ? 'not-allowed' : 'pointer',
                  backgroundColor: selectedTeam?.span_id === team.span_id ? '#0e1e3b' : '#0e1e3b',
                  color: 'white',
                  transition: 'all 0.2s ease',
                  textAlign: 'center',
                  opacity: roundStatus && !roundStatus.is_open ? 0.5 : 1
                }}

              >
                <h3 style={{ margin: '0 0 5px 0', color: 'white' }}>{team.naam}</h3>
                {roundStatus && !roundStatus.is_open && (
                  <small style={{ color: '#ccc', fontSize: '12px' }}>Rondte gesluit</small>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Marksheet Form */}
      {selectedTeam && (
        <div style={{ 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          padding: '20px',
          backgroundColor: '#f9f9f9'
        }}>
          <h2>Merkblad vir {selectedTeam.naam}</h2>
          
          {loading ? (
            <div>Laai kriteria...</div>
          ) : merkblads.length === 0 ? (
            <div style={{ color: '#666' }}>Geen kriteria beskikbaar vir hierdie rondte nie.</div>
          ) : (
            <div>
              <div style={{ marginBottom: '20px' }}>
                {merkblads.map(merkblad => (
                  <div key={merkblad.merkblad_id} style={{ 
                    marginBottom: '15px',
                    padding: '15px',
                    backgroundColor: '#fff',
                    borderRadius: '6px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: 'bold',
                      color: '#333'
                    }}>
                      {kriteriaDetails[merkblad.kriteria_id]?.beskrywing || `Kriteria ID ${merkblad.kriteria_id}`}:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={merkblad.totaal || kriteriaDetails[merkblad.kriteria_id]?.default_totaal || 100}
                      step="0.1"
                      value={scores[merkblad.kriteria_id] || ''}
                      onChange={(e) => handleScoreChange(merkblad.kriteria_id, e.target.value)}
                      placeholder={`Voer punt in (0-${merkblad.totaal || kriteriaDetails[merkblad.kriteria_id]?.default_totaal || 100})`}
                      style={{
                        width: '200px',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '16px'
                      }}
                    />
                    <span style={{ marginLeft: '10px', color: '#666' }}>
                      (Maksimum: {merkblad.totaal || kriteriaDetails[merkblad.kriteria_id]?.default_totaal || 100})
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Score Display */}
              <div style={{ 
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#f0f0f0',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    Totale Punt: {calculateTotalScore().toFixed(1)}
                  </span>
                  <span style={{ color: '#666' }}>
                    van {calculateMaxScore()} maksimum
                  </span>
                </div>
                
                {/* Validation Message */}
                {getTotalValidationMessage() && (
                  <div style={{ 
                    color: '#d32f2f', 
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    ⚠️ {getTotalValidationMessage()}
                  </div>
                )}
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '10px', 
                alignItems: 'center',
                marginTop: '20px'
              }}>
                <button
                  onClick={handleSubmitScores}
                  disabled={!validateScores() || submitting || (roundStatus && !roundStatus.is_open)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: validateScores() && !submitting && (!roundStatus || roundStatus.is_open) ? '#0e1e3b' : '#77502d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: validateScores() && !submitting && (!roundStatus || roundStatus.is_open) ? 'pointer' : 'not-allowed',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    opacity: validateScores() && !submitting && (!roundStatus || roundStatus.is_open) ? 1 : 0.6
                  }}
                >
                  {submitting ? 'Stuur...' : 'Stuur Punte'}
                </button>
                
                {!validateScores() && (
                  <span style={{ color: '#77502d', fontSize: '14px' }}>
                    {getTotalValidationMessage() || "Alle kriteria moet voltooi word"}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: message.includes('suksesvol') ? '#f9f9f9' : '#f9f9f9',
          color: message.includes('suksesvol') ? '#0e1e3b' : '#77502d',
          borderRadius: '6px',
          border: `1px solid ${message.includes('suksesvol') ? '#0e1e3b' : '#77502d'}`
        }}>
          {message}
        </div>
      )}
    </div>
  );
}

export default Merk;
