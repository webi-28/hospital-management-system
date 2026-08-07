import api from './api';

const billingService = {
  getAll:        (params)   => api.get('/billing', { params }),
  getStats:      ()         => api.get('/billing/stats'),
  getById:       (id)       => api.get(`/billing/${id}`),
  create:        (data)     => api.post('/billing', data),
  update:        (id, data) => api.put(`/billing/${id}`, data),
  recordPayment: (id, data) => api.post(`/billing/${id}/pay`, data),
  delete:        (id)       => api.delete(`/billing/${id}`),
};

export default billingService;
