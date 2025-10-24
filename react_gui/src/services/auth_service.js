const API_BASE_URL = 'http://localhost:4000';

class AuthService {
    constructor() {
        this.user = null;
        this.token = null;
        this.loadFromStorage();
    }

    // Load user data from localStorage
    loadFromStorage() {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedToken) {
            this.user = JSON.parse(storedUser);
            this.token = storedToken;
        }
    }

    // Save user data to localStorage
    saveToStorage() {
        if (this.user && this.token) {
            localStorage.setItem('user', JSON.stringify(this.user));
            localStorage.setItem('token', this.token);
        }
    }

    // Clear user data from localStorage
    clearStorage() {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        this.user = null;
        this.token = null;
    }

    // Register new user
    async register(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registrasie het gefaal');
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    // Login user
    async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Inlogging het gefaal');
            }

            // Store user data
            this.user = data.user;
            this.token = data.user.id.toString(); // Simple token for now
            this.saveToStorage();

            return data;
        } catch (error) {
            throw error;
        }
    }

    // Logout user
    logout() {
        this.clearStorage();
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.user !== null && this.token !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.user;
    }

    // Get auth token
    getToken() {
        return this.token;
    }

    // Check if user is admin
    isAdmin() {
        return this.user && this.user.role === 'admin';
    }

    // Check if user is beoordelaar
    isBeoordelaar() {
        return this.user && this.user.role === 'beoordelaar';
    }

    // Make authenticated requests
    async authenticatedFetch(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
            ...options.headers,
        };

        return fetch(url, {
            ...options,
            headers,
        });
    }
}

// Create singleton instance
const authService = new AuthService();
export default authService;
