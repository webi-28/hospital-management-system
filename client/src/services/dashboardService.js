import api from './api';

const dashboardService = {
  getAdmin:   () => api.get('/dashboard/admin'),
  getDoctor:  () => api.get('/dashboard/doctor'),
  getPatient: () => api.get('/dashboard/patient'),
};

export default dashboardService;
