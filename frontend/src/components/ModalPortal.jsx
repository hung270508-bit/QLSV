import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

const ModalPortal = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Chỉ render portal khi component đã mount (tránh lỗi SSR hoặc hydration nếu có)
  if (!mounted) return null;

  // Render các thành phần con trực tiếp vào thẻ <body> của trang web
  return ReactDOM.createPortal(
    children,
    document.body
  );
};

export default ModalPortal;