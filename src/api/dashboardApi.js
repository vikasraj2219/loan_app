import api from './client';

export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
  getCollectionTrend: (months) => api.get('/dashboard/collection-trend', { params: { months } }),
  getPrincipalInterestTrend: (months) => api.get('/dashboard/principal-interest-trend', { params: { months } }),
  getLoanStatusDistribution: () => api.get('/dashboard/loan-status-distribution'),
  getRecentPayments: (limit) => api.get('/dashboard/recent-payments', { params: { limit } }),
  getOverdueLoans: (limit) => api.get('/dashboard/overdue-loans', { params: { limit } }),
  getTopBorrowers: (limit) => api.get('/dashboard/top-borrowers', { params: { limit } }),
};
