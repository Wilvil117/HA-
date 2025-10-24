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

// Get active tournament
export async function getActiveTournament() {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds/active`);
  
  if (!response.ok) {
    throw new Error('Kon nie aktiewe toernooi laai nie');
  }
  
  return await response.json();
}

// Create a new round
export async function createRound(roundData) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(roundData)
  });

  if (!response.ok) {
    throw new Error('Kon nie rondte skep nie');
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
    throw new Error('Kon nie rondte status opdateer nie');
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
export async function updateTeamParticipation(roundId, teamId, isParticipating) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds/${roundId}/teams/${teamId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ is_participating: isParticipating ? 1 : 0 })
  });

  if (!response.ok) {
    throw new Error('Kon nie span deelname opdateer nie');
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
export async function updateRoundCriteria(roundId, criteriaData) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds/${roundId}/criteria`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(criteriaData)
  });

  if (!response.ok) {
    throw new Error('Kon nie kriteria opdateer nie');
  }

  return await response.json();
}

// Get round allocations
export async function getRoundAllocations(roundId) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds/${roundId}/allocations`);
  
  if (!response.ok) {
    throw new Error('Kon nie toewysings laai nie');
  }
  
  return await response.json();
}

// Validate if auto-allocation is possible
export async function validateAllocation(roundId) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds/${roundId}/validate-allocation`);
  
  if (!response.ok) {
    throw new Error('Kon nie toewysing valideer nie');
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

// Delete a round
export async function deleteRound(roundId) {
  console.log('Delete round service called with roundId:', roundId);
  console.log('Auth service token:', authService.token);
  
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds/${roundId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  console.log('Delete round response status:', response.status);
  console.log('Delete round response ok:', response.ok);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Delete round error response:', errorText);
    
    if (response.status === 404) {
      throw new Error('Rondte nie gevind nie');
    }
    if (response.status === 401) {
      throw new Error('Jy moet ingeteken wees om rondtes te skrap');
    }
    throw new Error('Kon nie rondte skrap nie: ' + errorText);
  }

  return await response.json();
}

// Get current user's allocations for a round
export async function getMyAllocations(roundId) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds/${roundId}/my-allocations`);
  
  if (!response.ok) {
    throw new Error('Kon nie jou toewysings laai nie');
  }
  
  return await response.json();
}

// Get tournament bracket for a round
export async function getTournamentBracket(roundId) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds/${roundId}/tournament-bracket`);
  
  if (!response.ok) {
    throw new Error('Kon nie toernooi bracket laai nie');
  }
  
  return await response.json();
}

// Save tournament bracket
export async function saveTournamentBracket(roundId, bracket) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds/${roundId}/tournament-bracket`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ bracket })
  });

  if (!response.ok) {
    throw new Error('Kon nie toernooi bracket stoor nie');
  }

  return await response.json();
}

// Get tournament match details
export async function getTournamentMatch(roundId, phase, matchId) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds/${roundId}/tournament-matches/${phase}/${matchId}`);
  
  if (!response.ok) {
    throw new Error('Kon nie wedstryd besonderhede laai nie');
  }
  
  return await response.json();
}

// Assign judges to tournament match
export async function assignTournamentMatchJudges(roundId, phase, matchId, judgeIds) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds/${roundId}/tournament-matches/${phase}/${matchId}/judges`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ judgeIds })
  });

  if (!response.ok) {
    throw new Error('Kon nie beoordelaars toewys nie');
  }

  return await response.json();
}

// Assign criteria to tournament match
export async function assignTournamentMatchCriteria(roundId, phase, matchId, criteriaIds) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds/${roundId}/tournament-matches/${phase}/${matchId}/criteria`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ criteriaIds })
  });

  if (!response.ok) {
    throw new Error('Kon nie kriteria toewys nie');
  }

  return await response.json();
}

// Get current user's tournament assignments
export async function getMyTournamentAssignments(roundId) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds/${roundId}/tournament-matches/my-assignments`);
  
  if (!response.ok) {
    throw new Error('Kon nie jou toernooi toewysings laai nie');
  }
  
  return await response.json();
}

// Start tournament
export async function startTournament(roundId, tournamentData) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds/${roundId}/tournament/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(tournamentData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Kon nie toernooi begin nie');
  }

  return await response.json();
}

// Stop tournament
export async function stopTournament(roundId) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds/${roundId}/tournament/stop`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Kon nie toernooi stop nie');
  }

  return await response.json();
}

// Get tournament status
export async function getTournamentStatus(roundId) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rounds/${roundId}/tournament/status`);
  
  if (!response.ok) {
    throw new Error('Kon nie toernooi status laai nie');
  }
  
  return await response.json();
}
