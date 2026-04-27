import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const uploadPdf = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post(`${API_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const chatWithAi = async (question) => {
  const response = await axios.post(`${API_URL}/chat`, {
    question,
    top_k: 5
  });
  
  return response.data;
};
