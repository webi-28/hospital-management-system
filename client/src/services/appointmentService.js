import api from './api';

const appointmentService = {
  getAll:        (params) => api.get('/appointments', { params }),
  getToday:      ()       => api.get('/appointments/today'),
  getById:       (id)     => api.get(`/appointments/${id}`),
  create:        (data)   => api.post('/appointments', data),
  updateStatus:  (id, data) => api.put(`/appointments/${id}/status`, data),
  update:        (id, data) => api.put(`/appointments/${id}`, data),
  delete:        (id)     => api.delete(`/appointments/${id}`),
};

export default appointmentService;
