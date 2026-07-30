import api from './client';

export const loanApi = {
  list: (params) => api.get('/loans', { params }),
  getById: (id) => api.get(`/loans/${id}`),
  create: (payload) => api.post('/loans', payload),
  update: (id, payload) => api.patch(`/loans/${id}`, payload),
  close: (id) => api.patch(`/loans/${id}/close`),
  markOverdue: (id) => api.patch(`/loans/${id}/mark-overdue`),
  getInterestSchedule: (id) => api.get(`/loans/${id}/interest`),
};
