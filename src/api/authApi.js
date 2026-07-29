import api from './client';

export const authApi = {
  login: (payload) => api.post('/auth/login', payload),
  register: (payload) => api.post('/auth/register', payload),
  getMe: () => api.get('/auth/me'),
  updatePassword: (payload) => api.patch('/auth/update-password', payload),
};
