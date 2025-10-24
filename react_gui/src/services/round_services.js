import authService from './auth_service';

const API_BASE_URL = 'http://localhost:4000';

// Get all rounds
export async function getAllRounds() {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds`);
  
  if (!response.ok) {
    throw new Error('Kon nie rondtes laai nie');
  }
  
  return await response.json();
}

// Create new round
export async function createRound(roundData) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(roundData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Kon nie rondte skep nie');
  }

  return await response.json();
}

// Update round status
export async function updateRoundStatus(roundId, status) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds/${roundId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Kon nie rondte status opdateer nie');
  }

  return await response.json();
}

// Get teams for a round
export async function getRoundTeams(roundId) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds/${roundId}/teams`);
  
  if (!response.ok) {
    throw new Error('Kon nie spanne laai nie');
  }
  
  return await response.json();
}

// Update team participation
export async function updateTeamParticipation(roundId, teamParticipation) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds/${roundId}/teams`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ team_participation: teamParticipation })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Kon nie span deelname opdateer nie');
  }

  return await response.json();
}

// Get criteria for a round
export async function getRoundCriteria(roundId) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds/${roundId}/criteria`);
  
  if (!response.ok) {
    throw new Error('Kon nie kriteria laai nie');
  }
  
  return await response.json();
}

// Update round criteria
export async function updateRoundCriteria(roundId, criteriaSelection) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds/${roundId}/criteria`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ criteria_selection: criteriaSelection })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Kon nie kriteria opdateer nie');
  }

  return await response.json();
}

// Get judge allocations for a round
export async function getRoundAllocations(roundId) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds/${roundId}/allocations`);
  
  if (!response.ok) {
    throw new Error('Kon nie toewysings laai nie');
  }
  
  return await response.json();
}

// Auto allocate judges to teams
export async function autoAllocateJudges(roundId) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds/${roundId}/auto-allocate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Kon nie outomatiese toewysing doen nie');
  }

  return await response.json();
}

// Get round summary with scores
export async function getRoundSummary(roundId) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds/${roundId}/summary`);
  
  if (!response.ok) {
    throw new Error('Kon nie rondte opsomming laai nie');
  }
  
  return await response.json();
}
