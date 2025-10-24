import React, { useState } from 'react';
import { createRound } from '../services/round_services';

const TestDataLoader = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const createSampleRounds = async () => {
    try {
      setLoading(true);
      setMessage('Creating sample rounds...');
      
      const sampleRounds = [
        {
          round_name: 'Capstone 2024 - Final Round',
          max_teams: 15,
          max_judges_per_team: 3,
          max_teams_per_judge: 3
        },
        {
          round_name: 'Capstone 2024 - Semi-Final',
          max_teams: 8,
          max_judges_per_team: 2,
          max_teams_per_judge: 4
        },
        {
          round_name: 'Capstone 2024 - Mega Tournament',
          max_teams: 40,
          max_judges_per_team: 2,
          max_teams_per_judge: 5
        }
      ];

      for (const round of sampleRounds) {
        try {
          await createRound(round);
          console.log(`Created round: ${round.round_name}`);
        } catch (err) {
          console.log(`Round ${round.round_name} might already exist:`, err.message);
        }
      }
      
      setMessage('Sample rounds created successfully!');
    } catch (err) {
      setMessage('Error creating sample rounds: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ color: '#0e1e3b', marginBottom: '20px' }}>Test Data Loader</h2>
      
      {message && (
        <div style={{
          padding: '10px',
          backgroundColor: message.includes('Error') ? '#f8d7da' : '#d4edda',
          color: message.includes('Error') ? '#721c24' : '#155724',
          border: `1px solid ${message.includes('Error') ? '#f5c6cb' : '#c3e6cb'}`,
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {message}
        </div>
      )}

      <button
        onClick={createSampleRounds}
        disabled={loading}
        style={{
          padding: '15px 30px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        {loading ? 'Creating...' : 'Create Sample Rounds'}
      </button>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p>This will create sample tournament rounds for testing:</p>
        <ul>
          <li>Capstone 2024 - Final Round (15 teams)</li>
          <li>Capstone 2024 - Semi-Final (8 teams)</li>
          <li>Capstone 2024 - Mega Tournament (40 teams)</li>
        </ul>
      </div>
    </div>
  );
};

export default TestDataLoader;
