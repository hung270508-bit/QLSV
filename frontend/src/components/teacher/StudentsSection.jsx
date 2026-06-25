import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Users, ChevronDown, ChevronRight, X, Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import API_URL from '../../api';
import axios from 'axios';

function StudentsSection({ students, teachingAssignments, grades }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    if (selectedStudent && activeTab === 'attendance') {
      const fetchAttendance = async () => {
        setLoadingAttendance(true);
        try {
          const res = await axios.get(`${API_URL}/api/attendance/student/${selectedStudent.MSSV}`);
          setStudentAttendance(res.data);
        } catch (error) {
          console.error("Lỗi lấy điểm danh sinh viên:", error);
        } finally {
          setLoadingAttendance(false);
        }
      };
      fetchAttendance();
    }
  }, [selectedStudent, activeTab]);

  const toggleGroup = (maLop) => {
    setExpandedGroups(prev => ({
      ...prev,
      [maLop]: prev[maLop] === false ? true : false
    }));
  };

  // Group by Administrative Class (MaLop)
  const myClasses = teachingAssignments.map(a => a.MaLop);
  const myStudents = students.filter(s => myClasses.includes(s.MaLop));

  const groupedStudents = myStudents.reduce((acc, student) => {
    if (!acc[student.MaLop]) {
      acc[student.MaLop] = { TenLop: student.TenLop, students: [] };
    }
    acc[student.MaLop].students.push(student);
    return acc;
  }, {});

  const groupedFiltered = Object.entries(groupedStudents).map(([maLop, data]) => {
    return {
      MaLop: maLop,
      TenLop: data.TenLop,
      students: data.students.filter(student =>
        (student.HoTen && student.HoTen.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (student.MSSV && student.MSSV.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    };
  }).filter(group => group.students.length > 0);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-[#F4C542] rounded-2xl p-8 shadow-xl"
      >
        <h2 className="text-2xl font-bold text-[#152238] mb-2">Sinh viên</h2>
        <p className="text-[#152238]/70">Danh sách sinh viên theo từng lớp học phần bạn giảng dạy</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        <input
          type="text"
          placeholder="Tìm kiếm sinh viên theo tên hoặc MSSV..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-[#FFFFFF]/80 backdrop-blur-xl border-2 border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#F4C542] transition-all shadow-lg"
        />
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <BookOpen className="text-gray-300 w-5 h-5" />
        </div>
      </motion.div>

      {groupedFiltered.length > 0 ? (
        groupedFiltered.map((group, groupIndex) => {
          const isExpanded = expandedGroups[group.MaLop] !== false;
          return (
          <motion.div
            key={group.MaLop}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 + groupIndex * 0.1, type: "spring" }}
            className="bg-[#FFFFFF]/80 backdrop-blur-xl rounded-3xl shadow-xl border border-[#E5E7EB]/50 overflow-hidden mb-6"
          >
            <div 
              className="bg-[#FFF7D6] px-6 py-4 border-b border-[#FFF7D6] flex justify-between items-center cursor-pointer hover:bg-[#FFF7D6]/50 transition-colors"
              onClick={() => toggleGroup(group.MaLop)}
            >
              <div className="flex items-center gap-3">
                {isExpanded ? <ChevronDown className="w-5 h-5 text-[#F4C542]" /> : <ChevronRight className="w-5 h-5 text-[#F4C542]" />}
                <div>
                  <h3 className="text-lg font-bold text-[#F4C542]">{group.TenLop || group.MaLop}</h3>
                  <p className="text-sm text-[#F4C542]">Mã lớp: {group.MaLop}</p>
                </div>
              </div>
              <span className="bg-orange-200 text-[#F4C542] text-xs font-bold px-3 py-1 rounded-full">
                {group.students.length} sinh viên
              </span>
            </div>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-orange-50 to-amber-50">
                        <tr>
                          <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">MSSV</th>
                          <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">Họ tên</th>
                          <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">Lớp</th>
                          <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">Email</th>
                          <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">SĐT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.students.map((student, index) => (
                          <motion.tr
                            key={student.MSSV}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 * index }}
                            whileHover={{ x: 5, backgroundColor: "rgba(251, 146, 60, 0.05)" }}
                            onClick={() => {
                              setSelectedStudent(student);
                              setActiveTab('info');
                            }}
                            className="border-b border-[#E5E7EB] transition-all cursor-pointer"
                          >
                            <td className="py-4 px-6 text-sm font-bold text-[#1F2937]">{student.MSSV}</td>
                            <td className="py-4 px-6 text-sm text-[#6B7280]">{student.HoTen}</td>
                            <td className="py-4 px-6 text-sm text-[#6B7280]">{student.TenLop || student.MaLop || 'Chưa xếp lớp'}</td>
                            <td className="py-4 px-6 text-sm text-[#6B7280]">{student.Email || 'Chưa cập nhật'}</td>
                            <td className="py-4 px-6 text-sm text-[#6B7280]">{student.SoDienThoai || 'Chưa cập nhật'}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )})
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#FFFFFF]/80 backdrop-blur-xl rounded-3xl shadow-xl border border-[#E5E7EB]/50 p-16 flex flex-col items-center justify-center text-gray-300"
        >
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Users className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-lg font-medium text-[#6B7280]">Không tìm thấy sinh viên nào</p>
          <p className="text-sm text-gray-300 mt-1">Thử tìm kiếm với từ khóa khác</p>
        </motion.div>
      )}

      {/* MODAL THÔNG TIN SINH VIÊN */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedStudent(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-[#FFFFFF] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden z-10"
            >
              <div className="bg-[#F4C542] px-6 py-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#FFFFFF]/30 rounded-full flex items-center justify-center text-[#152238] font-bold text-xl backdrop-blur-md uppercase">
                    {(selectedStudent.HoTen || 'S').charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-[#152238] font-bold text-lg">{selectedStudent.HoTen || 'Chưa cập nhật tên'}</h3>
                    <p className="text-[#152238]/70 text-sm">{selectedStudent.MSSV} • Lớp: {selectedStudent.TenLop || selectedStudent.MaLop || 'Chưa xếp lớp'}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="text-[#152238] hover:bg-[#FFFFFF]/30 p-2 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex border-b border-[#E5E7EB] px-2 bg-[#F7F8FA]/50">
                <button 
                  className={`flex-1 py-3.5 font-bold text-sm transition-colors ${activeTab === 'info' ? 'text-[#F4C542] border-b-2 border-[#F4C542]' : 'text-[#6B7280] hover:text-[#1F2937]'}`}
                  onClick={() => setActiveTab('info')}
                >Thông tin chung</button>
                <button 
                  className={`flex-1 py-3.5 font-bold text-sm transition-colors ${activeTab === 'grades' ? 'text-[#F4C542] border-b-2 border-[#F4C542]' : 'text-[#6B7280] hover:text-[#1F2937]'}`}
                  onClick={() => setActiveTab('grades')}
                >Điểm số</button>
                <button 
                  className={`flex-1 py-3.5 font-bold text-sm transition-colors ${activeTab === 'attendance' ? 'text-[#F4C542] border-b-2 border-[#F4C542]' : 'text-[#6B7280] hover:text-[#1F2937]'}`}
                  onClick={() => setActiveTab('attendance')}
                >Điểm danh</button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto bg-[#FFFFFF]">
                {activeTab === 'info' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                      <div className="bg-[#F7F8FA] p-4 rounded-xl border border-[#E5E7EB]">
                        <p className="text-xs text-[#6B7280] font-bold uppercase mb-1">Họ và tên</p>
                        <p className="font-bold text-[#1F2937] text-base">{selectedStudent.HoTen || 'Chưa cập nhật'}</p>
                      </div>
                      <div className="bg-[#F7F8FA] p-4 rounded-xl border border-[#E5E7EB]">
                        <p className="text-xs text-[#6B7280] font-bold uppercase mb-1">MSSV</p>
                        <p className="font-bold text-[#1F2937] text-base">{selectedStudent.MSSV}</p>
                      </div>
                      <div className="bg-[#F7F8FA] p-4 rounded-xl border border-[#E5E7EB]">
                        <p className="text-xs text-[#6B7280] font-bold uppercase mb-1">Lớp sinh hoạt</p>
                        <p className="font-bold text-[#1F2937] text-base">{selectedStudent.TenLop || selectedStudent.MaLop || 'Chưa cập nhật'}</p>
                      </div>
                      <div className="bg-[#F7F8FA] p-4 rounded-xl border border-[#E5E7EB]">
                        <p className="text-xs text-[#6B7280] font-bold uppercase mb-1">Email</p>
                        <p className="font-bold text-[#1F2937] text-base line-clamp-1">{selectedStudent.Email || 'Chưa cập nhật'}</p>
                      </div>
                      <div className="bg-[#F7F8FA] p-4 rounded-xl border border-[#E5E7EB] col-span-2">
                        <p className="text-xs text-[#6B7280] font-bold uppercase mb-1">Số điện thoại</p>
                        <p className="font-bold text-[#1F2937] text-base">{selectedStudent.SoDienThoai || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'grades' && (
                  <div>
                    {grades && grades.filter(g => g.MSSV === selectedStudent.MSSV).length > 0 ? (
                      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="bg-[#F7F8FA]/80 border-b border-[#E5E7EB]">
                              <tr>
                                <th className="py-4 px-5 text-xs font-black text-[#6B7280] uppercase tracking-wider">Môn học</th>
                                <th className="py-4 px-3 text-xs font-black text-[#6B7280] uppercase tracking-wider text-center">CC</th>
                                <th className="py-4 px-3 text-xs font-black text-[#6B7280] uppercase tracking-wider text-center">BT</th>
                                <th className="py-4 px-3 text-xs font-black text-[#6B7280] uppercase tracking-wider text-center">GK</th>
                                <th className="py-4 px-3 text-xs font-black text-[#6B7280] uppercase tracking-wider text-center">CK</th>
                                <th className="py-4 px-4 text-xs font-black text-[#1F2937] uppercase tracking-wider text-center bg-gray-100/50">Hệ 10</th>
                                <th className="py-4 px-4 text-xs font-black text-[#152238] uppercase tracking-wider text-center bg-[#FFF7D6]/50">GPA</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {grades.filter(g => g.MSSV === selectedStudent.MSSV).map((g, idx) => {
                                const hasScore = g.DiemChuyenCan != null || g.DiemBaiTap != null || g.DiemGiuaKy != null || g.DiemCuoiKy != null;
                                let t10 = null;
                                if (g.DiemTongKet !== null && g.DiemTongKet !== undefined) t10 = parseFloat(g.DiemTongKet);
                                else if (g.DiemTong !== null && g.DiemTong !== undefined) t10 = parseFloat(g.DiemTong);
                                else if (hasScore) {
                                  const cc = parseFloat(g.DiemChuyenCan) || 0;
                                  const bt = parseFloat(g.DiemBaiTap) || 0;
                                  const gk = parseFloat(g.DiemGiuaKy) || 0;
                                  const ck = parseFloat(g.DiemCuoiKy) || 0;
                                  t10 = cc * 0.1 + bt * 0.2 + gk * 0.2 + ck * 0.5;
                                }

                                let gpaStr = '—';
                                if (t10 !== null) {
                                  if (t10 >= 8.5) gpaStr = '4.0';
                                  else if (t10 >= 8.0) gpaStr = '3.5';
                                  else if (t10 >= 7.0) gpaStr = '3.0';
                                  else if (t10 >= 6.5) gpaStr = '2.5';
                                  else if (t10 >= 5.5) gpaStr = '2.0';
                                  else if (t10 >= 5.0) gpaStr = '1.5';
                                  else if (t10 >= 4.0) gpaStr = '1.0';
                                  else gpaStr = '0.0';
                                }
                                return (
                                  <tr key={idx} className="hover:bg-[#3B82F6]/10 transition-colors group">
                                    <td className="py-4 px-5">
                                      <p className="text-sm font-bold text-[#1F2937]">{g.TenMonHoc || 'Môn học'}</p>
                                      <p className="text-xs text-[#6B7280] mt-0.5">{g.MaLopHocPhan}</p>
                                    </td>
                                    <td className="py-4 px-3 text-sm text-center text-[#6B7280] font-medium">{g.DiemChuyenCan !== null && g.DiemChuyenCan !== undefined ? g.DiemChuyenCan : '—'}</td>
                                    <td className="py-4 px-3 text-sm text-center text-[#6B7280] font-medium">{g.DiemBaiTap !== null && g.DiemBaiTap !== undefined ? g.DiemBaiTap : '—'}</td>
                                    <td className="py-4 px-3 text-sm text-center text-[#6B7280] font-medium">{g.DiemGiuaKy !== null && g.DiemGiuaKy !== undefined ? g.DiemGiuaKy : '—'}</td>
                                    <td className="py-4 px-3 text-sm text-center text-[#6B7280] font-medium">{g.DiemCuoiKy !== null && g.DiemCuoiKy !== undefined ? g.DiemCuoiKy : '—'}</td>
                                    <td className="py-4 px-4 text-sm text-center font-black text-[#1F2937] bg-[#F7F8FA]/50 group-hover:bg-transparent">{t10 !== null ? t10.toFixed(2) : '—'}</td>
                                    <td className="py-4 px-4 text-sm text-center font-black text-[#F4C542] bg-[#FFF7D6]/50 group-hover:bg-transparent">{gpaStr}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-[#6B7280] font-medium">Chưa có dữ liệu điểm cho sinh viên này.</p>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'attendance' && (
                  <div className="space-y-4">
                    {loadingAttendance ? (
                      <div className="flex flex-col items-center justify-center py-12 text-[#F4C542]">
                        <Loader2 className="w-10 h-10 animate-spin mb-3" />
                        <p className="text-sm font-medium">Đang tải dữ liệu điểm danh...</p>
                      </div>
                    ) : studentAttendance && studentAttendance.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] shadow-sm">
                        <table className="w-full min-w-[500px] text-sm text-left">
                          <thead className="bg-[#F7F8FA] text-[#6B7280] font-medium border-b border-[#E5E7EB]">
                            <tr>
                              <th className="px-4 py-3">Ngày học</th>
                              <th className="px-4 py-3">Môn học</th>
                              <th className="px-4 py-3">Phòng / Ca</th>
                              <th className="px-4 py-3 text-center">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {studentAttendance.map((record, idx) => (
                              <tr key={idx} className="hover:bg-[#F7F8FA]/50 transition-colors">
                                <td className="px-4 py-3 font-medium text-[#1F2937]">
                                  {new Date(record.NgayHoc).toLocaleDateString('vi-VN')}
                                </td>
                                <td className="px-4 py-3">
                                  <p className="font-medium text-gray-700">{record.TenMonHoc}</p>
                                  <p className="text-xs text-[#6B7280]">{record.MaLopHocPhan}</p>
                                </td>
                                <td className="px-4 py-3 text-[#6B7280]">
                                  {record.PhongHoc || '-'} / Ca {record.CaHoc || '-'}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {record.TrangThai === 'Có mặt' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Có mặt
                                    </span>
                                  ) : record.TrangThai === 'Vắng mặt' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                                      <AlertCircle className="w-3.5 h-3.5" /> Vắng mặt
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-[#1F2937]">
                                      <Clock className="w-3.5 h-3.5" /> {record.TrangThai}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-[#6B7280] font-medium">Chưa có dữ liệu điểm danh cho sinh viên này.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default StudentsSection;
