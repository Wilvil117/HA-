// Merkblad API service functions

import authService from './auth_service';

const API_BASE_URL = 'http://localhost:4000/merkblad';

/**
 * Get all merkblads from the API
 * @returns {Promise<Array>} Array of merkblad objects
 */
export const getAllMerkblads = async () => {
  const response = await authService.authenticatedFetch(API_BASE_URL);
  if (!response.ok) {
    throw new Error('Kon nie merkblads laai nie');
  }
  return response.json();
};

/**
 * Get a specific merkblad by ID
 * @param {number} merkbladId - The ID of the merkblad to fetch
 * @returns {Promise<Object>} Merkblad object
 */
export const getMerkbladById = async (merkbladId) => {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/${merkbladId}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Merkblad nie gevind nie');
    }
    throw new Error('Kon nie merkblad inligting laai nie');
  }
  return response.json();
};

/**
 * Get all merkblads for a specific rondte
 * @param {number} rondteId - The ID of the rondte
 * @returns {Promise<Array>} Array of merkblad objects
 */
export const getMerkbladsByRondteId = async (rondteId) => {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rondte/${rondteId}`);
  if (!response.ok) {
    throw new Error('Kon nie merkblads vir rondte laai nie');
  }
  return response.json();
};

/**
 * Get all merkblads for a specific kriteria
 * @param {number} kriteriaId - The ID of the kriteria
 * @returns {Promise<Array>} Array of merkblad objects
 */
export const getMerkbladsByKriteriaId = async (kriteriaId) => {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/kriteria/${kriteriaId}`);
  if (!response.ok) {
    throw new Error('Kon nie merkblads vir kriteria laai nie');
  }
  return response.json();
};

/**
 * Create a new merkblad
 * @param {Object} merkbladData - Object containing rondte_id, kriteria_id, and optional totaal
 * @returns {Promise<Object>} Object containing the new merkblad
 */
export const createMerkblad = async (merkbladData) => {
  const response = await authService.authenticatedFetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(merkbladData),
  });

  if (!response.ok) {
    throw new Error('Kon nie merkblad skep nie');
  }
  return response.json();
};

/**
 * Get existing merkblad or create a new one if it doesn't exist
 * @param {Object} merkbladData - Object containing rondte_id, kriteria_id, and optional default_totaal
 * @returns {Promise<Object>} Object containing the merkblad
 */
export const getOrCreateMerkblad = async (merkbladData) => {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/get-or-create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(merkbladData),
  });

  if (!response.ok) {
    throw new Error('Kon nie merkblad kry of skep nie');
  }
  return response.json();
};

/**
 * Update an existing merkblad
 * @param {number} merkbladId - The ID of the merkblad to update
 * @param {Object} updateData - Object containing rondte_id, kriteria_id, and optional totaal
 * @returns {Promise<Object>} Updated merkblad object
 */
export const updateMerkblad = async (merkbladId, updateData) => {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/${merkbladId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    throw new Error('Kon nie merkblad opdateer nie');
  }
  return response.json();
};

/**
 * Update only the totaal field of a merkblad
 * @param {number} merkbladId - The ID of the merkblad to update
 * @param {number} totaal - The new totaal value
 * @returns {Promise<Object>} Updated merkblad object
 */
export const updateMerkbladTotaal = async (merkbladId, totaal) => {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/${merkbladId}/totaal`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ totaal }),
  });

  if (!response.ok) {
    throw new Error('Kon nie merkblad totaal opdateer nie');
  }
  return response.json();
};

/**
 * Delete a specific merkblad
 * @param {number} merkbladId - The ID of the merkblad to delete
 * @returns {Promise<Object>} Result object
 */
export const deleteMerkblad = async (merkbladId) => {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/${merkbladId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Kon nie merkblad verwyder nie');
  }
  return response.json();
};

/**
 * Delete all merkblads for a specific rondte
 * @param {number} rondteId - The ID of the rondte
 * @returns {Promise<Object>} Result object
 */
export const deleteMerkbladsByRondteId = async (rondteId) => {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/rondte/${rondteId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Kon nie merkblads vir rondte verwyder nie');
  }
  return response.json();
};

/**
 * Delete all merkblads for a specific kriteria
 * @param {number} kriteriaId - The ID of the kriteria
 * @returns {Promise<Object>} Result object
 */
export const deleteMerkbladsByKriteriaId = async (kriteriaId) => {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/kriteria/${kriteriaId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Kon nie merkblads vir kriteria verwyder nie');
  }
  return response.json();
};

/**
 * Check if a merkblad exists for a specific rondte and kriteria combination
 * @param {number} rondteId - The ID of the rondte
 * @param {number} kriteriaId - The ID of the kriteria
 * @returns {Promise<Object>} Object containing exists boolean
 */
export const checkMerkbladExists = async (rondteId, kriteriaId) => {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/exists/${rondteId}/${kriteriaId}`);
  if (!response.ok) {
    throw new Error('Kon nie merkblad bestaan status kontroleer nie');
  }
  return response.json();
};
