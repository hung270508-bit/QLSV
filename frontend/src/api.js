// Tự động kiểm tra xem trình duyệt đang mở ở localhost hay online
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000' // Nếu chạy dưới máy local, gọi sang backend localhost:5000
    : 'https://qlsv-huq1.onrender.com'; // Nếu chạy online, gọi sang backend Render

export default API_URL;