import api from './client';

export const reportApi = {
  getCollections: (params) => api.get('/reports/collections', { params }),
  getPendingInterest: (params) => api.get('/reports/pending-interest', { params }),
  getOverdueInterest: (params) => api.get('/reports/overdue-interest', { params }),
  getInterestCollectionHistory: (months) => api.get('/reports/interest-collection-history', { params: { months } }),

  // Exports return raw file bytes — base64 so they can be written straight
  // to disk with expo-file-system and shared via the native share sheet.
  exportCollectionsFile: (format, params) =>
    api.get(`/reports/export/${format}`, { params, responseType: 'arraybuffer' }),
  exportPendingInterestCsv: (params) =>
    api.get('/reports/export/pending-interest/csv', { params, responseType: 'arraybuffer' }),
};
