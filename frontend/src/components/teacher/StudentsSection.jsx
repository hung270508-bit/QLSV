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
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 shadow-xl"
      >
        <h2 className="text-2xl font-bold text-white mb-2">Sinh viên</h2>
        <p className="text-orange-100">Danh sách sinh viên theo từng lớp học phần bạn giảng dạy</p>
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
          className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-xl border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-all shadow-lg"
        />
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <BookOpen className="text-gray-400 w-5 h-5" />
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
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100/50 overflow-hidden mb-6"
          >
            <div 
              className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex justify-between items-center cursor-pointer hover:bg-orange-100/50 transition-colors"
              onClick={() => toggleGroup(group.MaLop)}
            >
              <div className="flex items-center gap-3">
                {isExpanded ? <ChevronDown className="w-5 h-5 text-orange-600" /> : <ChevronRight className="w-5 h-5 text-orange-600" />}
                <div>
                  <h3 className="text-lg font-bold text-orange-800">{group.TenLop || group.MaLop}</h3>
                  <p className="text-sm text-orange-600">Mã lớp: {group.MaLop}</p>
                </div>
              </div>
              <span className="bg-orange-200 text-orange-800 text-xs font-bold px-3 py-1 rounded-full">
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
                            className="border-b border-gray-100 transition-all cursor-pointer"
                          >
                            <td className="py-4 px-6 text-sm font-bold text-gray-800">{student.MSSV}</td>
                            <td className="py-4 px-6 text-sm text-gray-600">{student.HoTen}</td>
                            <td className="py-4 px-6 text-sm text-gray-600">{student.TenLop || student.MaLop || 'Chưa xếp lớp'}</td>
                            <td className="py-4 px-6 text-sm text-gray-600">{student.Email || 'Chưa cập nhật'}</td>
                            <td className="py-4 px-6 text-sm text-gray-600">{student.SoDienThoai || 'Chưa cập nhật'}</td>
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
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100/50 p-16 flex flex-col items-center justify-center text-gray-400"
        >
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Users className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-lg font-medium text-gray-600">Không tìm thấy sinh viên nào</p>
          <p className="text-sm text-gray-400 mt-1">Thử tìm kiếm với từ khóa khác</p>
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
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden z-10"
            >
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xl backdrop-blur-md uppercase">
                    {(selectedStudent.HoTen || 'S').charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{selectedStudent.HoTen || 'Chưa cập nhật tên'}</h3>
                    <p className="text-orange-100 text-sm">{selectedStudent.MSSV} • Lớp: {selectedStudent.TenLop || selectedStudent.MaLop || 'Chưa xếp lớp'}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex border-b border-gray-200 px-2 bg-gray-50/50">
                <button 
                  className={`flex-1 py-3.5 font-bold text-sm transition-colors ${activeTab === 'info' ? 'text-orange-600 border-b-2 border-orange-500' : 'text-gray-500 hover:text-gray-800'}`}
                  onClick={() => setActiveTab('info')}
                >Thông tin chung</button>
                <button 
                  className={`flex-1 py-3.5 font-bold text-sm transition-colors ${activeTab === 'grades' ? 'text-orange-600 border-b-2 border-orange-500' : 'text-gray-500 hover:text-gray-800'}`}
                  onClick={() => setActiveTab('grades')}
                >Điểm số</button>
                <button 
                  className={`flex-1 py-3.5 font-bold text-sm transition-colors ${activeTab === 'attendance' ? 'text-orange-600 border-b-2 border-orange-500' : 'text-gray-500 hover:text-gray-800'}`}
                  onClick={() => setActiveTab('attendance')}
                >Điểm danh</button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto bg-white">
                {activeTab === 'info' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Họ và tên</p>
                        <p className="font-bold text-gray-800 text-base">{selectedStudent.HoTen || 'Chưa cập nhật'}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">MSSV</p>
                        <p className="font-bold text-gray-800 text-base">{selectedStudent.MSSV}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Lớp sinh hoạt</p>
                        <p className="font-bold text-gray-800 text-base">{selectedStudent.TenLop || selectedStudent.MaLop || 'Chưa cập nhật'}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Email</p>
                        <p className="font-bold text-gray-800 text-base line-clamp-1">{selectedStudent.Email || 'Chưa cập nhật'}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 col-span-2">
                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Số điện thoại</p>
                        <p className="font-bold text-gray-800 text-base">{selectedStudent.SoDienThoai || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'grades' && (
                  <div>
                    {grades && grades.filter(g => g.MSSV === selectedStudent.MSSV).length > 0 ? (
                      <div className="space-y-4">
                        {grades.filter(g => g.MSSV === selectedStudent.MSSV).map((g, idx) => (
                          <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100">
                              <p className="font-bold text-gray-800">{g.TenMonHoc || 'Môn học'} <span className="text-xs font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200 ml-2">{g.MaLopHocPhan}</span></p>
                            </div>
                            <div className="grid grid-cols-4 gap-0 text-sm divide-x divide-gray-100">
                              <div className="p-3 text-center">
                                <p className="text-xs text-gray-500 font-bold mb-1">Điểm CC</p>
                                <p className="font-bold text-gray-700">{g.DiemChuyenCan !== null && g.DiemChuyenCan !== undefined ? g.DiemChuyenCan : '-'}</p>
                              </div>
                              <div className="p-3 text-center">
                                <p className="text-xs text-gray-500 font-bold mb-1">Điểm GK</p>
                                <p className="font-bold text-gray-700">{g.DiemGiuaKy !== null && g.DiemGiuaKy !== undefined ? g.DiemGiuaKy : '-'}</p>
                              </div>
                              <div className="p-3 text-center">
                                <p className="text-xs text-gray-500 font-bold mb-1">Điểm CK</p>
                                <p className="font-bold text-gray-700">{g.DiemCuoiKy !== null && g.DiemCuoiKy !== undefined ? g.DiemCuoiKy : '-'}</p>
                              </div>
                              <div className="bg-orange-50/50 p-3 text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-100/50 to-transparent"></div>
                                <div className="relative z-10">
                                  <p className="text-[10px] text-orange-600 font-bold uppercase mb-1">Tổng kết</p>
                                  <p className="font-black text-lg text-orange-700 leading-none">{g.DiemTongKet !== null && g.DiemTongKet !== undefined ? g.DiemTongKet : '-'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">Chưa có dữ liệu điểm cho sinh viên này.</p>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'attendance' && (
                  <div className="space-y-4">
                    {loadingAttendance ? (
                      <div className="flex flex-col items-center justify-center py-12 text-orange-500">
                        <Loader2 className="w-10 h-10 animate-spin mb-3" />
                        <p className="text-sm font-medium">Đang tải dữ liệu điểm danh...</p>
                      </div>
                    ) : studentAttendance && studentAttendance.length > 0 ? (
                      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-3">Ngày học</th>
                              <th className="px-4 py-3">Môn học</th>
                              <th className="px-4 py-3">Phòng / Ca</th>
                              <th className="px-4 py-3 text-center">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {studentAttendance.map((record, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-3 font-medium text-gray-800">
                                  {new Date(record.NgayHoc).toLocaleDateString('vi-VN')}
                                </td>
                                <td className="px-4 py-3">
                                  <p className="font-medium text-gray-700">{record.TenMonHoc}</p>
                                  <p className="text-xs text-gray-500">{record.MaLopHocPhan}</p>
                                </td>
                                <td className="px-4 py-3 text-gray-600">
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
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
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
                        <p className="text-gray-500 font-medium">Chưa có dữ liệu điểm danh cho sinh viên này.</p>
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
