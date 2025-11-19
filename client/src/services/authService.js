import axios from 'axios';

const API_URL = '/api/auth/';

// Helper to set the authorization header for all subsequent axios requests
const setAuthHeader = (token) => {
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }
};

// Register user
const register = async (userData) => {
  const response = await axios.post(API_URL + 'register', userData);
  if (response.data.token) {
    localStorage.setItem('userToken', response.data.token);
    setAuthHeader(response.data.token);
  }
  return response.data;
};

// Login user
const login = async (userData) => {
  const response = await axios.post(API_URL + 'login', userData);
  if (response.data.token) {
    localStorage.setItem('userToken', response.data.token);
    setAuthHeader(response.data.token);
  }
  return response.data;
};

// Logout user
const logout = () => {
  localStorage.removeItem('userToken');
  setAuthHeader(null);
};

// Fetch the current user's profile
const getMe = async () => {
    const response = await axios.get(API_URL + 'me');
    return response.data;
}


const authService = {
  register,
  login,
  logout,
  getMe,
  setAuthHeader
};

export default authService;
