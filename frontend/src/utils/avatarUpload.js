import axios from 'axios';

export const handleAvatarUpload = async (e, user, apiUrl) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    alert('Vui lòng chọn ảnh có kích thước dưới 2MB');
    return;
  }

  const reader = new FileReader();
  reader.onload = async (event) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 250;
      const MAX_HEIGHT = 250;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
      
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await axios.post(`${apiUrl}/api/users/avatar`, { avatarBase64: compressedBase64 }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.success) {
          const updatedUser = { ...user, Avatar: compressedBase64 };
          if (localStorage.getItem('user')) localStorage.setItem('user', JSON.stringify(updatedUser));
          if (sessionStorage.getItem('user')) sessionStorage.setItem('user', JSON.stringify(updatedUser));
          // Reload to reflect changes globally
          window.location.reload();
        }
      } catch (err) {
        console.error(err);
        alert('Cập nhật ảnh đại diện thất bại!');
      }
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
};
