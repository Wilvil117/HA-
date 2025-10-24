import authService from './auth_service';

const API_BASE_URL = 'http://localhost:4000';


/**
 * Fetch all teams
 * @returns {Promise<Array>} Array of team objects
 */
export const fetchAllTeams = async () => {
  try {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/teams`);
    if (!response.ok) {
      throw new Error(`Failed to fetch all teams: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching all teams:', error);
    throw error;
  }
};


/**
 * Fetch team data by team ID
 * @param {number} teamId - The ID of the team to fetch
 * @returns {Promise<Object>} Team data object
 */
export const fetchTeam = async (teamId) => {
  try {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/teams/${teamId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch team data: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching team:', error);
    throw error;
  }
};

/**
 * Fetch team members by team ID
 * @param {number} teamId - The ID of the team to fetch members for
 * @returns {Promise<Array>} Array of team member objects
 */
export const fetchTeamMembers = async (teamId) => {
  try {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/teams/${teamId}/members`);
    if (!response.ok) {
      throw new Error(`Failed to fetch team members: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw error;
  }
};

/**
 * Fetch both team data and members in parallel
 * @param {number} teamId - The ID of the team to fetch
 * @returns {Promise<Object>} Object containing team and members data
 */
export const fetchTeamWithMembers = async (teamId) => {
  try {
    const [team, members] = await Promise.all([
      fetchTeam(teamId),
      fetchTeamMembers(teamId)
    ]);
    
    return { team, members };
  } catch (error) {
    console.error('Error fetching team with members:', error);
    throw error;
  }
};

/**
 * Fetch all teams and all their members
 * @returns {Promise<Array>} Array of objects, each containing team and its members
 */
export const fetchAllTeamsWithMembers = async () => {
  try {
    const teams = await fetchAllTeams();
    // If there are no teams, just return empty array
    if (!Array.isArray(teams) || teams.length === 0) return [];

    // Fetch team members in parallel for each team
    const results = await Promise.all(teams.map(async (team) => {
      const members = await fetchTeamMembers(team.span_id);
      return { team, members };
    }));

    return results;
  } catch (error) {
    console.error('Error fetching all teams with members:', error);
    throw error;
  }
};




/**
 * Create a new team
 * @param {Object} teamData - Payload for the new team
 * @returns {Promise<Object>} Created team id
 */
export const createTeam = async (teamData) => {
  try {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/teams`, {
      method: 'POST',
      body: JSON.stringify(teamData)
    });
    if (!response.ok) {
      throw new Error(`Failed to create team: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating team:', error);
    throw error;
  }
};

/**
 * Add a new member to a team
 * @param {number} teamId - The team ID
 * @param {Object} memberData - Payload for the new member
 * @returns {Promise<Object>} Created member id
 */
export const addTeamMember = async (teamId, memberData) => {
  try {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify(memberData)
    });
    if (!response.ok) {
      throw new Error(`Failed to add team member: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error adding team member:', error);
    throw error;
  }
};

/**
 * Update a team
 * @param {number} teamId - The team ID
 * @param {Object} teamData - Updated payload for the team
 * @returns {Promise<Object>} Response object
 */
export const updateTeam = async (teamId, teamData) => {
  try {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(teamData)
    });
    if (!response.ok) {
      throw new Error(`Failed to update team: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating team:', error);
    throw error;
  }
};

/**
 * Update a team member
 * @param {number} teamId - The team ID
 * @param {number} memberId - The member ID
 * @param {Object} memberData - Updated payload for the member
 * @returns {Promise<Object>} Response object
 */
export const updateTeamMember = async (teamId, memberId, memberData) => {
  console.log("Trying to update member")
  try {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/teams/${teamId}/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(memberData)
    });
    if (!response.ok) {
      console.log(response.status)
      throw new Error(`Failed to update team member: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating team member:', error);
    throw error;
  }
};

/**
 * Delete a team
 * @param {number} teamId - The team ID
 * @returns {Promise<Object>} Response object
 */
export const deleteTeam = async (teamId) => {
  try {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/teams/${teamId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error(`Failed to delete team: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error deleting team:', error);
    throw error;
  }
};

/**
 * Delete a team member
 * @param {number} teamId - The team ID
 * @param {number} memberId - The member ID
 * @returns {Promise<Object>} Response object
 */
export const deleteTeamMember = async (teamId, memberId) => {
  try {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/teams/${teamId}/members/${memberId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error(`Failed to delete team member: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error deleting team member:', error);
    throw error;
  }
};
