import api from './api';

const recordService = {
  getAll:               (params)     => api.get('/records', { params }),
  getById:              (id)         => api.get(`/records/${id}`),
  create:               (data)       => api.post('/records', data),
  update:               (id, data)   => api.put(`/records/${id}`, data),
  delete:               (id)         => api.delete(`/records/${id}`),
  uploadAttachment:     (id, formData) =>
    api.post(`/records/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteAttachment:     (attachId)   => api.delete(`/records/attachments/${attachId}`),
  createPrescription:   (recordId, data) => api.post(`/records/${recordId}/prescriptions`, data),
  getPatientPrescriptions: (patientId) => api.get(`/records/prescriptions/patient/${patientId}`),
  getPrescriptionById:  (id)         => api.get(`/records/prescription/${id}`),
};

export default recordService;
