import api from './axios';

// Admin/Faculty: Create a new announcement
export const createAnnouncement = (data) => api.post('/communication', data);

// All roles: Fetch institution-scoped announcements
export const getAnnouncements = () => api.get('/communication');

// All roles: Get a single announcement by ID
export const getAnnouncementById = (id) => api.get(`/communication/${id}`);
