import { StudentAnnouncementsSkeleton } from '../common/StudentSkeleton';
import React, { useState, useEffect } from 'react';
import API_URL from '../../api';
import { motion } from 'framer-motion';
import { Bell, Calendar, Megaphone, Loader2, Users, Pin } from 'lucide-react';
import axios from 'axios';

function StudentAnnouncements({ user }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/announcements/student/${user.username}`);
        setAnnouncements(res.data);
      } catch (error) {
        console.error("Lỗi tải thông báo:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.username) fetchAnnouncements();
  }, [user]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return <StudentAnnouncementsSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-[#F4C542] rounded-2xl p-6 text-[#152238] shadow-md flex items-center gap-4 relative overflow-hidden">
        <Bell className="w-10 h-10 relative z-10" />
        <div className="relative z-10">
          <h2 className="text-2xl font-bold">Bảng Thông Báo</h2>
          <p className="text-[#152238]/70">Cập nhật các tin tức và thông báo mới nhất từ Nhà trường</p>
        </div>
        <Megaphone className="absolute -right-6 -bottom-6 w-32 h-32 text-white opacity-10 transform -rotate-12" />
      </div>

      {/* Danh sách thông báo */}
      <div className="space-y-4">
        {announcements.length > 0 ? (
          announcements.map((item, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
              key={item.MaThongBao} 
              className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] p-5 hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              {/* Vạch màu chỉ định loại thông báo */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${item.PhamVi === 'Toàn trường' ? 'bg-[#F4C542]' : 'bg-[#3B82F6]/100'}`}></div>
              
              <div className="pl-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                  <h3 className="text-xl font-bold text-[#1F2937] flex-1 group-hover:text-[#F4C542] transition-colors">
                    {item.TieuDe}
                  </h3>
                  
                  {/* Nhãn phạm vi */}
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold w-fit sm:flex-shrink-0 ${item.PhamVi === 'Toàn trường' ? 'bg-[#F4C542]/20 text-[#B45309]' : 'bg-blue-100 text-blue-700'}`}>
                    {item.PhamVi === 'Toàn trường' ? <Megaphone className="w-3.5 h-3.5"/> : <Users className="w-3.5 h-3.5"/>}
                    {item.PhamVi}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#6B7280] mb-4 bg-[#F7F8FA] w-fit px-3 py-1.5 rounded-lg border border-[#E5E7EB]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-300" />
                    {formatDate(item.NgayTao)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Pin className="w-4 h-4 text-gray-300" />
                    Người đăng: {item.NguoiTaoTen || 'Admin'}
                  </span>
                </div>

                <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap bg-[#F7F8FA]/50 p-4 rounded-xl border border-gray-50">
                  {item.NoiDung}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-16 bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-sm">
            <div className="w-20 h-20 bg-[#F7F8FA] rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">Chưa có thông báo nào</h3>
            <p className="text-[#6B7280]">Hiện tại không có thông báo mới nào dành cho bạn.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentAnnouncements;
