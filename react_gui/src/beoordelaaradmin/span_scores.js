import React, { useState, useEffect } from 'react';
import { getPunteByRondteId } from '../services/merk_services';

const SpanScores = ({ rondteId, refreshKey = 0 }) => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchScores = async () => {
      if (!rondteId) {
        setError('Geen rondte ID verskaf nie');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getPunteByRondteId(rondteId);
        setScores(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, [rondteId, refreshKey]); // <<-- Also listen for changes on refreshKey

  // Group scores by team and calculate percentage
  const calculateTeamScores = (scores) => {
    const teamData = {};
    scores.forEach(score => {
      if (!teamData[score.span_id]) {
        teamData[score.span_id] = {
          span_naam: score.span_naam,
          totalPunte: 0,
          totalPossible: 0
        };
      }
      teamData[score.span_id].totalPunte += score.punt;
      teamData[score.span_id].totalPossible += score.totaal;
    });
    
    // Convert to array and calculate percentages
    return Object.entries(teamData).map(([spanId, data]) => ({
      span_id: spanId,
      span_naam: data.span_naam,
      totalPunte: data.totalPunte,
      totalPossible: data.totalPossible,
      percentage: data.totalPossible > 0 ? Math.round((data.totalPunte / data.totalPossible) * 100) : 0
    })).sort((a, b) => b.percentage - a.percentage); // Sort by percentage descending
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg text-gray-600">Laai punte...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Fout:</strong> {error}
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        Geen punte vir hierdie rondte gevind nie.
      </div>
    );
  }

  const teamScores = calculateTeamScores(scores);

  return (
    <div style={{
      marginTop: '1rem',
      padding: '1rem',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3 style={{ marginBottom: '1rem', color: '#0e1e3b' }}>
        Rondte {rondteId} - Span Leaderboard ({teamScores.length} spanne)
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {teamScores.map((team, index) => (
          <div
            key={team.span_id}
            style={{
              padding: '1rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              ...(index < 3 && {
                backgroundColor: '#fff8e1',
                borderColor: '#ffb74d'
              })
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
              <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                index === 0 ? 'bg-yellow-500' :
                index === 1 ? 'bg-gray-400' :
                index === 2 ? 'bg-orange-500' :
                'bg-blue-500'
              }`}>
                {index + 1}
              </div>
              <div>
                <strong style={{ color: '#0e1e3b', fontSize: '1.1rem' }}>
                  {team.span_naam}
                </strong>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: "#0e1e3b"
                }}>
                  {team.percentage}%
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  {team.totalPunte}/{team.totalPossible} punte
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpanScores;
