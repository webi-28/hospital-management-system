import api from './api';

const doctorService = {
  getAll:            (params) => api.get('/doctors', { params }),
  getById:           (id)     => api.get(`/doctors/${id}`),
  getSlots:          (id, date) => api.get(`/doctors/${id}/slots`, { params: { date } }),
  getSpecializations: ()      => api.get('/doctors/specializations'),
  getDepartments:    ()       => api.get('/doctors/departments'),
  update:            (id, data) => api.put(`/doctors/${id}`, data),
  delete:            (id)     => api.delete(`/doctors/${id}`),
  getMySchedule:     (params) => api.get('/doctors/me/schedule', { params }),
  upsertSchedule:    (data)   => api.post('/doctors/me/schedule', data),
};

export default doctorService;
