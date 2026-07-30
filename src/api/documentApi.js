import api from './client';

export const documentApi = {
  // Global, cross-cutting list — every document across all borrowers/loans.
  listAll: (params) => api.get('/documents', { params }),
  getCategories: (type) => api.get('/documents/categories', { params: { type } }),

  // Owner-scoped actions — ownerField is 'borrowers' or 'loans'.
  upload: (ownerField, ownerId, formData) =>
    api.post(`/${ownerField}/${ownerId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  archive: (ownerField, ownerId, documentId) => api.patch(`/${ownerField}/${ownerId}/documents/${documentId}/archive`),
  unarchive: (ownerField, ownerId, documentId) => api.patch(`/${ownerField}/${ownerId}/documents/${documentId}/unarchive`),
  remove: (ownerField, ownerId, documentId, permanent = false) =>
    api.delete(`/${ownerField}/${ownerId}/documents/${documentId}`, { params: permanent ? { permanent: true } : {} }),
};
