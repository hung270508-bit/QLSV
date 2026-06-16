// Tự động kiểm tra xem trình duyệt đang mở ở localhost hay online
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000' // Nếu chạy dưới máy local, gọi sang backend localhost:5000
    : 'https://qlsv-backend.vercel.app'; // Hãy thay URL này bằng URL Vercel Backend sau khi bạn deploy thành công!

export default API_URL;