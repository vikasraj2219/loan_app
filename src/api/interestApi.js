import api from './client';

export const interestApi = {
  // Backfills every missing month for a loan (or borrower, or all loans) up
  // to now or generateTill — safe to call repeatedly, never duplicates.
  generate: (payload) => api.post('/interest/generate', payload),

  // Manual ledger CRUD — admin-only correction tool, mirrors the web app's
  // "Pending Interest Table" add/edit/delete.
  listRecords: (params) => api.get('/interest-records', { params }),
  getRecord: (id) => api.get(`/interest-records/${id}`),
  createRecord: (payload) => api.post('/interest-records', payload),
  updateRecord: (id, payload) => api.patch(`/interest-records/${id}`, payload),
  deleteRecord: (id) => api.delete(`/interest-records/${id}`),
};
