const API_BASE_URL = 'http://localhost:4001/notify';

// POST /punte/bulk - create multiple punte for a team's marksheet submission
export async function notifyBulkPunte(bulkData) {
    const response = await fetch(`${API_BASE_URL}/punte/bulk`, {
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