import api from './client';

export const borrowerApi = {
  list: (params) => api.get('/borrowers', { params }),
  getById: (id) => api.get(`/borrowers/${id}`),
  create: (payload) => api.post('/borrowers', payload),
  update: (id, payload) => api.patch(`/borrowers/${id}`, payload),
  remove: (id) => api.delete(`/borrowers/${id}`),
};
