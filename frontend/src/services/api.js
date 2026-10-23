import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to all requests if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('syntra_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or unauthorized
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register') && window.location.pathname !== '/') {
        localStorage.removeItem('syntra_token');
        localStorage.removeItem('syntra_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  demoLogin: () => api.post('/auth/demo-login'),
  getMe: () => api.get('/auth/me'),
};

export const studentService = {
  getProfile: () => api.get('/student/profile'),
  updateProfile: (data) => api.put('/student/profile', data),
};

export const goalService = {
  createGoal: (data) => api.post('/goals', data),
  listGoals: () => api.get('/goals'),
  getActiveGoal: () => api.get('/goals/active'),
};

export const studyPlanService = {
  getPlan: () => api.get('/study-plan'),
  toggleTopicStatus: (topicId) => api.put(`/study-plan/topics/${topicId}/status`),
  triggerAdaptation: () => api.post('/study-plan/adapt'),
};

export const documentService = {
  uploadDocument: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  listDocuments: () => api.get('/documents'),
  queryRAG: (data) => api.post('/documents/query', data),
  deleteDocument: (id) => api.delete(`/documents/${id}`),
};

export const quizService = {
  generateQuiz: (params) => api.post('/quiz/generate', null, { params }),
  submitQuiz: (data) => api.post('/quiz/submit', data),
  getHistory: () => api.get('/quiz/history'),
};

export const agentService = {
  learnTopic: (data) => api.post('/agents/learn', data),
  runAgents: (data) => api.post('/agents/run', data),
};

export const analyticsService = {
  getAnalytics: () => api.get('/analytics'),
};

export const agentActivityService = {
  getActivity: () => api.get('/agent-activity'),
};

export default api;
