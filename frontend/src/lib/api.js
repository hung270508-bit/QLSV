import axios from 'axios';

// Base URL của backend API. Có thể cấu hình qua biến môi trường Vite
// (VITE_API_URL), mặc định trỏ về server backend chạy local.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Đặt baseURL mặc định cho axios để mọi request dùng đường dẫn tương đối
// (vd: axios.get('/api/...')) đều tự động trỏ về backend.
axios.defaults.baseURL = API_URL;

export default axios;
