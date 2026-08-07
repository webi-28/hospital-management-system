import api from './api';

const patientService = {
  getAll:      (params) => api.get('/patients', { params }),
  getById:     (id)     => api.get(`/patients/${id}`),
  getMe:       ()       => api.get('/patients/me'),
  getSummary:  (id)     => api.get(`/patients/${id}/summary`),
  update:      (id, data) => api.put(`/patients/${id}`, data),
  delete:      (id)     => api.delete(`/patients/${id}`),
};

export default patientService;
