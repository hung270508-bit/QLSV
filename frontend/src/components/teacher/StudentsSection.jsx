import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users } from 'lucide-react';

function StudentsSection({ students, teachingAssignments }) {
  const [searchTerm, setSearchTerm] = useState('');

  const myClasses = teachingAssignments.map(a => a.MaLop);
  const myStudents = students.filter(s => myClasses.includes(s.MaLop));

  const filteredStudents = myStudents.filter(student =>
    student.HoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.MSSV.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 shadow-xl"
      >
        <h2 className="text-2xl font-bold text-white mb-2">Sinh viên</h2>
        <p className="text-orange-100">Danh sách sinh viên trong các lớp bạn giảng dạy</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        <input
          type="text"
          placeholder="Tìm kiếm sinh viên..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-xl border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-all shadow-lg"
        />
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <BookOpen className="text-gray-400 w-5 h-5" />
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100/50 overflow-hidden"
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
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => (
                  <motion.tr
                    key={student.MSSV}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05, type: "spring" }}
                    whileHover={{ x: 5, backgroundColor: "rgba(251, 146, 60, 0.05)" }}
                    className="border-b border-gray-100 transition-all cursor-pointer"
                  >
                    <td className="py-4 px-6 text-sm font-bold text-gray-800">{student.MSSV}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{student.HoTen}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{student.TenLop}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{student.Email || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{student.SoDienThoai || 'N/A'}</td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-16">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center text-gray-400"
                    >
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-10 h-10 text-gray-300" />
                      </div>
                      <p className="text-lg font-medium text-gray-600">Không tìm thấy sinh viên nào</p>
                      <p className="text-sm text-gray-400 mt-1">Thử tìm kiếm với từ khóa khác</p>
                    </motion.div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

export default StudentsSection;
