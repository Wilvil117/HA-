import authService from './auth_service';

const API_BASE_URL = 'http://localhost:4000';

// GET /punte - get all punte
export async function getAllPunte() {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/punte`);
  
  if (!response.ok) {
    throw new Error("Kon nie punte laai nie");
  }
  
  return await response.json();
}

// GET /punte/:id - get specific punt by ID
export async function getPuntById(id) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/punte/${id}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Punt nie gevind nie");
    }
    throw new Error("Kon nie punt laai nie");
  }
  
  return await response.json();
}

// GET /punte/merkblad/:merkblad_id - get all punte for a specific merkblad
export async function getPunteByMerkbladId(merkbladId) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/punte/merkblad/${merkbladId}`);
  
  if (!response.ok) {
    throw new Error("Kon nie punte vir merkblad laai nie");
  }
  
  return await response.json();
}

// GET /punte/span/:span_id - get all punte for a specific span
export async function getPunteBySpanId(spanId) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/punte/span/${spanId}`);
  
  if (!response.ok) {
    throw new Error("Kon nie punte vir span laai nie");
  }
  
  return await response.json();
}

// GET /punte/merkblad/:merkblad_id/span/:span_id - get punt for specific merkblad and span combination
export async function getPuntByMerkbladAndSpan(merkbladId, spanId) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/punte/merkblad/${merkbladId}/span/${spanId}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Punt vir hierdie merkblad en span kombinasie nie gevind nie");
    }
    throw new Error("Kon nie punt laai nie");
  }
  
  return await response.json();
}

// GET /punte/rondte/:rondte_id - get all punte for all teams in a specific round
export async function getPunteByRondteId(rondteId) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/punte/rondte/${rondteId}`);
  
  if (!response.ok) {
    throw new Error("Kon nie punte vir rondte laai nie");
  }
  
  return await response.json();
}

// POST /punte - create a new punt
export async function createPunt(punteData) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/punte`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(punteData)
  });

  if (!response.ok) {
    throw new Error("Kon nie punt skep nie");
  }

  return await response.json();
}

// PUT /punte/:id - update a punt by ID
export async function updatePunt(id, punteData) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/punte/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(punteData)
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Punt nie gevind nie");
    }
    throw new Error("Kon nie punt opdateer nie");
  }

  return await response.json();
}

// PUT /punte/merkblad/:merkblad_id/span/:span_id - update punt by merkblad and span combination
export async function updatePuntByMerkbladAndSpan(merkbladId, spanId, punt) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/punte/merkblad/${merkbladId}/span/${spanId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ punt })
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Punt vir hierdie merkblad en span kombinasie nie gevind nie");
    }
    throw new Error("Kon nie punt opdateer nie");
  }

  return await response.json();
}

// DELETE /punte/:id - delete punt by ID
export async function deletePunt(id) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/punte/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Punt nie gevind nie");
    }
    throw new Error("Kon nie punt verwyder nie");
  }

  return await response.json();
}

// DELETE /punte/merkblad/:merkblad_id/span/:span_id - delete punt by merkblad and span combination
export async function deletePuntByMerkbladAndSpan(merkbladId, spanId) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/punte/merkblad/${merkbladId}/span/${spanId}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Punt vir hierdie merkblad en span kombinasie nie gevind nie");
    }
    throw new Error("Kon nie punt verwyder nie");
  }

  return await response.json();
}

// DELETE /punte/merkblad/:merkblad_id - delete all punte for a specific merkblad
export async function deletePunteByMerkblad(merkbladId) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/punte/merkblad/${merkbladId}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error("Kon nie punte vir merkblad verwyder nie");
  }

  return await response.json();
}

// DELETE /punte/span/:span_id - delete all punte for a specific span
export async function deletePunteBySpan(spanId) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/punte/span/${spanId}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error("Kon nie punte vir span verwyder nie");
  }

  return await response.json();
}

// POST /punte/bulk - create multiple punte for a team's marksheet submission
export async function createBulkPunte(bulkData) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/punte/bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(bulkData)
  });

  if (!response.ok) {
    throw new Error("Kon nie punte skep nie");
  }

  return await response.json();
}

// GET /punte/rondte/:rondte_id/status - get round status (is_oop)
export async function getRoundStatus(rondteId) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/punte/rondte/${rondteId}/status`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Rondte nie gevind nie");
    }
    throw new Error("Kon nie rondte status laai nie");
  }
  
  return await response.json();
}

// PUT /punte/rondte/:rondte_id/close - close a round (set is_oop to 0)
export async function closeRound(rondteId) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/punte/rondte/${rondteId}/close`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Rondte nie gevind nie");
    }
    throw new Error("Kon nie rondte sluit nie");
  }

  return await response.json();
}

// PUT /punte/rondte/:rondte_id/open - open a round (set is_oop to 1)
export async function openRound(rondteId) {
  const response = await authService.authenticatedFetch(`${API_BASE_URL}/punte/rondte/${rondteId}/open`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Rondte nie gevind nie");
    }
    throw new Error("Kon nie rondte oopmaak nie");
  }

  return await response.json();
}

// Legacy function - keeping for backward compatibility
export async function stuurPunte(punteData) {
  return await createPunt(punteData);
}
