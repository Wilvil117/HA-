// Kriteria API service functions

import authService from './auth_service';

const API_BASE_URL = 'http://localhost:4000/kriteria';

/**
 * Get all kriteria from the API
 * @returns {Promise<Array>} Array of kriteria objects
 */
export const getAllKriteria = async () => {
  const response = await authService.authenticatedFetch(API_BASE_URL);
  if (!response.ok) {
    throw new Error('Kon nie kriteria laai nie');
  }
  return response.json();
};

/**
 * Get a specific kriteria by ID
 * @param {number} kriteriaId - The ID of the kriteria to fetch
 * @returns {Promise<Object>} Kriteria object
 */
export const getKriteriaById = async (kriteriaId) => {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/${kriteriaId}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Kriteria nie gevind nie');
    }
    throw new Error('Kon nie kriteria inligting laai nie');
  }
  return response.json();
};

/**
 * Create a new kriteria
 * @param {Object} kriteriaData - Object containing beskrywing and default_totaal
 * @returns {Promise<Object>} Object containing the new kriteria ID
 */
export const createKriteria = async (kriteriaData) => {
  const response = await authService.authenticatedFetch(API_BASE_URL, {
    method: 'POST',
    body: JSON.stringify(kriteriaData),
  });

  if (!response.ok) {
    throw new Error('Kon nie kriteria skep nie');
  }
  return response.json();
};

/**
 * Update an existing kriteria
 * @param {number} kriteriaId - The ID of the kriteria to update
 * @param {Object} updateData - Object containing updated beskrywing and default_totaal
 * @returns {Promise<void>}
 */
export const updateKriteria = async (kriteriaId, updateData) => {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/${kriteriaId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    throw new Error('Kon nie kriteria opdateer nie');
  }
};

/**
 * Delete a kriteria
 * @param {number} kriteriaId - The ID of the kriteria to delete
 * @returns {Promise<void>}
 */
export const deleteKriteria = async (kriteriaId) => {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/${kriteriaId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Kon nie kriteria verwyder nie');
  }
};
