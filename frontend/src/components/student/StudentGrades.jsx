import { StudentGradesSkeleton } from '../common/StudentSkeleton';
import { useState, useEffect } from 'react';
import API_URL from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Award, TrendingUp, Calendar, Compass, Calculator, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';

function StudentGrades({ user }) {
  const [activeTab, setActiveTab] = useState('transcript'); // 'transcript', 'roadmap', 'forecast'

  // Data States
  const [grades, setGrades] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [studentDetails, setStudentDetails] = useState(null);

  const [loading, setLoading] = useState(true);

  const [targetGPA, setTargetGPA] = useState(''); // Goal-based planner target

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [gradesRes, myCoursesRes, subjectsRes, detailsRes] = await Promise.all([
          axios.get(`${API_URL}/api/grades/student/${user.username}`),
          axios.get(`${API_URL}/api/enrollment/my-courses/${user.username}`),
          axios.get(`${API_URL}/api/subjects`),
          axios.get(`${API_URL}/api/students/${user.username}/details`)
        ]);

        setGrades(gradesRes.data || []);
        setMyCourses(myCoursesRes.data || []);
        setAllSubjects(subjectsRes.data || []);
        if (detailsRes.data && detailsRes.data.length > 0) {
          setStudentDetails(detailsRes.data[0]);
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu học tập:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.username) {
      fetchAllData();
    }
  }, [user]);

  // Standard Helpers
  const isGraded = (diemChu) => {
    return diemChu && diemChu.trim() !== '' && diemChu !== '-';
  };

  const isPassed = (diemChu) => {
    return isGraded(diemChu) && diemChu !== 'F' && diemChu !== 'F+';
  };



  // Group grades by semester for Transcript tab
  const groupedGrades = grades.reduce((acc, grade) => {
    const hk = grade.HocKy || 'Học kỳ chưa xác định';
    if (!acc[hk]) acc[hk] = [];
    acc[hk].push(grade);
    return acc;
  }, {});

  const calculateSemesterStats = (semesterGrades) => {
    let totalCredits = 0;
    let gradedCredits = 0;
    let earnedCredits = 0;
    let totalGradePoints = 0;

    semesterGrades.forEach(grade => {
      const tinChi = parseInt(grade.SoTinChi) || 0;
      totalCredits += tinChi;

      if (isGraded(grade.DiemChu)) {
        gradedCredits += tinChi;
        const gpa = parseFloat(grade.DiemGPA) || 0;
        totalGradePoints += gpa * tinChi;

        if (isPassed(grade.DiemChu)) {
          earnedCredits += tinChi;
        }
      }
    });

    const semesterGPA = gradedCredits > 0 ? (totalGradePoints / gradedCredits).toFixed(2) : '0.00';
    return { earnedCredits, semesterGPA, totalCredits };
  };

  const calculateCumulativeStats = () => {
    let totalAccumulatedCredits = 0;
    let totalGradePoints = 0;
    let totalCreditsAttempted = 0;

    grades.forEach(grade => {
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
    return { totalAccumulatedCredits, cumulativeGPA, totalCreditsAttempted, totalGradePoints };
  };

  const { totalAccumulatedCredits, cumulativeGPA, totalGradePoints } = calculateCumulativeStats();

  // Curriculum configuration based on 120-150 TC required credits (default to 120)
  const totalRequiredCredits = studentDetails?.TinChiYeuCau || 120;
  // Hardcoded 20 credits for General Education, remainder for Specialization
  const requiredGeneralCredits = 20;
  const requiredSpecialCredits = Math.max(0, totalRequiredCredits - 20);

  // Filter subjects for Curriculum Roadmap
  // General Education: takes all subjects where LoaiMonHoc is 'Đại cương'
  const generalSubjects = allSubjects.filter(
    sub => sub.LoaiMonHoc === 'Đại cương'
  );

  // Specialization: takes all subjects where LoaiMonHoc is 'Chuyên ngành' and matches the student's Faculty
  const specialSubjects = allSubjects.filter(
    sub => sub.MaKhoa === studentDetails?.MaKhoa && sub.LoaiMonHoc === 'Chuyên ngành'
  );

  // Helper to determine status and grade of a subject
  const getSubjectStatus = (subjectCode) => {
    // 1. Check if graded
    const gradeRecord = grades.find(g => g.MaMonHoc === subjectCode);
    if (gradeRecord) {
      if (isGraded(gradeRecord.DiemChu)) {
        return {
          status: isPassed(gradeRecord.DiemChu) ? 'PASSED' : 'FAILED',
          grade: gradeRecord.DiemChu,
          gpa: gradeRecord.DiemGPA
        };
      }
      return { status: 'IN_PROGRESS' };
    }

    // 2. Check if registered in myCourses
    const isEnrolled = myCourses.some(c => c.MaMonHoc === subjectCode);
    if (isEnrolled) {
      return { status: 'IN_PROGRESS' };
    }

    return { status: 'NOT_STARTED' };
  };

  // Calculate actual earned credits for each category
  const calculateCategoryCredits = (subjectsList) => {
    let earned = 0;
    let enrolled = 0;
    subjectsList.forEach(sub => {
      const info = getSubjectStatus(sub.MaMonHoc);
      const tinChi = parseInt(sub.SoTinChi) || 0;
      if (info.status === 'PASSED') {
        earned += tinChi;
      } else if (info.status === 'IN_PROGRESS') {
        enrolled += tinChi;
      }
    });
    return { earned, enrolled };
  };

  const generalCreditsStats = calculateCategoryCredits(generalSubjects);
  const specialCreditsStats = calculateCategoryCredits(specialSubjects);

  // Graduation progress calculations (capped at the target distribution values)
  const cappedGeneralCredits = Math.min(generalCreditsStats.earned, requiredGeneralCredits);
  const cappedSpecialCredits = Math.min(specialCreditsStats.earned, requiredSpecialCredits);
  const cappedTotalCredits = cappedGeneralCredits + cappedSpecialCredits;
  const graduationProgressPercent = Math.min(Math.round((cappedTotalCredits / totalRequiredCredits) * 100), 100);

  if (loading) {
    return <StudentGradesSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#152238] to-[#1e325c] rounded-3xl p-8 sm:p-10 shadow-lg text-white">
        <div className="relative z-10">
          <h2 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight text-white">
            Kết quả & Tiến độ học tập
          </h2>
          <p className="text-[#94a3b8] font-medium text-sm sm:text-base max-w-xl">
            Theo dõi chi tiết bảng điểm, lộ trình đào tạo khoa <span className="text-[#F4C542] font-bold">{studentDetails?.TenKhoa || '—'}</span> và hoạch định mục tiêu tốt nghiệp.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 translate-y-1/2 w-48 h-48 bg-[#F4C542]/10 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 right-12 -translate-y-1/2 text-white/5 hidden md:block">
          <Award className="w-32 h-32" />
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200/80 pb-px">
        {[
          { id: 'transcript', icon: Calendar, label: 'Bảng điểm học kỳ' },
          { id: 'roadmap', icon: Compass, label: 'Bản đồ đào tạo' },
          { id: 'forecast', icon: Calculator, label: 'Dự đoán điểm số' }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-bold transition-all ${isActive ? 'text-[#152238]' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50/50 rounded-t-xl'
                }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#F4C542]' : 'text-gray-400'}`} />
              {tab.label}

              {/* Active animated indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicatorGrades"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-[#F4C542] rounded-t-full shadow-[0_-2px_10px_rgba(244,197,66,0.3)]"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content rendering */}
      <AnimatePresence mode="wait">
        {activeTab === 'transcript' && (
          <motion.div
            key="transcript"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Quick stats overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="relative overflow-hidden bg-gradient-to-br from-[#152238] to-[#1e325c] rounded-2xl p-6 shadow-lg flex items-center justify-between group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                <div className="relative z-10">
                  <p className="text-[#94a3b8] font-semibold mb-1 text-sm uppercase tracking-wider">GPA tích lũy</p>
                  <h3 className="text-4xl font-black text-white tracking-tight">{cumulativeGPA}</h3>
                </div>
                <div className="relative z-10 p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-8 h-8 text-[#F4C542]" />
                </div>
              </div>

              <div className="relative overflow-hidden bg-gradient-to-br from-[#F4C542] to-[#f5d061] rounded-2xl p-6 shadow-lg flex items-center justify-between group text-[#152238]">
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out skew-x-12"></div>
                <div className="relative z-10">
                  <p className="text-[#152238]/70 font-bold mb-1 text-sm uppercase tracking-wider">Số tín chỉ tích lũy</p>
                  <h3 className="text-4xl font-black tracking-tight flex items-baseline gap-1">
                    {totalAccumulatedCredits} <span className="text-lg font-bold text-[#152238]/60">/ {totalRequiredCredits}</span>
                  </h3>
                </div>
                <div className="relative z-10 p-4 bg-[#152238]/10 rounded-2xl backdrop-blur-md border border-[#152238]/10 group-hover:scale-110 transition-transform duration-300">
                  <Award className="w-8 h-8 text-[#152238]" />
                </div>
              </div>
            </div>

            {/* Semester Transcript list */}
            {Object.keys(groupedGrades).length > 0 ? (
              Object.keys(groupedGrades).sort().reverse().map((semester) => {
                const semesterGrades = groupedGrades[semester];
                const stats = calculateSemesterStats(semesterGrades);

                return (
                  <div key={semester} className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                    {/* Semester Header */}
                    <div className="bg-gradient-to-r from-blue-50/50 to-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100/50 rounded-lg text-blue-600 shadow-sm">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-[#1F2937]">
                          {semester.replace('_', ' ').replace('_', '-')}
                        </h3>
                      </div>
                      <div className="text-xs font-bold text-blue-700 bg-blue-100/50 px-3 py-1 rounded-full border border-blue-200/50">
                        {semesterGrades.length} Môn học
                      </div>
                    </div>

                    {/* Mobile: card list */}
                    <div className="block sm:hidden divide-y divide-gray-100">
                      {semesterGrades.map((grade) => (
                        <div key={grade.MaDiem} className="px-4 py-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-gray-800 mr-2">{grade.TenMonHoc}</p>
                            <span className={`shrink-0 inline-block px-2.5 py-0.5 rounded-lg font-bold text-xs border ${grade.DiemChu === 'A' || grade.DiemChu === 'A+' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              grade.DiemChu === 'B' || grade.DiemChu === 'B+' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                grade.DiemChu === 'C' || grade.DiemChu === 'C+' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  grade.DiemChu === 'D' || grade.DiemChu === 'D+' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                    grade.DiemChu === 'F' ? 'bg-red-50 text-red-600 border-red-200' :
                                      'bg-gray-50 text-gray-700 border-gray-200'
                              }`}>{grade.DiemChu || '-'}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-500 font-medium">
                            <div>Mã môn: <span className="font-bold text-gray-700">{grade.MaMonHoc}</span></div>
                            <div>Tín chỉ: <span className="font-bold text-gray-700">{grade.SoTinChi}</span></div>
                            <div>Điểm tổng: <span className="font-bold text-gray-700">{grade.DiemTong || '-'}</span></div>
                            <div>Chuyên cần: <span className="font-bold text-gray-700">{grade.DiemChuyenCan || '-'}</span></div>
                            <div>Giữa kỳ: <span className="font-bold text-gray-700">{grade.DiemGiuaKy || '-'}</span></div>
                            <div>Cuối kỳ: <span className="font-bold text-gray-700">{grade.DiemCuoiKy || '-'}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop: full table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-[#FFFFFF] border-b border-gray-200">
                          <tr>
                            <th className="text-left py-3 px-6 text-sm font-semibold text-gray-500">Mã môn</th>
                            <th className="text-left py-3 px-6 text-sm font-semibold text-gray-500">Tên môn học</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-500">Tín chỉ</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-500">CC (10%)</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-500">BT (15%)</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-500">GK (25%)</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-500">CK (50%)</th>
                            <th className="text-center py-3 px-4 text-sm font-bold text-gray-800">Hệ 10</th>
                            <th className="text-center py-3 px-4 text-sm font-bold text-amber-600">Hệ 4</th>
                            <th className="text-center py-3 px-6 text-sm font-semibold text-gray-500">Điểm chữ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {semesterGrades.map((grade) => (
                            <tr key={grade.MaDiem} className="hover:bg-amber-50/10 transition-colors">
                              <td className="py-3.5 px-6 text-sm font-mono text-gray-500">{grade.MaLopHocPhan || grade.MaMonHoc || 'N/A'}</td>
                              <td className="py-3.5 px-6 text-sm font-semibold text-gray-800">{grade.TenMonHoc}</td>
                              <td className="py-3.5 px-4 text-sm text-center font-semibold text-gray-600">{grade.SoTinChi || 0}</td>
                              <td className="py-3.5 px-4 text-sm text-center text-gray-500">{grade.DiemChuyenCan || '-'}</td>
                              <td className="py-3.5 px-4 text-sm text-center text-gray-500">{grade.DiemBaiTap || '-'}</td>
                              <td className="py-3.5 px-4 text-sm text-center text-gray-500">{grade.DiemGiuaKy || '-'}</td>
                              <td className="py-3.5 px-4 text-sm text-center text-gray-500">{grade.DiemCuoiKy || '-'}</td>
                              <td className="py-3.5 px-4 text-sm text-center font-bold text-gray-800">{grade.DiemTong || '-'}</td>
                              <td className="py-3.5 px-4 text-sm text-center font-bold text-amber-500">{grade.DiemGPA || '-'}</td>
                              <td className="py-3.5 px-6 text-sm text-center">
                                <span className={`inline-block px-3 py-1 rounded-lg font-bold text-sm border shadow-sm ${grade.DiemChu === 'A' || grade.DiemChu === 'A+' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  grade.DiemChu === 'B' || grade.DiemChu === 'B+' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    grade.DiemChu === 'C' || grade.DiemChu === 'C+' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                      grade.DiemChu === 'D' || grade.DiemChu === 'D+' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                        grade.DiemChu === 'F' ? 'bg-red-50 text-red-600 border-red-200' :
                                          'bg-gray-50 text-gray-700 border-gray-200'
                                  }`}>{grade.DiemChu || '-'}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Semester summary footer */}
                    <div className="bg-[#FFF7D6]/20 px-6 py-4 border-t border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-0.5">Điểm TB học kỳ</p>
                            <p className="text-lg font-black text-amber-500">{stats.semesterGPA}</p>
                          </div>
                          <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-0.5">Số TC tích lũy học kỳ</p>
                            <p className="text-lg font-bold text-gray-800">
                              {stats.earnedCredits} <span className="text-xs font-semibold text-gray-400">/ {stats.totalCredits} TC đăng ký</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-[#FFFFFF] rounded-2xl p-12 text-center shadow-sm border border-gray-200">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">Chưa có dữ liệu điểm</h3>
                <p className="text-[#6B7280]">Hệ thống chưa ghi nhận điểm số nào cho tài khoản của bạn.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Roadmap tab */}
        {activeTab === 'roadmap' && (
          <motion.div
            key="roadmap"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Graduation Progress Overview */}
            <div className="bg-[#FFFFFF] border border-gray-200 p-6 rounded-2xl shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Compass className="w-5 h-5 text-amber-500" />
                    Bản đồ tiến độ tốt nghiệp
                  </h3>
                  <p className="text-sm text-gray-500 font-medium mt-1">
                    Cơ cấu tích lũy chuẩn theo Khoa: <span className="font-bold text-gray-700">Đại cương (20%)</span> và <span className="font-bold text-gray-700">Chuyên ngành (80%)</span>
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <span className="text-2xl font-black text-amber-500">{cappedTotalCredits}</span>
                  <span className="text-sm text-gray-400 font-bold"> / {totalRequiredCredits} TC đạt chuẩn</span>
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                    {graduationProgressPercent}% Hoàn thành
                  </span>
                </div>
              </div>

              {/* Major Progress Bar */}
              <div className="space-y-3">
                <div className="w-full bg-gray-100/80 rounded-full h-4 overflow-hidden flex shadow-inner">
                  <div
                    title={`Đại cương: ${cappedGeneralCredits}/${requiredGeneralCredits} TC`}
                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{ width: `${(cappedGeneralCredits / totalRequiredCredits) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                  </div>
                  <div
                    title={`Chuyên ngành: ${cappedSpecialCredits}/${requiredSpecialCredits} TC`}
                    className="bg-gradient-to-r from-[#F4C542] to-[#f5d061] h-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{ width: `${(cappedSpecialCredits / totalRequiredCredits) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-500 justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-emerald-400 rounded-sm inline-block" />
                    <span>Đại cương (Cần đạt {requiredGeneralCredits} TC - Đạt {generalCreditsStats.earned} TC)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-[#F4C542] rounded-sm inline-block" />
                    <span>Chuyên ngành (Cần đạt {requiredSpecialCredits} TC - Đạt {specialCreditsStats.earned} TC)</span>
                  </div>
                </div>

                {/* Warning if over the standard credits but not fully distributed */}
                {(generalCreditsStats.earned > requiredGeneralCredits || specialCreditsStats.earned > requiredSpecialCredits) && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl flex gap-2 items-start mt-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      Bạn đã tích lũy vượt quá định mức của một số phân nhóm.
                      Hệ thống chỉ ghi nhận tối đa <span className="font-bold">{requiredGeneralCredits} TC</span> Đại cương và <span className="font-bold">{requiredSpecialCredits} TC</span> Chuyên ngành vào tổng số {totalRequiredCredits} TC xét tốt nghiệp.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Category split grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category 1: General Education */}
              <div className="bg-emerald-50/30 border border-emerald-100 p-6 rounded-2xl shadow-sm flex flex-col h-[650px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl"></div>
                <div className="relative z-10 flex justify-between items-center border-b border-emerald-100/50 pb-4 mb-4">
                  <div>
                    <h4 className="font-bold text-emerald-900 text-base">1. Môn học Đại cương</h4>
                    <p className="text-xs text-emerald-600/70 font-semibold uppercase mt-0.5">Tiêu chuẩn: {requiredGeneralCredits} tín chỉ</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-600">{generalCreditsStats.earned}</span>
                    <span className="text-xs text-emerald-600/60 font-bold">/{requiredGeneralCredits} TC</span>
                  </div>
                </div>

                <div className="relative z-10 flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                  {generalSubjects.map(sub => {
                    const info = getSubjectStatus(sub.MaMonHoc);
                    return (
                      <div key={sub.MaMonHoc} className="flex items-center justify-between p-3.5 bg-white hover:bg-emerald-50 border border-emerald-50 hover:border-emerald-200 rounded-xl hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
                        <div className="space-y-1 min-w-0 pr-2">
                          <p className="text-sm font-bold text-gray-800 truncate">{sub.TenMonHoc}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
                            <span className="font-mono text-blue-500">{sub.MaMonHoc}</span>
                            <span>•</span>
                            <span>{sub.SoTinChi} tín chỉ</span>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {info.status === 'PASSED' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg text-xs font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Đã đạt ({info.grade})
                            </span>
                          )}
                          {info.status === 'IN_PROGRESS' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-xs font-bold">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                              Đang học
                            </span>
                          )}
                          {info.status === 'FAILED' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-lg text-xs font-bold">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Học lại ({info.grade})
                            </span>
                          )}
                          {info.status === 'NOT_STARTED' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-bold">
                              Chưa học
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {generalSubjects.length === 0 && (
                    <p className="text-sm text-gray-400 font-medium text-center py-10">Không có dữ liệu môn đại cương.</p>
                  )}
                </div>
              </div>

              {/* Category 2: Specialization */}
              <div className="bg-amber-50/30 border border-amber-100 p-6 rounded-2xl shadow-sm flex flex-col h-[650px] relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl"></div>
                <div className="relative z-10 flex justify-between items-center border-b border-amber-100/50 pb-4 mb-4">
                  <div>
                    <h4 className="font-bold text-amber-900 text-base">2. Môn học Chuyên ngành</h4>
                    <p className="text-xs text-amber-600/70 font-semibold uppercase mt-0.5">Tiêu chuẩn: {requiredSpecialCredits} tín chỉ</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-amber-600">{specialCreditsStats.earned}</span>
                    <span className="text-xs text-amber-600/60 font-bold">/{requiredSpecialCredits} TC</span>
                  </div>
                </div>

                <div className="relative z-10 flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                  {specialSubjects.map(sub => {
                    const info = getSubjectStatus(sub.MaMonHoc);
                    return (
                      <div key={sub.MaMonHoc} className="flex items-center justify-between p-3.5 bg-white hover:bg-amber-50 border border-amber-50 hover:border-amber-200 rounded-xl hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
                        <div className="space-y-1 min-w-0 pr-2">
                          <p className="text-sm font-bold text-gray-800 truncate">{sub.TenMonHoc}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
                            <span className="font-mono text-blue-500">{sub.MaMonHoc}</span>
                            <span>•</span>
                            <span>{sub.SoTinChi} tín chỉ</span>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {info.status === 'PASSED' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg text-xs font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Đã đạt ({info.grade})
                            </span>
                          )}
                          {info.status === 'IN_PROGRESS' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-xs font-bold">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                              Đang học
                            </span>
                          )}
                          {info.status === 'FAILED' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-lg text-xs font-bold">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Học lại ({info.grade})
                            </span>
                          )}
                          {info.status === 'NOT_STARTED' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-bold">
                              Chưa học
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {specialSubjects.length === 0 && (
                    <p className="text-sm text-gray-400 font-medium text-center py-10">Không có dữ liệu môn chuyên ngành.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Forecast tab */}
        {activeTab === 'forecast' && (
          <motion.div
            key="forecast"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Goal-based Planner */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Inputs & Current Stats */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#FFFFFF] border border-gray-200 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="relative z-10">
                    <h4 className="font-bold text-[#1F2937] text-base border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                      <Compass className="w-5 h-5 text-blue-500" />
                      Mục tiêu tốt nghiệp
                    </h4>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Chọn nhanh xếp loại</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => setTargetGPA('3.8')} className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${targetGPA === '3.8' ? 'bg-gradient-to-r from-[#F4C542] to-[#f5d061] text-[#152238] shadow-md transform scale-[1.02]' : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100 hover:scale-[1.02]'}`}>Thủ khoa (3.8+)</button>
                          <button onClick={() => setTargetGPA('3.6')} className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${targetGPA === '3.6' ? 'bg-gradient-to-r from-[#F4C542] to-[#f5d061] text-[#152238] shadow-md transform scale-[1.02]' : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100 hover:scale-[1.02]'}`}>Xuất sắc (3.6+)</button>
                          <button onClick={() => setTargetGPA('3.2')} className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${targetGPA === '3.2' ? 'bg-gradient-to-r from-[#F4C542] to-[#f5d061] text-[#152238] shadow-md transform scale-[1.02]' : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100 hover:scale-[1.02]'}`}>Giỏi (3.2+)</button>
                          <button onClick={() => setTargetGPA('3.0')} className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${targetGPA === '3.0' ? 'bg-gradient-to-r from-[#F4C542] to-[#f5d061] text-[#152238] shadow-md transform scale-[1.02]' : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100 hover:scale-[1.02]'}`}>An toàn (3.0+)</button>
                          <button onClick={() => setTargetGPA('2.5')} className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${targetGPA === '2.5' ? 'bg-gradient-to-r from-[#F4C542] to-[#f5d061] text-[#152238] shadow-md transform scale-[1.02]' : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100 hover:scale-[1.02]'}`}>Khá (2.5+)</button>
                          <button onClick={() => setTargetGPA('2.0')} className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${targetGPA === '2.0' ? 'bg-gradient-to-r from-[#F4C542] to-[#f5d061] text-[#152238] shadow-md transform scale-[1.02]' : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100 hover:scale-[1.02]'}`}>Trung bình (2.0+)</button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Hoặc nhập điểm mục tiêu (Hệ 4)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="1.0"
                          max="4.0"
                          value={targetGPA}
                          onChange={(e) => setTargetGPA(e.target.value)}
                          placeholder="VD: 3.45"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-2xl font-black focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-[#152238] text-center transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-[#152238] to-[#1e2f4c] p-6 rounded-2xl shadow-lg text-white group">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#F4C542]/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                  <div className="relative z-10">
                    <h4 className="font-bold text-[#F4C542] text-sm uppercase tracking-wider mb-4 border-b border-gray-700 pb-3 flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Hành trang hiện tại
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 font-semibold mb-1 uppercase">GPA Tích lũy</p>
                        <p className="text-3xl font-black text-white">{cumulativeGPA}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-semibold mb-1 uppercase">Số TC tích lũy</p>
                        <p className="text-2xl font-bold text-white mt-1">{totalAccumulatedCredits} <span className="text-sm font-normal text-gray-400">/ {totalRequiredCredits} TC</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Calculations & Scenarios */}
              <div className="lg:col-span-8 flex">
                <div className="bg-[#FFFFFF] border border-gray-200 rounded-2xl shadow-sm w-full flex flex-col relative overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50/50 to-white rounded-t-2xl">
                    <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg shadow-sm">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      Phân tích lộ trình đạt mục tiêu
                    </h4>
                    <p className="text-sm text-gray-500 mt-1 ml-9">Dựa trên số tín chỉ còn lại và kết quả hiện tại của bạn.</p>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-center">
                    {(() => {
                      const goal = parseFloat(targetGPA);
                      if (!goal || isNaN(goal)) return (
                        <div className="text-center py-12">
                          <Calculator className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                          <h5 className="text-lg font-bold text-gray-700 mb-2">Chưa có mục tiêu</h5>
                          <p className="text-gray-500 text-sm max-w-md mx-auto">Vui lòng nhập hoặc chọn nhanh một điểm GPA mục tiêu ở cột bên trái để hệ thống phân tích lộ trình cần thiết cho bạn.</p>
                        </div>
                      );

                      const remainingCreditsToGrad = Math.max(0, totalRequiredCredits - totalAccumulatedCredits);

                      if (remainingCreditsToGrad === 0) {
                        return (
                          <div className="text-center py-12">
                            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                            <h5 className="text-xl font-bold text-gray-800 mb-2">Đã hoàn thành chương trình!</h5>
                            <p className="text-gray-500 text-sm">Bạn đã tích lũy đủ {totalRequiredCredits} tín chỉ. Không còn môn học nào cần lập kế hoạch.</p>
                          </div>
                        );
                      }

                      const requiredPoints = goal * totalRequiredCredits - totalGradePoints;
                      const requiredAverage = requiredPoints / remainingCreditsToGrad;

                      if (requiredAverage > 4.0) {
                        return (
                          <div className="text-center py-8 max-w-lg mx-auto">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                              <AlertCircle className="w-10 h-10 text-red-500" />
                            </div>
                            <h5 className="text-xl font-bold text-red-600 mb-2">Mục tiêu bất khả thi</h5>
                            <p className="text-gray-600 text-sm leading-relaxed">
                              Để đạt được GPA <strong>{goal}</strong>, bạn cần đạt điểm trung bình <strong>{requiredAverage.toFixed(2)}</strong> cho <strong>{remainingCreditsToGrad} tín chỉ</strong> còn lại.
                              Vì điểm tối đa của một môn chỉ là 4.0, mục tiêu này về mặt toán học là không thể. Bạn hãy cân nhắc điều chỉnh mức mục tiêu thấp hơn nhé!
                            </p>
                          </div>
                        );
                      }

                      if (requiredAverage <= 1.0) {
                        return (
                          <div className="text-center py-8 max-w-lg mx-auto">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Award className="w-10 h-10 text-green-500" />
                            </div>
                            <h5 className="text-xl font-bold text-emerald-600 mb-2">Nắm chắc trong tầm tay</h5>
                            <p className="text-gray-600 text-sm leading-relaxed">
                              Bạn đã tích lũy điểm số rất tốt! Bạn chỉ cần đạt điểm trung bình <strong>{requiredAverage.toFixed(2)}</strong> cho <strong>{remainingCreditsToGrad} tín chỉ</strong> còn lại.
                              Chỉ cần hoàn thành các môn học mà không rớt, bạn chắc chắn sẽ vượt mức mục tiêu <strong>{goal}</strong> này.
                            </p>
                          </div>
                        );
                      }

                      const averageCourses = Math.ceil(remainingCreditsToGrad / 3);

                      let safePlan = { aCount: 0, bPlusCount: 0, bCount: 0, cPlusCount: 0, cCount: 0 };
                      let pushPlan = { aCount: 0, bPlusCount: 0, bCount: 0, cPlusCount: 0, cCount: 0 };

                      if (requiredAverage >= 3.5) {
                        safePlan.aCount = Math.ceil((requiredAverage - 3.5) * 2 * averageCourses);
                        safePlan.bPlusCount = Math.max(0, averageCourses - safePlan.aCount);

                        pushPlan.aCount = Math.min(averageCourses, safePlan.aCount + 1);
                        pushPlan.bCount = Math.max(0, averageCourses - pushPlan.aCount);
                      } else if (requiredAverage >= 3.0) {
                        safePlan.bPlusCount = Math.ceil((requiredAverage - 3.0) * 2 * averageCourses);
                        safePlan.bCount = Math.max(0, averageCourses - safePlan.bPlusCount);

                        pushPlan.aCount = Math.ceil(safePlan.bPlusCount / 2);
                        pushPlan.bPlusCount = Math.max(0, safePlan.bPlusCount - pushPlan.aCount);
                        pushPlan.bCount = safePlan.bCount;
                      } else if (requiredAverage >= 2.5) {
                        safePlan.bCount = Math.ceil((requiredAverage - 2.5) * 2 * averageCourses);
                        safePlan.cPlusCount = Math.max(0, averageCourses - safePlan.bCount);

                        pushPlan.bPlusCount = Math.ceil(safePlan.bCount / 2);
                        pushPlan.bCount = Math.max(0, safePlan.bCount - pushPlan.bPlusCount);
                        pushPlan.cPlusCount = safePlan.cPlusCount;
                      } else {
                        safePlan.cPlusCount = Math.ceil((requiredAverage - 2.0) * 2 * averageCourses);
                        safePlan.cCount = Math.max(0, averageCourses - safePlan.cPlusCount);
                      }

                      const renderBadge = (grade, count, colorClass, borderClass, textClass) => {
                        if (count <= 0) return null;
                        return (
                          <div key={grade} className={`flex flex-col items-center justify-center p-3 rounded-xl border ${colorClass} ${borderClass}`}>
                            <span className={`text-2xl font-black ${textClass}`}>{grade}</span>
                            <span className="text-xs font-bold text-gray-600 mt-1">{count} môn</span>
                          </div>
                        );
                      };

                      return (
                        <div className="space-y-8 animate-fade-in">
                          {/* Summary Requirement */}
                          <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-6 bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                            <div>
                              <p className="text-sm text-gray-500 font-bold uppercase mb-1">GPA Trung bình cần đạt</p>
                              <div className="flex items-baseline gap-2">
                                <p className="text-4xl font-black text-blue-600">{requiredAverage.toFixed(2)}</p>
                                <p className="text-sm font-semibold text-gray-400">/ 4.0</p>
                              </div>
                            </div>
                            <div className="hidden md:block w-px h-12 bg-blue-200"></div>
                            <div>
                              <p className="text-sm text-gray-500 font-bold uppercase mb-1">Tín chỉ còn lại</p>
                              <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-black text-gray-800">{remainingCreditsToGrad}</p>
                                <p className="text-sm font-semibold text-gray-400">TC (~{averageCourses} môn)</p>
                              </div>
                            </div>
                          </div>

                          {/* Roadmaps */}
                          <div>
                            <h5 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                              <Award className="w-5 h-5 text-amber-500" />
                              Lộ trình đề xuất (mỗi môn giả định ~3 TC)
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Safe Plan */}
                              <div className="border border-gray-200 rounded-2xl p-5 hover:border-[#F4C542] hover:shadow-md transition-all bg-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                  <CheckCircle2 className="w-24 h-24 text-[#F4C542]" />
                                </div>
                                <h6 className="font-bold text-gray-800 mb-1 text-base">Lộ trình an toàn</h6>
                                <p className="text-xs text-gray-500 mb-4">Phân bổ đều nỗ lực, dễ đạt được nhất.</p>
                                <div className="grid grid-cols-3 gap-2 relative z-10">
                                  {renderBadge('A', safePlan.aCount, 'bg-emerald-50', 'border-emerald-100', 'text-emerald-600')}
                                  {renderBadge('B+', safePlan.bPlusCount, 'bg-blue-50', 'border-blue-100', 'text-blue-600')}
                                  {renderBadge('B', safePlan.bCount, 'bg-indigo-50', 'border-indigo-100', 'text-indigo-600')}
                                  {renderBadge('C+', safePlan.cPlusCount, 'bg-amber-50', 'border-amber-100', 'text-amber-600')}
                                  {renderBadge('C', safePlan.cCount, 'bg-gray-50', 'border-gray-200', 'text-gray-600')}
                                </div>
                              </div>

                              {/* Push Plan */}
                              <div className="border border-gray-200 rounded-2xl p-5 hover:border-emerald-400 hover:shadow-md transition-all bg-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                  <TrendingUp className="w-24 h-24 text-emerald-500" />
                                </div>
                                <h6 className="font-bold text-gray-800 mb-1 text-base">Lộ trình bứt phá</h6>
                                <p className="text-xs text-gray-500 mb-4">Tập trung môn điểm cao để bù đắp môn khó.</p>
                                <div className="grid grid-cols-3 gap-2 relative z-10">
                                  {renderBadge('A', pushPlan.aCount, 'bg-emerald-50', 'border-emerald-100', 'text-emerald-600')}
                                  {renderBadge('B+', pushPlan.bPlusCount, 'bg-blue-50', 'border-blue-100', 'text-blue-600')}
                                  {renderBadge('B', pushPlan.bCount, 'bg-indigo-50', 'border-indigo-100', 'text-indigo-600')}
                                  {renderBadge('C+', pushPlan.cPlusCount, 'bg-amber-50', 'border-amber-100', 'text-amber-600')}
                                  {renderBadge('C', pushPlan.cCount, 'bg-gray-50', 'border-gray-200', 'text-gray-600')}
                                </div>
                              </div>
                            </div>
                          </div>

                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default StudentGrades;
