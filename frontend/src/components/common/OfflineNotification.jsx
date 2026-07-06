import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const OfflineNotification = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return children;
  }

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-[999999] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col border border-gray-100"
      >
        <div className="bg-gradient-to-r from-gray-500 to-gray-700 px-8 py-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_white_0%,_transparent_100%)]"></div>
          <div className="bg-white/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10 backdrop-blur-sm border border-white/30 shadow-inner">
            <WifiOff className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white relative z-10 tracking-wide">MẤT KẾT NỐI</h2>
        </div>
        <div className="p-8 text-center space-y-6">
          <div className="text-gray-600 text-sm font-medium leading-relaxed">
            Có vẻ như bạn đang ngoại tuyến. Vui lòng kiểm tra lại kết nối mạng của bạn để tiếp tục sử dụng ứng dụng.
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <RefreshCw className="w-5 h-5" />
            Thử lại
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default OfflineNotification;
