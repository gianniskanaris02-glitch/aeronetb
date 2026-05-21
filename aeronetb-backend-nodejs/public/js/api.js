// API Configuration
const API_BASE_URL = 'https://aeronetb-backend.onrender.com/api';

// Get token from localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Set token
function setToken(token) {
    localStorage.setItem('token', token);
}

// Clear token
function clearToken() {
    localStorage.removeItem('token');
}

// API Request Helper
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });
    
    if (response.status === 401) {
        clearToken();
        window.location.href = '/login.html';
        return;
    }
    
    const data = await response.json();
    return data;
}

// API Functions
const API = {
    // Auth
    login: (username, password) => 
        apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        }),
    
    getCurrentUser: () => apiRequest('/auth/me'),
    
    // Dashboard
    getKPIs: () => apiRequest('/dashboard/kpis'),
    
    // Suppliers
    getSuppliers: (params) => apiRequest(`/suppliers?${new URLSearchParams(params)}`),
    getSupplier: (id) => apiRequest(`/suppliers/${id}`),
    createSupplier: (data) => apiRequest('/suppliers', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    
    // Orders
    getOrders: (params) => apiRequest(`/orders?${new URLSearchParams(params)}`),
    createOrder: (data) => apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    
    // Parts
    getParts: (params) => apiRequest(`/parts?${new URLSearchParams(params)}`),
    getPartSpecifications: (id) => apiRequest(`/parts/${id}/specifications`),
    
    // IoT
    getDevices: () => apiRequest('/iot/devices'),
    getDeviceReadings: (deviceId, hours = 24) => 
        apiRequest(`/iot/devices/${deviceId}/readings?hours=${hours}`),
};