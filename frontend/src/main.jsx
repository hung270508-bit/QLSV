import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css' // <-- BẮT BUỘC phải có dòng này để nhận giao diện đẹp
import axios from 'axios'

// --- PHÒNG TRÁNH DOUBLE CLICK / TRÙNG LẶP THAO TÁC TOÀN HỆ THỐNG ---

// 1. Cấu hình Axios Interceptors chặn Request trùng lặp đang chạy (In-Flight)
const pendingRequests = new Map();

const getRequestKey = (config) => {
  let dataKey = '';
  try {
    if (config.data instanceof FormData) {
      const parts = [];
      if (typeof config.data.entries === 'function') {
        for (const [key, value] of config.data.entries()) {
          if (value instanceof File) {
            parts.push(`${key}:${value.name}:${value.size}:${value.lastModified}`);
          } else {
            parts.push(`${key}:${value}`);
          }
        }
      }
      dataKey = 'formdata:' + parts.join('|');
    } else if (typeof config.data === 'string') {
      dataKey = config.data;
    } else if (config.data) {
      dataKey = JSON.stringify(config.data);
    }
  } catch (e) {
    dataKey = 'fallback:' + Math.random();
  }
  return `${(config.method || 'get').toLowerCase()}_${config.url || ''}_${dataKey}`;
};

const removePendingRequest = (key) => {
  const timeoutId = pendingRequests.get(key);
  if (timeoutId && timeoutId !== true) {
    clearTimeout(timeoutId);
  }
  pendingRequests.delete(key);
};

axios.interceptors.request.use(
  (config) => {
    const method = (config.method || 'get').toLowerCase();
    // Chỉ chặn các request thay đổi dữ liệu (POST, PUT, PATCH, DELETE)
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      const key = getRequestKey(config);
      if (pendingRequests.has(key)) {
        console.warn('Hệ thống chặn request trùng lặp (Double Submit):', config.url);
        // Trả về một Promise không bao giờ resolve/reject để chặn âm thầm request thứ hai
        return new Promise(() => {});
      }

      // Đặt timeout 15s tự động giải phóng đề phòng request bị treo
      const timeoutId = setTimeout(() => {
        pendingRequests.delete(key);
      }, 15000);

      pendingRequests.set(key, timeoutId);
      config.__requestKey = key;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    const config = response.config;
    if (config && config.__requestKey) {
      removePendingRequest(config.__requestKey);
    }
    return response;
  },
  (error) => {
    const config = error.config;
    if (config && config.__requestKey) {
      removePendingRequest(config.__requestKey);
    }
    return Promise.reject(error);
  }
);

// 2. Chặn click liên tục vào nút thao tác ở tầng DOM (Capture Phase)
if (typeof document !== 'undefined') {
  document.addEventListener(
    'click',
    (e) => {
      const button = e.target.closest('button') || e.target.closest('input[type="submit"]') || e.target.closest('.btn');
      if (!button) return;

      const buttonText = button.textContent?.toLowerCase() || '';
      const buttonType = button.getAttribute('type');
      const isSubmitType = buttonType === 'submit';

      // Nhận diện các nút thao tác gửi/xóa/sửa dữ liệu
      const isWriteAction = isSubmitType || 
        /lưu|thêm|xóa|xác nhận|cập nhật|tạo|tải lên|gửi|save|add|delete|confirm|submit|create|upload|send/i.test(buttonText);

      if (isWriteAction) {
        if (button.dataset.doubleClickProtected === 'true') {
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        button.dataset.doubleClickProtected = 'true';
        const originalPointerEvents = button.style.pointerEvents;
        const originalOpacity = button.style.opacity;

        // Vô hiệu hóa click tạm thời
        button.style.pointerEvents = 'none';
        button.style.opacity = '0.6';

        setTimeout(() => {
          button.style.pointerEvents = originalPointerEvents;
          button.style.opacity = originalOpacity;
          delete button.dataset.doubleClickProtected;
        }, 1200); // Khoá trong 1.2 giây
      }
    },
    true // Chạy ở Capture Phase để chặn trước React Event Handler
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)