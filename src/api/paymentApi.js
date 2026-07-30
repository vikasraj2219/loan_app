import api from './client';

export const paymentApi = {
  list: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  create: (payload) => api.post('/payments', payload),
  update: (id, payload) => api.patch(`/payments/${id}`, payload),
  remove: (id) => api.delete(`/payments/${id}`),
  uploadReceipt: (id, formData) =>
    api.post(`/payments/${id}/receipt`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};
