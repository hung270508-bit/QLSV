import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AutoUpdate = () => {
  const currentVersion = useRef(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchVersion = async () => {
      if (isUpdating) return; 

      try {
        const basePath = import.meta.env.BASE_URL || '/';
        const url = `${basePath.endsWith('/') ? basePath : basePath + '/'}version.json?t=${Date.now()}`;
        
        const res = await fetch(url, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        });

        if (!res.ok) {
          console.warn('AutoUpdate version.json fetch returned status:', res.status);
          return;
        }
        
        const data = await res.json();
        
        if (!currentVersion.current) {
          currentVersion.current = data.version;
          console.log('AutoUpdate: Initialized version tracker at', data.version);
        } else if (currentVersion.current !== data.version) {
          console.log(`AutoUpdate: New version detected! Local: ${currentVersion.current}, Server: ${data.version}`);
          setIsUpdating(true);
          
          setTimeout(() => {
            window.location.reload();
          }, 2500);
        }
      } catch (error) {
        console.error('AutoUpdate check failed:', error);
      }
    };

    fetchVersion();
    const intervalId = setInterval(fetchVersion, 10000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isUpdating]);

  return (
    <AnimatePresence>
      {isUpdating && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Glassmorphism Background Overlay */}
          <div className="absolute inset-0 bg-white/70 backdrop-blur-md" />
          
          {/* Animated Gradient Background Blob */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: "linear" 
            }}
            className="absolute h-96 w-96 rounded-full bg-orange-300/30 blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.5, 1],
              rotate: [0, -90, 0],
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity,
              ease: "linear" 
            }}
            className="absolute mt-32 ml-32 h-64 w-64 rounded-full bg-amber-300/25 blur-3xl"
          />

          {/* Main Content Box */}
          <motion.div 
            initial={{ y: 50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, type: "spring", bounce: 0.4 }}
            className="relative z-10 flex w-[90%] max-w-sm flex-col items-center rounded-3xl border border-white/60 bg-white/70 p-10 text-center shadow-2xl shadow-orange-100/50 backdrop-blur-xl"
          >
            {/* Pulsing Icon */}
            <div className="relative mb-8 flex items-center justify-center">
              <motion.div 
                animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute h-24 w-24 rounded-full bg-orange-100/60"
              />
              <motion.div 
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                className="absolute h-20 w-20 rounded-full bg-amber-100/60"
              />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 shadow-[0_0_30px_rgba(249,115,22,0.4)]">
                <svg className="h-8 w-8 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>

            {/* Typography */}
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-3 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent"
            >
              Phát hiện phiên bản mới
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-sm font-medium text-slate-600"
            >
              Hệ thống đang đồng bộ và tải lại...
            </motion.p>
            
            {/* Progress Bar Simulator */}
            <div className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.5, ease: "linear" }}
                className="h-full bg-gradient-to-r from-orange-500 to-amber-400"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AutoUpdate;
