import { StudentGradesSkeleton } from '../common/StudentSkeleton';
import React, { useState, useEffect } from 'react';
import API_URL from '../../api';
import { motion } from 'framer-motion';
import { BookOpen, Award, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import axios from 'axios';

function StudentGrades({ user }) {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyGrades = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/grades/student/${user.username}`);
        setGrades(response.data);
      } catch (error) {
        console.error('Lỗi khi tải điểm:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.username) {
      fetchMyGrades();
    }
  }, [user]);

  const groupedGrades = grades.reduce((acc, grade) => {
    const hk = grade.HocKy || 'Học kỳ chưa xác định';
    if (!acc[hk]) acc[hk] = [];
    acc[hk].push(grade);
    return acc;
  }, {});

// Kiểm tra xem môn này ĐÃ ĐƯỢC CHẤM ĐIỂM chưa (Dựa vào việc có Điểm chữ hay không)
  const isGraded = (diemChu) => {
    return diemChu && diemChu.trim() !== '' && diemChu !== '-';
  };

  const isPassed = (diemChu) => {
    return isGraded(diemChu) && diemChu !== 'F' && diemChu !== 'F+'; 
  };

  const calculateSemesterStats = (semesterGrades) => {
    let totalCredits = 0;       // Tổng tín chỉ đăng ký (chỉ để hiển thị)
    let gradedCredits = 0;      // Tổng tín chỉ ĐÃ CÓ ĐIỂM (dùng để chia GPA)
    let earnedCredits = 0;      // Tổng tín chỉ thi qua
    let totalGradePoints = 0;

    semesterGrades.forEach(grade => {
      const tinChi = parseInt(grade.SoTinChi) || 0;
      totalCredits += tinChi; // Luôn cộng dồn để biết kỳ này học mấy tín

      // CHỈ TÍNH GPA CHO NHỮNG MÔN ĐÃ CÓ ĐIỂM
      if (isGraded(grade.DiemChu)) {
        gradedCredits += tinChi;
        const gpa = parseFloat(grade.DiemGPA) || 0;
        totalGradePoints += gpa * tinChi;

        if (isPassed(grade.DiemChu)) {
          earnedCredits += tinChi;
        }
      }
    });

    // Chia GPA dựa trên số tín chỉ đã có điểm
    const semesterGPA = gradedCredits > 0 ? (totalGradePoints / gradedCredits).toFixed(2) : '0.00';
    return { earnedCredits, semesterGPA, totalCredits };
  };

  const calculateCumulativeStats = () => {
    let totalAccumulatedCredits = 0;
    let totalGradePoints = 0;
    let totalCreditsAttempted = 0; 

    grades.forEach(grade => {
      // CHỈ TÍNH VÀO TÍCH LŨY NẾU ĐÃ CÓ ĐIỂM
      if (isGraded(grade.DiemChu)) {
        const tinChi = parseInt(grade.SoTinChi) || 0;
        const gpa = parseFloat(grade.DiemGPA) || 0;

        totalCreditsAttempted += tinChi;
        if (isPassed(grade.DiemChu)) {
          totalAccumulatedCredits += tinChi;
        }
        totalGradePoints += gpa * tinChi;
      }
    });

    const cumulativeGPA = totalCreditsAttempted > 0 ? (totalGradePoints / totalCreditsAttempted).toFixed(2) : '0.00';
    return { totalAccumulatedCredits, cumulativeGPA };
  };

  const { totalAccumulatedCredits, cumulativeGPA } = calculateCumulativeStats();

  if (loading) {
    return <StudentGradesSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between mb-4 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1F2937]">Kết quả học tập</h2>
          <p className="text-sm text-[#6B7280]">Chi tiết bảng điểm và tiến độ học tập tích lũy</p>
        </div>
      </div>

      {/* Thẻ Thống kê Tổng quan (Tích lũy toàn khóa) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#F4C542] to-[#F4C542]/90 rounded-2xl p-6 text-white shadow-lg shadow-[#F4C542]/30 flex items-center justify-between"
        >
          <div>
            <p className="text-[#152238]/70 font-medium mb-1">Điểm trung bình tích lũy (Hệ 4)</p>
            <h3 className="text-4xl font-bold">{cumulativeGPA}</h3>
          </div>
          <div className="p-4 bg-white/40 rounded-xl backdrop-blur-sm">
            <TrendingUp className="w-8 h-8 text-[#152238]" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-[#FFFFFF] border-2 border-[#FFF7D6] rounded-2xl p-6 shadow-sm flex items-center justify-between"
        >
          <div>
            <p className="text-[#6B7280] font-medium mb-1">Số tín chỉ tích lũy</p>
            <h3 className="text-4xl font-bold text-[#1F2937]">{totalAccumulatedCredits} <span className="text-lg font-normal text-gray-300">tín chỉ</span></h3>
          </div>
          <div className="p-4 bg-[#FFF7D6] rounded-xl">
            <Award className="w-8 h-8 text-[#F4C542]" />
          </div>
        </motion.div>
      </div>

      {/* Danh sách điểm chi tiết theo từng Học kỳ */}
      {Object.keys(groupedGrades).length > 0 ? (
        Object.keys(groupedGrades).sort().reverse().map((semester, index) => {
          const semesterGrades = groupedGrades[semester];
          const stats = calculateSemesterStats(semesterGrades);

          return (
            <motion.div
              key={semester}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
              className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden mb-6"
            >
              {/* Header Học Kỳ */}
              <div className="bg-[#F7F8FA] px-6 py-4 border-b border-[#E5E7EB] flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#F4C542]" />
                <h3 className="text-lg font-bold text-[#1F2937]">
                  {semester.replace('_', ' ').replace('_', '-')}
                </h3>
              </div>

              {/* Mobile: card list */}
              <div className="block sm:hidden divide-y divide-gray-50">
                {semesterGrades.map((grade) => (
                  <div key={grade.MaDiem} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-[#1F2937] flex-1 mr-2">{grade.TenMonHoc}</p>
                      <span className={`shrink-0 inline-block px-2.5 py-0.5 rounded-lg font-bold text-sm ${
                        grade.DiemChu === 'F' ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#22C55E]/20 text-[#22C55E]'
                      }`}>{grade.DiemChu || '-'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#6B7280] flex-wrap">
                      <span>{grade.SoTinChi || 0} TC</span>
                      <span>CC: {grade.DiemChuyenCan || '-'}</span>
                      <span>GK: {grade.DiemGiuaKy || '-'}</span>
                      <span>CK: {grade.DiemCuoiKy || '-'}</span>
                      <span className="font-bold text-[#1F2937]">TB: {grade.DiemTong || '-'}</span>
                      <span className="font-bold text-[#F4C542]">GPA: {grade.DiemGPA || '-'}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop: full table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#FFFFFF] border-b border-[#E5E7EB]">
                    <tr>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-[#6B7280]">Mã môn</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-[#6B7280]">Tên môn học</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-[#6B7280]">Tín chỉ</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-[#6B7280]" title="Chuyên cần">CC (10%)</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-[#6B7280]" title="Bài tập">BT (15%)</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-[#6B7280]" title="Giữa kỳ">GK (25%)</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-[#6B7280]" title="Cuối kỳ">CK (50%)</th>
                      <th className="text-center py-3 px-4 text-sm font-bold text-[#1F2937]">Hệ 10</th>
                      <th className="text-center py-3 px-4 text-sm font-bold text-[#152238]">Hệ 4</th>
                      <th className="text-center py-3 px-6 text-sm font-semibold text-[#6B7280]">Điểm chữ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semesterGrades.map((grade) => (
                      <tr key={grade.MaDiem} className="border-b border-gray-50 hover:bg-[#FFF7D6]/50 transition-colors">
                        <td className="py-3 px-6 text-sm font-bold text-[#6B7280]">{grade.MaLopHocPhan || grade.MaMonHoc || 'N/A'}</td>
                        <td className="py-3 px-6 text-sm text-[#1F2937]">{grade.TenMonHoc}</td>
                        <td className="py-3 px-4 text-sm text-center text-[#6B7280]">{grade.SoTinChi || 0}</td>
                        <td className="py-3 px-4 text-sm text-center text-[#6B7280]">{grade.DiemChuyenCan || '-'}</td>
                        <td className="py-3 px-4 text-sm text-center text-[#6B7280]">{grade.DiemBaiTap || '-'}</td>
                        <td className="py-3 px-4 text-sm text-center text-[#6B7280]">{grade.DiemGiuaKy || '-'}</td>
                        <td className="py-3 px-4 text-sm text-center text-[#6B7280]">{grade.DiemCuoiKy || '-'}</td>
                        <td className="py-3 px-4 text-sm text-center font-bold text-[#1F2937]">{grade.DiemTong || '-'}</td>
                        <td className="py-3 px-4 text-sm text-center font-bold text-[#F4C542]">{grade.DiemGPA || '-'}</td>
                        <td className="py-3 px-6 text-sm text-center">
                          <span className={`inline-block px-3 py-1 rounded-lg font-bold text-sm ${
                            grade.DiemChu === 'F' ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#22C55E]/20 text-[#22C55E]'
                          }`}>{grade.DiemChu || '-'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tổng kết Học kỳ */}
              <div className="bg-[#FFF7D6]/50 px-6 py-4 border-t border-[#E5E7EB]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-sm text-[#6B7280] mb-1">Điểm trung bình học kỳ:</p>
                      <p className="text-xl font-bold text-[#F4C542]">{stats.semesterGPA}</p>
                    </div>
                    <div className="h-8 w-px bg-gray-300 hidden md:block"></div>
                    <div>
                      <p className="text-sm text-[#6B7280] mb-1">Số tín chỉ đạt kỳ này:</p>
                      <p className="text-xl font-bold text-[#1F2937]">{stats.earnedCredits} <span className="text-sm font-normal text-[#6B7280]">/ {stats.totalCredits}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })
      ) : (
        <div className="bg-[#FFFFFF] rounded-2xl p-12 text-center shadow-sm border border-[#E5E7EB]">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">Chưa có dữ liệu điểm</h3>
          <p className="text-[#6B7280]">Hệ thống chưa ghi nhận điểm số nào cho tài khoản của bạn.</p>
        </div>
      )}
    </div>
  );
}

export default StudentGrades;
