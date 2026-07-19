import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally (token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// ── Quiz ──────────────────────────────────────────────
export const quizAPI = {
  generate: () => api.post('/quiz/generate'),
  getQuestions: (attemptId) => api.get(`/quiz/${attemptId}/questions`),
  submit: (attemptId, answers) => api.post(`/quiz/${attemptId}/submit`, { answers }),
};

// ── Dashboard ─────────────────────────────────────────
export const dashboardAPI = {
  getAttempts: () => api.get('/dashboard/attempts'),
  getAnalytics: () => api.get('/dashboard/analytics'),
  getReview: (attemptId) => api.get(`/dashboard/attempts/${attemptId}/review`),
};

export default api;
